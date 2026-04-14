import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const analyticsRouter = createTRPCRouter({
    getStats: protectedProcedure
        .input(z.object({ period: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            // Get user's business
            const business = await ctx.db.business.findFirst({
                where: { ownerId: ctx.session.user.id }
            });

            if (!business) {
                return {
                    totalReviews: 0,
                    totalReviewsTrend: { value: "0%", isPositive: true },
                    avgRating: 0,
                    avgRatingTrend: { value: "0.0", isPositive: true },
                    sentiments: [],
                    topRecommendation: null
                };
            }

            const now = new Date();
            let startDate = new Date();
            let endDate: Date | undefined = undefined;
            let priorStartDate = new Date();
            let priorEndDate: Date | undefined = undefined;

            const period = input.period || "This Month";

            if (period === "This Month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                // Trend: Last Month
                priorStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                priorEndDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of prev month
            } else if (period === "Last Month") {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                // Trend: 2 Months Ago
                priorStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                priorEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
            } else if (period === "This Quarter") {
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterMonth, 1);
                // Trend: Previous Quarter
                priorStartDate = new Date(now.getFullYear(), quarterMonth - 3, 1);
                priorEndDate = new Date(now.getFullYear(), quarterMonth, 0);
            } else {
                // Default: Last 30 Days
                startDate.setDate(now.getDate() - 30);
                priorStartDate.setDate(now.getDate() - 60);
                priorEndDate = new Date();
                priorEndDate.setDate(now.getDate() - 30);
            }

            const currentFilter = { gte: startDate, ...(endDate ? { lte: endDate } : {}) };
            const priorFilter = { gte: priorStartDate, ...(priorEndDate ? { lte: priorEndDate } : {}) };

            // --- 1. Fetch Counts ---

            // Impact Velocity: Baseline vs Current
            // Baseline: 30 days prior to the Start of the selected period.
            // Current: The selected period.

            // Re-calculate Prior Start/End specifically for Baseline (30 days before current Start)
            const baselineEndDate = new Date(startDate);
            baselineEndDate.setDate(baselineEndDate.getDate() - 1); // Day before start
            const baselineStartDate = new Date(baselineEndDate);
            baselineStartDate.setDate(baselineStartDate.getDate() - 30); // 30 day window

            // We override `priorFilter` for the Rating Comparison to use this fixed 30-day baseline
            // strictly for the "Impact Velocity" concept (Pre-intervention vs Post-intervention window).
            // However, the `priorFilter` computed above (getPreviousDateFilter) matches the *duration* of the current period,
            // which is standard for "period over period" growth.
            // The user requested: "Ambil rata-rata sentimen/rating 30 hari ke belakang... Ini memberikan potret masalah yang cukup stabil".
            // So for RATING TREND, we should use this 30-day baseline. 
            // For VOLUME TREND, standard period-over-period is usually better.

            const ratingBaselineFilter = { gte: baselineStartDate, lte: baselineEndDate };

            // A. Reviews (Processed)
            const [reviewsTotal, reviewsCurrent, reviewsPrior, reviewsBaseline] = await Promise.all([
                ctx.db.review.count({ where: { businessId: business.id } }), // Total All Time
                ctx.db.review.count({ where: { businessId: business.id, reviewDate: currentFilter } }),
                ctx.db.review.count({ where: { businessId: business.id, reviewDate: priorFilter } }),
                ctx.db.review.count({ where: { businessId: business.id, reviewDate: ratingBaselineFilter } })
            ]);
            // To clarify: "Total Reviews" on the card usually implies "Total Reviews IN THIS PERIOD".
            // The original code calculated `reviewsTotal` as "All Time" but `volumeTrendValue` based on 30days.
            // I should stick to "In this period" for the main number.

            // B. Google Maps Reviews (Unsynced)
            const gmapsWhere = {
                gmapsPlace: { businessId: business.id },
                syncedToReview: false
            };
            const [gmapsCurrent, gmapsPrior] = await Promise.all([
                ctx.db.googleMapsReview.count({ where: { ...gmapsWhere, timePosted: currentFilter } }),
                ctx.db.googleMapsReview.count({ where: { ...gmapsWhere, timePosted: priorFilter } })
            ]);

            // C. Survey Responses
            const surveyWhere = {
                survey: { businessId: business.id }
            };
            const [surveysCurrent, surveysPrior] = await Promise.all([
                ctx.db.surveyResponse.count({ where: { ...surveyWhere, createdAt: currentFilter } }),
                ctx.db.surveyResponse.count({ where: { ...surveyWhere, createdAt: priorFilter } })
            ]);

            // --- Aggregate Volume ---
            const volumeCurrent = reviewsCurrent + gmapsCurrent + surveysCurrent;
            const volumePrior = reviewsPrior + gmapsPrior + surveysPrior;

            let volumeTrendValue = "0%";
            let volumeIsPositive = true;

            if (volumePrior === 0) {
                if (volumeCurrent > 0) volumeTrendValue = "+100%";
            } else {
                const change = ((volumeCurrent - volumePrior) / volumePrior) * 100;
                volumeTrendValue = `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
                volumeIsPositive = change >= 0;
            }

            // --- 2. Calculate Avg Rating (Weighted) ---

            // Review Ratings
            const [reviewAvgCurrentAgg, reviewAvgBaselineAgg] = await Promise.all([
                ctx.db.review.aggregate({ where: { businessId: business.id, reviewDate: currentFilter }, _avg: { rating: true } }),
                ctx.db.review.aggregate({ where: { businessId: business.id, reviewDate: ratingBaselineFilter }, _avg: { rating: true } })
            ]);

            // Gmaps Ratings (Unsynced)
            const [gmapsAvgCurrentAgg, gmapsAvgBaselineAgg] = await Promise.all([
                ctx.db.googleMapsReview.aggregate({ where: { ...gmapsWhere, timePosted: currentFilter }, _avg: { rating: true } }),
                ctx.db.googleMapsReview.aggregate({ where: { ...gmapsWhere, timePosted: ratingBaselineFilter }, _avg: { rating: true } })
            ]);

            const calcWeightedAvg = (countA: number, avgA: number | null, countB: number, avgB: number | null) => {
                const valA = avgA || 0;
                const valB = avgB || 0;
                const totalCount = countA + countB;
                if (totalCount === 0) return 0;
                return ((valA * countA) + (valB * countB)) / totalCount;
            };

            const currentAvg = calcWeightedAvg(reviewsCurrent, reviewAvgCurrentAgg._avg.rating, gmapsCurrent, gmapsAvgCurrentAgg._avg.rating);

            // Recalculate counts for the baseline period to get weighted avg
            const [reviewsBaselineCount, gmapsBaselineCount] = await Promise.all([
                ctx.db.review.count({ where: { businessId: business.id, reviewDate: ratingBaselineFilter } }),
                ctx.db.googleMapsReview.count({ where: { ...gmapsWhere, timePosted: ratingBaselineFilter } })
            ]);

            const priorAvg = calcWeightedAvg(reviewsBaselineCount, reviewAvgBaselineAgg._avg.rating, gmapsBaselineCount, gmapsAvgBaselineAgg._avg.rating);

            let ratingTrendValue = "Stable";
            let ratingIsPositive = true;

            if (currentAvg > 0 && priorAvg === 0) {
                ratingTrendValue = "+New";
            } else if (currentAvg > 0 && priorAvg > 0) {
                // Impact Velocity Logic
                // 1. Volume Threshold: Need > 5 reviews to be statistically significant?
                const volumeThreshold = 5;
                const totalCurrentVolume = reviewsCurrent + gmapsCurrent + surveysCurrent;

                // 2. Time Threshold: If volume is low, have we waited enough (e.g. 14 days) to show *something*?
                // For "This Month" or specific ranges, we just show what we have.
                // But for the trend direction, we can be strict or loose.

                const diff = currentAvg - priorAvg;

                // If extremely low volume (< 5), the trend is volatile. 
                // We'll still show it but maybe considered "low confidence" internally. 
                // For UI simplicity, we just show the diff.

                if (Math.abs(diff) < 0.1) {
                    ratingTrendValue = "Stable";
                } else {
                    const sign = diff > 0 ? '+' : '';
                    ratingTrendValue = `${sign}${diff.toFixed(1)}`;
                    ratingIsPositive = diff >= 0;
                }
            }

            // --- 3. Other Data ---
            // Sentiment breakdown (Only from processed Reviews in current period)
            const sentiments = await ctx.db.review.groupBy({
                by: ['sentimentType'],
                where: { businessId: business.id, reviewDate: currentFilter },
                _count: true
            });

            // Get Top Recommendation (Global or recent? Usually global pending items are most important regardless of when created, or maybe recent ones?)
            // Let's keep it simply pending high impact ones, maybe filtered by creation date if wanted, but "Top Recommendation" usually implies current state.
            // We'll leave it as finding the top PENDING insight.
            const topInsight = await ctx.db.actionableInsight.findFirst({
                where: {
                    businessId: business.id,
                    status: 'PENDING'
                },
                orderBy: [
                    { impactLevel: 'asc' },
                    { createdAt: 'desc' }
                ]
            });

            return {
                totalReviews: volumeCurrent,
                totalReviewsTrend: { value: volumeTrendValue, isPositive: volumeIsPositive },
                avgRating: currentAvg || 0,
                avgRatingTrend: { value: ratingTrendValue, isPositive: ratingIsPositive },
                sentiments: sentiments.map(s => ({ sentiment: s.sentimentType, count: s._count })),
                topRecommendation: topInsight ? {
                    action: topInsight.aiSolution,
                    date: topInsight.createdAt
                } : null
            };
        }),

    getDailyVolume: protectedProcedure
        .input(z.object({ period: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            const business = await ctx.db.business.findFirst({
                where: { ownerId: ctx.session.user.id }
            });

            if (!business) return [];

            const now = new Date();
            let startDate = new Date();
            let endDate: Date | undefined = undefined;
            const period = input.period || "This Month";

            if (period === "This Month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (period === "Last Month") {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            } else if (period === "This Quarter") {
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterMonth, 1);
            } else {
                startDate.setDate(now.getDate() - 30);
            }

            const dateFilter = { gte: startDate, ...(endDate ? { lte: endDate } : {}) };

            // 1. Reviews
            const reviews = await ctx.db.review.findMany({
                where: { businessId: business.id, reviewDate: dateFilter },
                select: { reviewDate: true }
            });

            // 2. Gmaps (Unsynced)
            const gmapsReviews = await ctx.db.googleMapsReview.findMany({
                where: {
                    gmapsPlace: { businessId: business.id },
                    syncedToReview: false,
                    timePosted: dateFilter
                },
                select: { timePosted: true }
            });

            // 3. Surveys
            const surveyResponses = await ctx.db.surveyResponse.findMany({
                where: {
                    survey: { businessId: business.id },
                    createdAt: dateFilter
                },
                select: { createdAt: true }
            });

            // Group by day
            const volumeByDay: Record<string, number> = {};

            const addToMap = (date: Date) => {
                const day = date.toISOString().split('T')[0];
                if (day) volumeByDay[day] = (volumeByDay[day] || 0) + 1;
            };

            reviews.forEach(r => addToMap(r.reviewDate));
            gmapsReviews.forEach(r => addToMap(r.timePosted));
            surveyResponses.forEach(r => addToMap(r.createdAt));

            return Object.entries(volumeByDay)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));
        }),

    getUrgentIssues: protectedProcedure
        .input(z.object({ period: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            const business = await ctx.db.business.findFirst({
                where: { ownerId: ctx.session.user.id }
            });

            if (!business) return [];

            const now = new Date();
            let startDate = new Date();
            let endDate: Date | undefined = undefined;
            const period = input.period || "This Month";

            if (period === "This Month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (period === "Last Month") {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            } else if (period === "This Quarter") {
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterMonth, 1);
            } else {
                startDate.setDate(now.getDate() - 30);
            }

            const dateFilter = { gte: startDate, ...(endDate ? { lte: endDate } : {}) };

            // Fetch Negative Reviews & Surveys with Relevance Filter
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const [reviews, surveys] = await Promise.all([
                ctx.db.review.findMany({
                    where: {
                        businessId: business.id,
                        sentimentType: 'NEGATIVE',
                        reviewDate: { gte: oneYearAgo }, // Relevance Cutoff
                        OR: [
                            { reviewDate: dateFilter },
                            { aiAnalyzedAt: dateFilter }
                        ]
                    },
                    select: {
                        categories: {
                            select: { category: { select: { name: true } } }
                        }
                    }
                }),
                ctx.db.surveyResponse.findMany({
                    where: {
                        survey: { businessId: business.id },
                        sentimentType: 'NEGATIVE',
                        createdAt: dateFilter // Surveys are always "new" when created
                    },
                    select: {
                        categories: {
                            select: { category: { select: { name: true } } }
                        }
                    }
                })
            ]);

            // Aggregate Counts by Category
            const categoryCounts: Record<string, number> = {};

            const processCategories = (items: { categories: { category: { name: string } }[] }[]) => {
                items.forEach(item => {
                    item.categories.forEach(c => {
                        const name = c.category.name;
                        categoryCounts[name] = (categoryCounts[name] || 0) + 1;
                    });
                });
            };

            processCategories(reviews);
            processCategories(surveys);

            const enrichedIssues = Object.entries(categoryCounts)
                .map(([issue, count]) => ({ issue, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Start with top 5

            return enrichedIssues;
        }),

    getCategoricalSentiment: protectedProcedure
        .input(z.object({ period: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            try {
                const business = await ctx.db.business.findFirst({
                    where: { ownerId: ctx.session.user.id }
                });

                if (!business) return { data: [], silentForecast: [] };

                const now = new Date();
                let startDate = new Date();
                let endDate: Date | undefined = undefined;
                const period = input.period || "This Month";

                if (period === "This Month") {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                } else if (period === "Last Month") {
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                } else if (period === "This Quarter") {
                    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                    startDate = new Date(now.getFullYear(), quarterMonth, 1);
                } else {
                    startDate.setDate(now.getDate() - 30);
                }

                const dateFilter = { gte: startDate, ...(endDate ? { lte: endDate } : {}) };

                const categories = await ctx.db.category.findMany();

                const result = await Promise.all(categories.map(async (category) => {
                    // Count positive
                    const [posReviews, posSurveys] = await Promise.all([
                        ctx.db.review.count({
                            where: {
                                businessId: business.id,
                                OR: [
                                    { reviewDate: dateFilter },
                                    { aiAnalyzedAt: dateFilter }
                                ],
                                sentimentType: 'POSITIVE',
                                categories: { some: { categoryId: category.id } }
                            }
                        }),
                        ctx.db.surveyResponse.count({
                            where: {
                                survey: { businessId: business.id },
                                createdAt: dateFilter,
                                sentimentType: 'POSITIVE',
                                categories: { some: { categoryId: category.id } }
                            }
                        })
                    ]);

                    // Count negative
                    const [negReviews, negSurveys] = await Promise.all([
                        ctx.db.review.count({
                            where: {
                                businessId: business.id,
                                OR: [
                                    { reviewDate: dateFilter },
                                    { aiAnalyzedAt: dateFilter }
                                ],
                                sentimentType: 'NEGATIVE',
                                categories: { some: { categoryId: category.id } }
                            }
                        }),
                        ctx.db.surveyResponse.count({
                            where: {
                                survey: { businessId: business.id },
                                createdAt: dateFilter,
                                sentimentType: 'NEGATIVE',
                                categories: { some: { categoryId: category.id } }
                            }
                        })
                    ]);

                    // Count neutral
                    const [neuReviews, neuSurveys] = await Promise.all([
                        ctx.db.review.count({
                            where: {
                                businessId: business.id,
                                OR: [
                                    { reviewDate: dateFilter },
                                    { aiAnalyzedAt: dateFilter }
                                ],
                                sentimentType: 'NEUTRAL',
                                categories: { some: { categoryId: category.id } }
                            }
                        }),
                        ctx.db.surveyResponse.count({
                            where: {
                                survey: { businessId: business.id },
                                createdAt: dateFilter,
                                sentimentType: 'NEUTRAL',
                                categories: { some: { categoryId: category.id } }
                            }
                        })
                    ]);

                    // Get Oldest Negative Date (for Aging Analysis) & Neutral Trend (for Silent Issue)
                    const [oldestReview, oldestSurvey] = await Promise.all([
                        ctx.db.review.findFirst({
                            where: {
                                businessId: business.id,
                                sentimentType: 'NEGATIVE',
                                categories: { some: { categoryId: category.id } },
                                reviewDate: dateFilter
                            },
                            orderBy: { reviewDate: 'asc' },
                            select: { reviewDate: true }
                        }),
                        ctx.db.surveyResponse.findFirst({
                            where: {
                                survey: { businessId: business.id },
                                sentimentType: 'NEGATIVE',
                                categories: { some: { categoryId: category.id } },
                                createdAt: dateFilter
                            },
                            orderBy: { createdAt: 'asc' },
                            select: { createdAt: true }
                        })
                    ]);

                    let firstNegativeAt = null;
                    if (oldestReview && oldestSurvey) {
                        firstNegativeAt = oldestReview.reviewDate < oldestSurvey.createdAt ? oldestReview.reviewDate : oldestSurvey.createdAt;
                    } else if (oldestReview) {
                        firstNegativeAt = oldestReview.reviewDate;
                    } else if (oldestSurvey) {
                        firstNegativeAt = oldestSurvey.createdAt;
                    }

                    // Neutral Trend (Silent Issue)
                    // Calculate previous period dates manually
                    let prevStartDate = new Date(startDate);
                    let prevEndDate: Date | undefined = undefined;

                    if (period === "This Month") {
                        // Previous month
                        prevStartDate.setMonth(startDate.getMonth() - 1);
                        prevEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
                    } else if (period === "Last Month") {
                        // Month before last
                        prevStartDate.setMonth(startDate.getMonth() - 1);
                        prevEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
                    } else if (period === "This Quarter") {
                        // Previous quarter
                        prevStartDate.setMonth(startDate.getMonth() - 3);
                        prevEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
                    } else {
                        // Default to shifting back same duration (approx 30 days)
                        prevStartDate.setDate(startDate.getDate() - 30);
                        if (endDate) {
                            prevEndDate = new Date(endDate);
                            prevEndDate.setDate(prevEndDate.getDate() - 30);
                        }
                    }

                    const prevFilter = { gte: prevStartDate, ...(prevEndDate ? { lte: prevEndDate } : {}) };

                    const [prevNeuReviews, prevNeuSurveys] = await Promise.all([
                        ctx.db.review.count({
                            where: {
                                businessId: business.id,
                                sentimentType: 'NEUTRAL',
                                categories: { some: { categoryId: category.id } },
                                reviewDate: prevFilter
                            }
                        }),
                        ctx.db.surveyResponse.count({
                            where: {
                                survey: { businessId: business.id },
                                sentimentType: 'NEUTRAL',
                                categories: { some: { categoryId: category.id } },
                                createdAt: prevFilter
                            }
                        })
                    ]);

                    const currentNeutral = neuReviews + neuSurveys;
                    const prevNeutral = prevNeuReviews + prevNeuSurveys;
                    const neutralGrowth = prevNeutral > 0 ? ((currentNeutral - prevNeutral) / prevNeutral) * 100 : (currentNeutral > 0 ? 100 : 0);

                    return {
                        category: category.name,
                        positive: posReviews + posSurveys,
                        negative: negReviews + negSurveys,
                        neutral: currentNeutral,
                        firstNegativeAt: firstNegativeAt ? firstNegativeAt.toISOString() : null,
                        neutralTrend: neutralGrowth // Percent growth
                    };
                }));

                // Filter out empty categories
                const activeCategories = result.filter(r => r.positive + r.negative + r.neutral > 0);

                // "Silent Issue" Logic:
                // Find categories with High Neutral volume + High Growth, but Low Negative (so it's not yet a crisis).
                const silentForecast = activeCategories
                    .filter(c => c.neutral > 2 && c.neutralTrend > 20 && c.negative < 5) // Thresholds
                    .sort((a, b) => b.neutralTrend - a.neutralTrend)
                    .slice(0, 3)
                    .map(c => ({
                        category: c.category,
                        growth: c.neutralTrend,
                        volume: c.neutral
                    }));

                return {
                    data: activeCategories,
                    silentForecast
                };
            } catch (error) {
                console.error("Error in getCategoricalSentiment:", error);
                return { data: [], silentForecast: [] };
            }
        }),

    getCorrelationInsights: protectedProcedure
        .input(z.object({ period: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            try {
                const business = await ctx.db.business.findFirst({ where: { ownerId: ctx.session.user.id } });
                if (!business) return [];

                const filter = getDateFilter(input.period || "Dashboard Default");

                // Fetch reviews that have multiple categories
                const multiCatReviews = await ctx.db.review.findMany({
                    where: {
                        businessId: business.id,
                        reviewDate: filter,
                    },
                    include: {
                        categories: { include: { category: true } }
                    },
                    take: 200, // Sample size
                    orderBy: { reviewDate: 'desc' }
                });

                // Analyze Co-occurrence
                const correlations: Record<string, { count: number, example: string }> = {};

                multiCatReviews.forEach(review => {
                    if (!review.categories || review.categories.length < 2) return;

                    // Fallback Logic: Categories that co-occur frequently
                    for (let i = 0; i < review.categories.length; i++) {
                        for (let j = i + 1; j < review.categories.length; j++) {
                            const catA = review.categories[i]?.category?.name;
                            const catB = review.categories[j]?.category?.name;

                            if (!catA || !catB) continue;

                            const key = [catA, catB].sort().join(' & ');

                            if (!correlations[key]) correlations[key] = { count: 0, example: review.comment || "" };
                            correlations[key].count++;
                        }
                    }
                });

                return Object.entries(correlations)
                    .map(([pair, data]) => ({ pair, count: data.count, example: data.example }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3);
            } catch (error) {
                console.error("Error in getCorrelationInsights:", error);
                return [];
            }
        }),

    getLatestReviews: protectedProcedure
        .input(z.object({ period: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            const business = await ctx.db.business.findFirst({
                where: { ownerId: ctx.session.user.id }
            });

            if (!business) return [];

            const now = new Date();
            let startDate = new Date();
            let endDate: Date | undefined = undefined;
            const period = input.period || "This Month";

            if (period === "This Month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (period === "Last Month") {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            } else if (period === "This Quarter") {
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterMonth, 1);
            } else {
                startDate.setDate(now.getDate() - 30);
            }

            const dateFilter = { gte: startDate, ...(endDate ? { lte: endDate } : {}) };

            const reviews = await ctx.db.review.findMany({
                where: {
                    businessId: business.id,
                    reviewDate: dateFilter
                },
                orderBy: { reviewDate: 'desc' },
                take: 3,
                include: {
                    categories: {
                        include: {
                            category: true
                        }
                    }
                }
            });

            return reviews.map(r => ({
                id: r.id,
                text: r.comment,
                tags: r.categories.map(c => c.category.name),
                sentiment: r.sentimentType
            }));
        }),

    getImpactTimeline: protectedProcedure
        .input(z.object({ period: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            const business = await ctx.db.business.findFirst({
                where: { ownerId: ctx.session.user.id }
            });

            if (!business) return [];

            const now = new Date();
            let startDate = new Date();
            let endDate: Date | undefined = undefined;
            const period = input.period || "This Month";

            if (period === "This Month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (period === "Last Month") {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            } else if (period === "This Quarter") {
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterMonth, 1);
            } else {
                startDate.setDate(now.getDate() - 30);
            }

            const dateFilter = { gte: startDate, ...(endDate ? { lte: endDate } : {}) };

            const [reviews, surveyResponses] = await Promise.all([
                ctx.db.review.findMany({
                    where: {
                        businessId: business.id,
                        reviewDate: dateFilter,
                        sentimentScore: { not: null }
                    },
                    select: {
                        reviewDate: true,
                        sentimentScore: true
                    }
                }),
                ctx.db.surveyResponse.findMany({
                    where: {
                        survey: { businessId: business.id },
                        createdAt: dateFilter,
                        sentimentScore: { not: null }
                    },
                    select: {
                        createdAt: true,
                        sentimentScore: true
                    }
                })
            ]);

            const timeline: Record<string, { total: number; count: number }> = {};

            const addToTimeline = (date: Date, score: number | null) => {
                const day = date.toISOString().split('T')[0];
                if (day && score !== null) {
                    if (!timeline[day]) timeline[day] = { total: 0, count: 0 };
                    timeline[day].total += score;
                    timeline[day].count++;
                }
            };

            reviews.forEach(r => addToTimeline(r.reviewDate, r.sentimentScore));
            surveyResponses.forEach(s => addToTimeline(s.createdAt, s.sentimentScore));

            return Object.entries(timeline).map(([date, data]) => ({
                date,
                score: (data.total / data.count).toFixed(2)
            })).sort((a, b) => a.date.localeCompare(b.date));
        }),

    getInDepthInsights: protectedProcedure
        .input(z.object({
            ratingPeriod: z.string().optional(),
            loyaltyPeriod: z.string().optional(),
            insightPeriod: z.string().optional()
        }))
        .query(async ({ ctx, input }) => {
            const business = await ctx.db.business.findFirst({
                where: { ownerId: ctx.session.user.id }
            });

            if (!business) {
                return {
                    avgRating: 0,
                    ratingCount: 0,
                    loyalty: { promoters: 0, passives: 0, detractors: 0, nps: 0, total: 0 },
                    criticalIssues: []
                };
            }

            const getDateFilter = (period: string) => {
                const now = new Date();
                let startDate = new Date();
                let endDate: Date | undefined = undefined;

                if (period === "This Month") {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                } else if (period === "Last Month") {
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                } else if (period === "Last Year") {
                    startDate = new Date(now.getFullYear() - 1, 0, 1);
                    endDate = new Date(now.getFullYear() - 1, 11, 31);
                } else if (period === "Dashboard Default") {
                    startDate = new Date();
                    startDate.setMonth(now.getMonth() - 3); // Last 3 months
                } else if (period.startsWith("custom|")) {
                    const parts = period.split("|");
                    if (parts.length === 3 && parts[1] && parts[2]) {
                        startDate = new Date(parts[1]);
                        endDate = new Date(parts[2]);
                        // Ensure end of day for inclusive filtering
                        endDate.setHours(23, 59, 59, 999);
                    } else {
                        startDate.setDate(now.getDate() - 30);
                    }
                } else {
                    // default fall through
                    startDate.setDate(now.getDate() - 30);
                }
                return { gte: startDate, ...(endDate ? { lte: endDate } : {}) };
            };

            const getPreviousDateFilter = (period: string) => {
                const now = new Date();
                let startDate = new Date();
                let endDate = new Date();

                if (period === "This Month") {
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                } else if (period === "Last Month") {
                    startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
                } else if (period === "Last Year") {
                    startDate = new Date(now.getFullYear() - 2, 0, 1);
                    endDate = new Date(now.getFullYear() - 2, 11, 31);
                } else if (period === "Dashboard Default") {
                    startDate = new Date();
                    startDate.setMonth(now.getMonth() - 6); // Comparison: 3 months prior to the last 3 months
                    endDate = new Date();
                    endDate.setMonth(now.getMonth() - 3);
                } else if (period.startsWith("custom|")) {
                    const parts = period.split("|");
                    if (parts.length === 3 && parts[1] && parts[2]) {
                        const currentStart = new Date(parts[1]);
                        const currentEnd = new Date(parts[2]);
                        const duration = currentEnd.getTime() - currentStart.getTime();

                        // Previous period is same duration before start date
                        endDate = new Date(currentStart.getTime() - 1);
                        startDate = new Date(endDate.getTime() - duration);
                    } else {
                        startDate.setDate(now.getDate() - 60);
                        endDate.setDate(now.getDate() - 30);
                    }
                } else {
                    // default fall through
                    startDate.setDate(now.getDate() - 60);
                    endDate.setDate(now.getDate() - 30);
                }
                return { gte: startDate, lte: endDate };
            };

            // 1. Avg Rating (Review Rating + Survey Sentiment mapped 1-5)
            const ratingFilter = getDateFilter(input.ratingPeriod || "This Month");
            const prevRatingFilter = getPreviousDateFilter(input.ratingPeriod || "This Month");

            const [ratingReviews, ratingSurveys, prevReviews, prevSurveys] = await Promise.all([
                ctx.db.review.findMany({
                    where: { businessId: business.id, reviewDate: ratingFilter },
                    select: { rating: true }
                }),
                ctx.db.surveyResponse.findMany({
                    where: { survey: { businessId: business.id }, createdAt: ratingFilter, sentimentScore: { not: null } },
                    select: { sentimentScore: true }
                }),
                ctx.db.review.findMany({
                    where: { businessId: business.id, reviewDate: prevRatingFilter },
                    select: { rating: true }
                }),
                ctx.db.surveyResponse.findMany({
                    where: { survey: { businessId: business.id }, createdAt: prevRatingFilter, sentimentScore: { not: null } },
                    select: { sentimentScore: true }
                })
            ]);

            const calculateAvg = (reviews: { rating: number | null }[], surveys: { sentimentScore: number | null }[]) => {
                let totalScore = 0;
                let count = 0;
                reviews.forEach(r => {
                    if (r.rating) { totalScore += r.rating; count++; }
                });
                surveys.forEach(s => {
                    if (s.sentimentScore !== null) {
                        const rating = Math.max(1, Math.min(5, Math.ceil(s.sentimentScore * 5)));
                        totalScore += rating;
                        count++;
                    }
                });
                return count > 0 ? totalScore / count : 0;
            };

            const avgRating = calculateAvg(ratingReviews, ratingSurveys);
            const prevAvgRating = calculateAvg(prevReviews, prevSurveys);

            // Refactor calculateAvg inline to get count
            let currentTotalScore = 0;
            let currentCount = 0;
            ratingReviews.forEach(r => { if (r.rating) { currentTotalScore += r.rating; currentCount++; } });
            ratingSurveys.forEach(s => {
                if (s.sentimentScore !== null) {
                    currentTotalScore += Math.max(1, Math.min(5, Math.ceil(s.sentimentScore * 5)));
                    currentCount++;
                }
            });
            const finalAvgRating = currentCount > 0 ? currentTotalScore / currentCount : 0;

            let prevTotalScore = 0;
            let prevCount = 0;
            prevReviews.forEach(r => { if (r.rating) { prevTotalScore += r.rating; prevCount++; } });
            prevSurveys.forEach(s => {
                if (s.sentimentScore !== null) {
                    prevTotalScore += Math.max(1, Math.min(5, Math.ceil(s.sentimentScore * 5)));
                    prevCount++;
                }
            });
            const finalPrevAvgRating = prevCount > 0 ? prevTotalScore / prevCount : 0;

            const trendValue = finalPrevAvgRating > 0
                ? ((finalAvgRating - finalPrevAvgRating) / finalPrevAvgRating) * 100
                : 0;

            const ratingTrend = {
                value: `${Math.abs(trendValue).toFixed(1)}%`,
                isPositive: trendValue >= 0
            };

            // 2. Loyalty (NPS) - Review Rating & Survey Score
            const loyaltyFilter = getDateFilter(input.loyaltyPeriod || "This Month");
            const [loyaltyReviews, loyaltySurveys] = await Promise.all([
                ctx.db.review.findMany({
                    where: { businessId: business.id, reviewDate: loyaltyFilter },
                    select: { rating: true }
                }),
                ctx.db.surveyResponse.findMany({
                    where: { survey: { businessId: business.id }, createdAt: loyaltyFilter, sentimentScore: { not: null } },
                    select: { sentimentScore: true }
                })
            ]);

            let promoters = 0;
            let passives = 0;
            let detractors = 0;

            const processNps = (rating: number) => {
                if (rating >= 5) promoters++;
                else if (rating === 4) passives++;
                else detractors++;
            };

            loyaltyReviews.forEach(r => { if (r.rating) processNps(r.rating); });
            loyaltySurveys.forEach(s => {
                if (s.sentimentScore !== null) {
                    const rating = Math.max(1, Math.min(5, Math.ceil(s.sentimentScore * 5)));
                    processNps(rating);
                }
            });

            const loyaltyTotal = promoters + passives + detractors;
            const nps = loyaltyTotal > 0 ? Math.round(((promoters - detractors) / loyaltyTotal) * 100) : 0;

            // 3. Critical Issues
            const insightFilter = getDateFilter(input.insightPeriod || "This Month");
            const criticalIssues = await ctx.db.actionableInsight.findMany({
                where: {
                    businessId: business.id,
                    impactLevel: 'HIGH',
                    status: 'PENDING',
                    createdAt: insightFilter
                },
                take: 3,
                orderBy: { confidence: 'desc' },
                include: { category: true }
            });

            return {
                avgRating: finalAvgRating,
                ratingCount: currentCount,
                ratingTrend,
                loyalty: {
                    promoters,
                    passives,
                    detractors,
                    nps,
                    total: loyaltyTotal
                },
                criticalIssues: criticalIssues.map(issue => ({
                    id: issue.id,
                    title: issue.category.name,
                    description: issue.customerInput.substring(0, 80) + '...',
                    solution: issue.aiSolution,
                    updatedAt: issue.updatedAt.toISOString()
                }))
            };
        }),

    getActionableInsights: protectedProcedure
        .query(async ({ ctx }) => {
            const business = await ctx.db.business.findFirst({
                where: { ownerId: ctx.session.user.id }
            });

            if (!business) return [];

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const insights = await ctx.db.actionableInsight.findMany({
                where: {
                    businessId: business.id,
                    status: 'PENDING',
                    // Ensure the insight is based on relatively fresh data
                    createdAt: { gte: oneYearAgo }
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { category: true }
            });

            return insights.map(i => ({
                id: i.id,
                customerInput: i.customerInput,
                aiSolution: i.aiSolution,
                category: i.category.name,
                impact: i.impactLevel.toLowerCase() as 'high' | 'medium' | 'low'
            }));
        }),

    getUrgentIssueDetails: protectedProcedure
        .input(z.object({
            category: z.string(),
            period: z.string()
        }))
        .query(async ({ ctx, input }) => {
            const business = await ctx.db.business.findFirst({
                where: { ownerId: ctx.session.user.id }
            });

            if (!business) return { reviews: [], suggestion: null };

            // Date Filter
            const now = new Date();
            let startDate = new Date();
            if (input.period === "This Month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (input.period === "Last Month") {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            } else if (input.period === "This Quarter") {
                const quarter = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarter, 1);
            } else {
                startDate.setDate(now.getDate() - 30);
            }

            // Find Category ID
            const category = await ctx.db.category.findUnique({
                where: { name: input.category }
            });

            if (!category) return { reviews: [], suggestion: null };

            // Fetch Data (Reviews + Surveys) - Negative Only for "Urgent"
            // Fetch Data (Reviews + Surveys) - Negative Only for "Urgent"
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const [reviews, surveys, insight] = await Promise.all([
                ctx.db.review.findMany({
                    where: {
                        businessId: business.id,
                        // 1. Must be relevant (not ancient)
                        reviewDate: { gte: oneYearAgo },
                        // 2. Must match the "Period" filter (either written OR analyzed in period)
                        OR: [
                            { reviewDate: { gte: startDate } },
                            { aiAnalyzedAt: { gte: startDate } }
                        ],
                        categories: { some: { categoryId: category.id } },
                        sentimentType: 'NEGATIVE'
                    },
                    orderBy: { reviewDate: 'desc' },
                    take: 20
                }),
                ctx.db.surveyResponse.findMany({
                    where: {
                        survey: { businessId: business.id },
                        createdAt: { gte: startDate },
                        categories: { some: { categoryId: category.id } },
                        sentimentType: 'NEGATIVE'
                    },
                    include: { answers: { include: { question: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }),
                ctx.db.actionableInsight.findFirst({
                    where: {
                        businessId: business.id,
                        categoryId: category.id,
                        status: 'PENDING'
                    },
                    orderBy: { createdAt: 'desc' }
                })
            ]);

            const normalizedReviews = [
                ...reviews.map(r => ({
                    id: r.id,
                    type: 'Google Review',
                    content: r.comment || "No comment provided",
                    date: r.reviewDate.toISOString(),
                    rating: r.rating,
                    sentiment: r.sentimentScore
                })),
                ...surveys.map(s => {
                    const content = s.answers.map(a => `${a.question.question}: ${a.answer}`).join('\n');
                    return {
                        id: s.id,
                        type: 'Survey Response',
                        content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
                        date: s.createdAt.toISOString(),
                        rating: s.sentimentScore ? Math.ceil(s.sentimentScore * 5) : 0,
                        sentiment: s.sentimentScore
                    };
                })
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return {
                reviews: normalizedReviews,
                suggestion: insight ? insight.aiSolution : "Analisis lebih banyak data untuk menghasilkan solusi spesifik untuk kategori ini."
            };
        }),

    // Trigger background analysis for unprocessed reviews
    triggerBackgroundAnalysis: protectedProcedure.mutation(async ({ ctx }) => {
        const business = await ctx.db.business.findFirst({
            where: { ownerId: ctx.session.user.id }
        });

        if (!business) return { processed: 0, type: 'none' };

        // 1. Sync Phase: Convert Raw Gmaps Reviews to Reviews (Batch of 5)
        const unsyncedGmaps = await ctx.db.googleMapsReview.findMany({
            where: {
                gmapsPlace: { businessId: business.id },
                syncedToReview: false
            },
            take: 5
        });

        if (unsyncedGmaps.length > 0) {
            for (const gmapReview of unsyncedGmaps) {
                await ctx.db.$transaction(async (tx) => {
                    // Create Review
                    await tx.review.create({
                        data: {
                            businessId: business.id,
                            customerName: gmapReview.authorName,
                            customerEmail: null, // Gmaps doesn't provide email usually
                            rating: gmapReview.rating,
                            comment: gmapReview.text || "",
                            source: 'GOOGLE_MAPS',
                            reviewDate: gmapReview.timePosted,
                            // Link back
                            gmapsReview: {
                                connect: { id: gmapReview.id }
                            }
                        }
                    });

                    // Update Gmap stats
                    await tx.googleMapsReview.update({
                        where: { id: gmapReview.id },
                        data: { syncedToReview: true }
                    });
                });
            }
            return { processed: unsyncedGmaps.length, type: 'sync' };
        }

        // 2. Analysis Phase: Analyze Unanalyzed Reviews (Batch of 3 - heavier operation)
        // dynamic import to avoid circular dependency if any
        const { analyzeReview } = await import("@/lib/ai/processor");

        const unanalyzedReviews = await ctx.db.review.findMany({
            where: {
                businessId: business.id,
                comment: { not: "" }, // Skip empty comments
                OR: [
                    { aiAnalyzed: false },
                    {
                        aiAnalyzed: true,
                        sentimentType: 'NEUTRAL',
                        // If it's neutral but has no categories, it's likely a failed analysis fallback. Retry it.
                        categories: { none: {} }
                    }
                ]
            },
            orderBy: { createdAt: 'desc' }, // Process newest first
            take: 1
        });

        if (unanalyzedReviews.length > 0) {
            let analyzedCount = 0;
            for (const review of unanalyzedReviews) {
                try {
                    // AI Analysis
                    const analysis = await analyzeReview(review.comment, business.name);

                    // Update Review
                    await ctx.db.review.update({
                        where: { id: review.id },
                        data: {
                            aiAnalyzed: true,
                            aiAnalyzedAt: new Date(),
                            sentimentType: analysis.sentiment,
                            sentimentScore: analysis.score,
                        }
                    });



                    // Handle Categories
                    // Normalize: Capitalize first letter
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    const categoryName = analysis.primaryCategory.charAt(0).toUpperCase() + analysis.primaryCategory.slice(1).toLowerCase();

                    let category = await ctx.db.category.findUnique({
                        where: { name: categoryName }
                    });

                    if (!category) {
                        try {
                            category = await ctx.db.category.create({
                                data: {
                                    name: categoryName,
                                    description: `Auto-generated category for ${categoryName}`,
                                    color: '#f97316' // default orange
                                }
                            });
                        } catch (e) {
                            // Handle race condition
                            category = await ctx.db.category.findUnique({ where: { name: categoryName } });
                        }
                    }

                    if (category) {
                        await ctx.db.reviewCategory.create({
                            data: {
                                reviewId: review.id,
                                categoryId: category.id,
                                confidence: 0.9
                            }
                        });

                        // Create Insight if urgent or actionable
                        if (analysis.actionableInsight || analysis.isUrgent) {
                            await ctx.db.actionableInsight.create({
                                data: {
                                    businessId: business.id,
                                    customerInput: review.comment,
                                    aiSolution: analysis.actionableInsight || "Periksa masalah ini lebih lanjut.",
                                    categoryId: category.id,
                                    impactLevel: analysis.isUrgent ? 'HIGH' : 'MEDIUM',
                                    status: 'PENDING',
                                    confidence: analysis.score,
                                    basedOnReviews: {
                                        connect: { id: review.id }
                                    }
                                }
                            });
                        }
                    }
                    analyzedCount++;
                } catch (err) {
                    console.error("Failed to analyze review ID:", review.id, err);
                    // Mark as analyzed to prevent stuck queue
                    await ctx.db.review.update({
                        where: { id: review.id },
                        data: {
                            aiAnalyzed: true,
                            aiAnalyzedAt: new Date(),
                            sentimentType: 'NEUTRAL', // Default fallback
                            sentimentScore: 0.5,
                        }
                    });
                }
            }
            return { processed: analyzedCount, type: 'analysis' };
        }

        // --- 3. SURVEY ANALYSIS PHASE ---
        const unanalyzedSurveys = await ctx.db.surveyResponse.findMany({
            where: {
                survey: { businessId: business.id },
                aiAnalyzed: false
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
                answers: { include: { question: true } }
            }
        });

        if (unanalyzedSurveys.length > 0) {
            let analyzedCount = 0;
            for (const response of unanalyzedSurveys) {
                try {
                    const textParts = response.answers.map(a => `Q: ${a.question.question}\nA: ${a.answer}`);
                    const fullText = `Survey Response:\n${textParts.join('\n\n')}`;

                    const analysis = await analyzeReview(fullText, business.name);

                    await ctx.db.surveyResponse.update({
                        where: { id: response.id },
                        data: {
                            aiAnalyzed: true,
                            sentimentType: analysis.sentiment,
                            sentimentScore: analysis.score
                        }
                    });

                    if (analysis.primaryCategory) {
                        const categoryName = analysis.primaryCategory.charAt(0).toUpperCase() + analysis.primaryCategory.slice(1).toLowerCase();
                        let category = await ctx.db.category.findUnique({ where: { name: categoryName } });
                        if (!category) {
                            try {
                                category = await ctx.db.category.create({ data: { name: categoryName, color: '#f97316' } });
                            } catch (e) {
                                category = await ctx.db.category.findUnique({ where: { name: categoryName } });
                            }
                        }

                        if (category) {
                            // Link Survey to Category
                            try {
                                await ctx.db.surveyResponseCategory.create({
                                    data: {
                                        responseId: response.id,
                                        categoryId: category.id,
                                        confidence: analysis.score
                                    }
                                });
                            } catch (e) {
                                // Ignore duplicate
                            }

                            if (analysis.actionableInsight || analysis.isUrgent) {
                                await ctx.db.actionableInsight.create({
                                    data: {
                                        businessId: business.id,
                                        customerInput: fullText,
                                        aiSolution: analysis.actionableInsight || "Tinjau umpan balik mendesak.",
                                        categoryId: category.id,
                                        impactLevel: analysis.isUrgent ? 'HIGH' : 'MEDIUM',
                                        status: 'PENDING',
                                        confidence: analysis.score
                                    }
                                });
                            }
                        }
                    }
                    analyzedCount++;
                } catch (err) {
                    console.error("Survey Analysis Error", err);
                    // Mark as analyzed to prevent stuck queue
                    await ctx.db.surveyResponse.update({
                        where: { id: response.id },
                        data: {
                            aiAnalyzed: true,
                            sentimentType: 'NEUTRAL',
                            sentimentScore: 0.5
                        }
                    });
                }
            }
            return { processed: analyzedCount, type: 'survey_analysis' };
        }

        return { processed: 0, type: 'idle' };
    })
});

function getDateFilter(period: string) {
    const now = new Date();
    let startDate = new Date();
    let endDate: Date | undefined = undefined;

    if (period === "This Month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "Last Month") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === "This Quarter") {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
    } else {
        // Dashboard Default or others: Last 30 Days
        startDate.setDate(now.getDate() - 30);
    }

    return { gte: startDate, ...(endDate ? { lte: endDate } : {}) };
}

function getPreviousDateFilter(period: string) {
    const now = new Date();
    let startDate = new Date();
    let endDate: Date | undefined = undefined;

    // Calculate Current Start based on period
    if (period === "This Month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "Last Month") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (period === "This Quarter") {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
    } else {
        startDate.setDate(now.getDate() - 30);
    }

    // Now Shift Backwards for Previous Period
    let prevStartDate = new Date(startDate);
    let prevEndDate: Date | undefined = undefined;

    if (period === "This Month") {
        prevStartDate.setMonth(startDate.getMonth() - 1);
        prevEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
    } else if (period === "Last Month") {
        prevStartDate.setMonth(startDate.getMonth() - 1);
        prevEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
    } else if (period === "This Quarter") {
        prevStartDate.setMonth(startDate.getMonth() - 3);
        prevEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
    } else {
        // Default: Shift back 30 days
        prevStartDate.setDate(startDate.getDate() - 30);
        prevEndDate = new Date(startDate); // approx
        prevEndDate.setDate(prevEndDate.getDate() - 1);
    }

    return { gte: prevStartDate, ...(prevEndDate ? { lte: prevEndDate } : {}) };
}
