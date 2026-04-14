import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { gmapsRouter } from "@/server/api/routers/gmaps";
import { businessRouter } from "@/server/api/routers/business";
import { userRouter } from "@/server/api/routers/user";
import { datasetRouter } from "@/server/api/routers/dataset";
import { analyticsRouter } from "@/server/api/routers/analytics";

import { surveyRouter } from "@/server/api/routers/survey";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    gmaps: gmapsRouter,
    business: businessRouter,
    user: userRouter,
    dataset: datasetRouter,
    analytics: analyticsRouter,
    survey: surveyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
