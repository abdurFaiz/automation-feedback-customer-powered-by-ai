import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
    createTRPCRouter,
    protectedProcedure,
} from "@/server/api/trpc";

const createDatasetSchema = z.object({
    name: z.string().min(1),
    fileUrl: z.string().url(),
    description: z.string().optional(),
    surveyId: z.string().optional(),
});

const processDatasetSchema = z.object({
    datasetId: z.string(),
});

const getDatasetDataSchema = z.object({
    datasetName: z.string(),
});

export const datasetRouter = createTRPCRouter({
    // List all datasets for the current user
    list: protectedProcedure
        .query(async ({ ctx }) => {
            try {
                const datasets = await ctx.db.dataset.findMany({
                    where: {
                        business: {
                            ownerId: ctx.session.user.id,
                        },
                    },
                    include: {
                        business: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

                return datasets;
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch datasets",
                    cause: error,
                });
            }
        }),

    // Create a new dataset
    create: protectedProcedure
        .input(createDatasetSchema)
        .mutation(async ({ ctx, input }) => {
            try {
                // Get user's first business or create one
                let business = await ctx.db.business.findFirst({
                    where: {
                        ownerId: ctx.session.user.id,
                    },
                });

                if (!business) {
                    business = await ctx.db.business.create({
                        data: {
                            name: "Default Business",
                            ownerId: ctx.session.user.id,
                        },
                    });
                }

                const dataset = await ctx.db.dataset.create({
                    data: {
                        name: input.name,
                        fileUrl: input.fileUrl,
                        description: input.description,
                        businessId: business.id,
                        status: "PENDING",
                        fileType: input.name.endsWith('.csv') ? 'text/csv' : 'application/octet-stream',
                        uploadedBy: ctx.session.user.id,
                        surveyId: input.surveyId,
                    },
                });

                return dataset;
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create dataset",
                    cause: error,
                });
            }
        }),



    // Get a specific dataset by ID with full details (including Survey if linked)
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const dataset = await ctx.db.dataset.findFirst({
                where: {
                    id: input.id,
                    business: {
                        ownerId: ctx.session.user.id,
                    },
                },
                include: {
                    business: true,
                    survey: {
                        include: {
                            questions: {
                                orderBy: { order: 'asc' }
                            },
                            responses: {
                                include: {
                                    answers: {
                                        include: {
                                            question: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            });

            if (!dataset) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Dataset not found",
                });
            }

            return dataset;
        }),

    // Process a dataset (convert to reviews)
    process: protectedProcedure
        .input(processDatasetSchema)
        .mutation(async ({ ctx, input }) => {
            try {
                const dataset = await ctx.db.dataset.findFirst({
                    where: {
                        id: input.datasetId,
                        business: {
                            ownerId: ctx.session.user.id,
                        },
                    },
                    include: {
                        business: true,
                    },
                });

                if (!dataset) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Dataset not found",
                    });
                }

                // Update status to processing
                await ctx.db.dataset.update({
                    where: { id: dataset.id },
                    data: { status: "PROCESSING" },
                });

                // dynamic import to avoid circular dep issues if any, or just standard import
                const { analyzeReview } = await import("@/lib/ai/processor");

                const errors: string[] = [];
                let processedCount = 0;

                try {
                    // Simulate CSV Parsing - In a real app we would fetch dataset.fileUrl and parse it
                    // Here we provide a diverse set of raw reviews to demonstrate the AI capabilities
                    const rawReviews = [
                        { customerName: "John Doe", text: "The coffee was fantastic and the wifi was super fast. Perfect for working!", source: "GOOGLE_MAPS" as const, rating: 5 },
                        { customerName: "Sara Smith", text: "Waited 45 minutes for my food. The pasta was cold when it arrived. Terrible service.", source: "GOOGLE_MAPS" as const, rating: 1 },
                        { customerName: "Mike Johnson", text: "Nice ambiance, but the music was a bit too loud. Prices are okay.", source: "INSTAGRAM" as const, rating: 3 },
                        { customerName: "Emily Davis", text: "Best tiramisu in town! The staff was very attentive.", source: "GOOGLE_MAPS" as const, rating: 5 },
                        { customerName: "David Wilson", text: "Dirty tables and rude waiter. Never coming back.", source: "TWITTER" as const, rating: 1 },
                        { customerName: "Anna Brown", text: "Love the new menu! The vegan options are great.", source: "FACEBOOK" as const, rating: 5 },
                        { customerName: "Chris Martin", text: "It's a bit pricey for the portion size, but the taste is good.", source: "GOOGLE_MAPS" as const, rating: 3 },
                    ];

                    for (const row of rawReviews) {
                        try {
                            // 1. Analyze with AI
                            const analysis = await analyzeReview(row.text, dataset.business.name);

                            // 2. Find or Create Category
                            // Normalize category name (e.g. "FOOD" -> "Food")
                            const categoryName = analysis.primaryCategory.charAt(0) + analysis.primaryCategory.slice(1).toLowerCase();

                            let category = await ctx.db.category.findUnique({
                                where: { name: categoryName }
                            });

                            if (!category) {
                                category = await ctx.db.category.create({
                                    data: {
                                        name: categoryName,
                                        description: `Auto-generated category for ${categoryName}`
                                    }
                                });
                            }

                            // 3. Create Review
                            const review = await ctx.db.review.create({
                                data: {
                                    businessId: dataset.businessId,
                                    customerName: row.customerName,
                                    comment: row.text,
                                    rating: row.rating,
                                    source: row.source,
                                    reviewDate: new Date(),

                                    // AI Data
                                    aiAnalyzed: true,
                                    aiAnalyzedAt: new Date(),
                                    sentimentType: analysis.sentiment, // Matches enum if schema matches
                                    sentimentScore: analysis.score,
                                    // We could map keywords to something if we had a tags field, 
                                    // but currently schema has ReviewCategory for categorization
                                }
                            });

                            // 4. Link Category
                            await ctx.db.reviewCategory.create({
                                data: {
                                    reviewId: review.id,
                                    categoryId: category.id,
                                    confidence: 0.9 // Static high confidence for now
                                }
                            });

                            // 5. Create Insight if actionable
                            if (analysis.actionableInsight) {
                                await ctx.db.actionableInsight.create({
                                    data: {
                                        businessId: dataset.businessId,
                                        customerInput: row.text,
                                        aiSolution: analysis.actionableInsight,
                                        categoryId: category.id,
                                        impactLevel: analysis.isUrgent ? 'HIGH' : 'MEDIUM',
                                        status: 'PENDING',
                                        confidence: analysis.score
                                    }
                                });
                            }

                            processedCount++;
                        } catch (err) {
                            console.error("Error processing review row:", err);
                            errors.push(`Failed to process review from ${row.customerName}`);
                        }
                    }

                    // Update dataset status
                    await ctx.db.dataset.update({
                        where: { id: dataset.id },
                        data: {
                            status: errors.length > 0 && processedCount === 0 ? "FAILED" : "COMPLETED",
                            rowCount: processedCount,
                            errorMessage: errors.length > 0 ? errors.join('; ') : null,
                            processedAt: new Date(),
                        },
                    });

                } catch (processingError) {
                    // ... error handling
                    throw processingError;
                }

                return {
                    success: errors.length === 0,
                    processedCount,
                    errors,
                };
            } catch (error) {
                console.error("Dataset processing error:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to process dataset",
                    cause: error,
                });
            }
        }),

    // Get dataset data for preview
    getData: protectedProcedure
        .input(getDatasetDataSchema)
        .query(async ({ ctx, input }) => {
            try {
                // Find the dataset
                const dataset = await ctx.db.dataset.findFirst({
                    where: {
                        name: input.datasetName,
                        business: {
                            ownerId: ctx.session.user.id,
                        },
                    },
                    include: {
                        business: true,
                    },
                });

                if (!dataset) {
                    return [];
                }

                // Return associated reviews for preview
                const reviews = await ctx.db.review.findMany({
                    where: {
                        businessId: dataset.businessId,
                        source: "MANUAL", // Reviews created from this dataset
                    },
                    take: 50,
                    orderBy: {
                        createdAt: "desc",
                    },
                });

                return reviews;
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to get dataset data",
                    cause: error,
                });
            }
        }),

    // Delete a dataset
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            try {
                const dataset = await ctx.db.dataset.findFirst({
                    where: {
                        id: input.id,
                        business: {
                            ownerId: ctx.session.user.id,
                        },
                    },
                });

                if (!dataset) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Dataset not found",
                    });
                }

                await ctx.db.dataset.delete({
                    where: { id: input.id },
                });

                return { success: true };
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to delete dataset",
                    cause: error,
                });
            }
        }),
});