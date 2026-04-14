import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const businessRouter = createTRPCRouter({
    upsertProfile: protectedProcedure
        .input(z.object({
            businessName: z.string(),
            industry: z.string(),
            location: z.string(),
            googleMapsUrl: z.string().optional(),
            tagline: z.string().optional(),
            amenities: z.string().optional(), // Comma separated string from form
            serviceStyle: z.string().optional(),
            avgDailyGuests: z.string().optional(),
            openingHours: z.string().optional(),
            staffPerShift: z.string().optional(),
            primaryAudience: z.string().optional(),
            valueProposition: z.string().optional(),
            returnCycle: z.string().optional(),
            criticalThreshold: z.string().optional(),
            primaryGoal: z.string().optional(),
            targetKpi: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Check if business exists for user
            const existing = await ctx.db.business.findFirst({
                where: { ownerId: userId }
            });

            const amenitiesList = input.amenities ? input.amenities.split(',').filter(Boolean) : [];

            if (existing) {
                return ctx.db.business.update({
                    where: { id: existing.id },
                    data: {
                        name: input.businessName,
                        type: input.industry,
                        address: input.location,
                        googleMapsUrl: input.googleMapsUrl,
                        tagline: input.tagline,
                        amenities: amenitiesList,
                        serviceStyle: input.serviceStyle,
                        avgDailyGuests: input.avgDailyGuests,
                        openingHours: input.openingHours,
                        staffPerShift: input.staffPerShift,
                        primaryAudience: input.primaryAudience,
                        valueProposition: input.valueProposition,
                        returnCycle: input.returnCycle,
                        criticalThreshold: input.criticalThreshold,
                        primaryGoal: input.primaryGoal,
                        targetKpi: input.targetKpi,
                    }
                });
            } else {
                return ctx.db.business.create({
                    data: {
                        ownerId: userId,
                        name: input.businessName,
                        type: input.industry,
                        address: input.location,
                        googleMapsUrl: input.googleMapsUrl,
                        tagline: input.tagline,
                        amenities: amenitiesList,
                        serviceStyle: input.serviceStyle,
                        avgDailyGuests: input.avgDailyGuests,
                        openingHours: input.openingHours,
                        staffPerShift: input.staffPerShift,
                        primaryAudience: input.primaryAudience,
                        valueProposition: input.valueProposition,
                        returnCycle: input.returnCycle,
                        criticalThreshold: input.criticalThreshold,
                        primaryGoal: input.primaryGoal,
                        targetKpi: input.targetKpi,
                    }
                });
            }
        }),

    getMyBusiness: protectedProcedure
        .query(async ({ ctx }) => {
            return ctx.db.business.findFirst({
                where: { ownerId: ctx.session.user.id },
                include: {
                    owner: true
                }
            });
        })
});
