import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const surveyRouter = createTRPCRouter({
    create: protectedProcedure
        .input(z.object({
            title: z.string(),
            description: z.string().optional(),
            icon: z.string().optional(),
            color: z.string().optional(),
            questions: z.array(z.object({
                question: z.string(),
                type: z.string(),
                options: z.array(z.string()).optional(),
                required: z.boolean().default(false),
                order: z.number().optional()
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const business = await ctx.db.business.findFirst({
                where: { ownerId: userId }
            });

            if (!business) {
                throw new Error("No business found for user");
            }

            return ctx.db.survey.create({
                data: {
                    businessId: business.id,
                    title: input.title,
                    description: input.description,
                    icon: input.icon,
                    color: input.color,
                    questions: {
                        create: input.questions.map((q, index) => ({
                            question: q.question,
                            type: q.type,
                            options: q.options || [],
                            required: q.required,
                            order: q.order ?? index
                        }))
                    }
                }
            });
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().optional(),
            icon: z.string().optional(),
            color: z.string().optional(),
            questions: z.array(z.object({
                id: z.string().optional(),
                question: z.string(),
                type: z.string(),
                options: z.array(z.string()).optional(),
                required: z.boolean().default(false),
                order: z.number().optional()
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.$transaction(async (tx) => {
                // 1. Update Survey Basic Info
                const survey = await tx.survey.update({
                    where: { id: input.id },
                    data: {
                        title: input.title,
                        description: input.description,
                        icon: input.icon,
                        color: input.color,
                    }
                });

                // 2. Handle Questions
                // Get existing questions to know what to delete
                const existingQuestions = await tx.surveyQuestion.findMany({
                    where: { surveyId: input.id },
                    select: { id: true }
                });
                const existingIds = existingQuestions.map(q => q.id);

                const inputIds = input.questions.map(q => q.id).filter((id): id is string => !!id);

                // Identify questions to delete (present in DB but not in input)
                const toDelete = existingIds.filter(id => !inputIds.includes(id));

                if (toDelete.length > 0) {
                    await tx.surveyQuestion.deleteMany({
                        where: { id: { in: toDelete } }
                    });
                }

                // Upsert questions (Update existing, Create new)
                for (const q of input.questions) {
                    if (q.id && existingIds.includes(q.id)) {
                        await tx.surveyQuestion.update({
                            where: { id: q.id },
                            data: {
                                question: q.question,
                                type: q.type,
                                options: q.options || [],
                                required: q.required,
                                order: q.order // Will use existing order if undefined or can pass index if needed, but here we trust input order or separate logic
                            }
                        });
                    } else {
                        await tx.surveyQuestion.create({
                            data: {
                                surveyId: input.id,
                                question: q.question,
                                type: q.type,
                                options: q.options || [],
                                required: q.required,
                                order: q.order
                            }
                        });
                    }
                }

                return survey;
            });
        }),

    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.session.user.id;
            const business = await ctx.db.business.findFirst({
                where: { ownerId: userId }
            });

            if (!business) return [];

            return ctx.db.survey.findMany({
                where: { businessId: business.id },
                include: {
                    _count: {
                        select: { responses: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.survey.findUnique({
                where: { id: input.id },
                include: {
                    questions: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.survey.delete({
                where: { id: input.id }
            });
        }),

    toggleStatus: protectedProcedure
        .input(z.object({ id: z.string(), isActive: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.survey.update({
                where: { id: input.id },
                data: { isActive: input.isActive }
            });
        }),

    getPublic: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const survey = await ctx.db.survey.findUnique({
                where: { id: input.id },
                include: {
                    questions: {
                        orderBy: { order: 'asc' }
                    }
                }
            });

            if (survey) {
                // Fire and forget view increment
                try {
                    await ctx.db.survey.update({
                        where: { id: survey.id },
                        data: { views: { increment: 1 } }
                    });
                } catch (e) {
                    // Ignore error
                }
            }
            return survey;
        }),

    submitResponse: publicProcedure
        .input(z.object({
            surveyId: z.string(),
            answers: z.record(z.string(), z.union([z.string(), z.array(z.string())]))
        }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.surveyResponse.create({
                data: {
                    surveyId: input.surveyId,
                    answers: {
                        create: Object.entries(input.answers).map(([questionId, answer]) => ({
                            questionId,
                            answer: Array.isArray(answer) ? JSON.stringify(answer) : answer
                        }))
                    }
                }
            });
        }),

    getResponses: protectedProcedure
        .input(z.object({ surveyId: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.surveyResponse.findMany({
                where: { surveyId: input.surveyId },
                include: {
                    answers: {
                        include: { question: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        })
});
