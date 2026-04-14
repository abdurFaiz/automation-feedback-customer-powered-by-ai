import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
    // Register new user
    register: publicProcedure
        .input(z.object({
            email: z.string().email("Invalid email address"),
            password: z.string().min(6, "Password must be at least 6 characters"),
            firstName: z.string().min(1, "First name is required"),
            lastName: z.string().min(1, "Last name is required"),
        }))
        .mutation(async ({ ctx, input }) => {
            const { email, password, firstName, lastName } = input;

            // Check if user already exists
            const existingUser = await ctx.db.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "User already exists with this email",
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user
            const user = await ctx.db.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`,
                },
            });

            return {
                id: user.id,
                email: user.email,
                name: user.name,
            };
        }),

    // Get current user profile
    getProfile: protectedProcedure
        .query(async ({ ctx }) => {
            return ctx.db.user.findUnique({
                where: { id: ctx.session.user.id },
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    image: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        }),

    // Update user profile
    updateProfile: protectedProcedure
        .input(z.object({
            firstName: z.string().min(1, "First name is required"),
            lastName: z.string().min(1, "Last name is required"),
            email: z.string().email("Invalid email address"),
            image: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Check if email is already taken by another user
            const existingUser = await ctx.db.user.findFirst({
                where: {
                    email: input.email,
                    NOT: { id: userId },
                },
            });

            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Email is already taken by another user",
                });
            }

            // Update user profile
            const updatedUser = await ctx.db.user.update({
                where: { id: userId },
                data: {
                    firstName: input.firstName,
                    lastName: input.lastName,
                    email: input.email,
                    name: `${input.firstName} ${input.lastName}`,
                    image: input.image,
                },
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    image: true,
                    updatedAt: true,
                },
            });

            return updatedUser;
        }),

    // Check if user has password
    checkPassword: protectedProcedure
        .query(async ({ ctx }) => {
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.session.user.id },
                select: { password: true },
            });

            return { hasPassword: !!user?.password };
        }),
    changePassword: protectedProcedure
        .input(z.object({
            currentPassword: z.string().min(1, "Current password is required"),
            newPassword: z.string().min(8, "New password must be at least 8 characters long"),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            try {
                // Get user with current password
                const user = await ctx.db.user.findUnique({
                    where: { id: userId },
                    select: { id: true, password: true, email: true },
                });

                if (!user) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "User not found",
                    });
                }

                // Check if user has a password (OAuth users might not have one)
                if (!user.password) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "No password is set for this account. This account was created using social login (Google, etc.). Please contact support to set up a password.",
                    });
                }

                // Verify current password
                const isCurrentPasswordValid = await bcrypt.compare(
                    input.currentPassword,
                    user.password
                );

                if (!isCurrentPasswordValid) {
                    throw new TRPCError({
                        code: "UNAUTHORIZED",
                        message: "Current password is incorrect",
                    });
                }

                // Hash new password
                const hashedNewPassword = await bcrypt.hash(input.newPassword, 12);

                // Update password
                await ctx.db.user.update({
                    where: { id: userId },
                    data: { password: hashedNewPassword },
                });

                return { success: true, message: "Password updated successfully" };
            } catch (error) {
                console.error("Change password error:", error);

                // Re-throw TRPC errors
                if (error instanceof TRPCError) {
                    throw error;
                }

                // Handle other errors
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "An error occurred while changing password",
                });
            }
        }),

    // Upload profile image
    uploadProfileImage: protectedProcedure
        .input(z.object({
            imageData: z.string(), // Base64 encoded image
            fileName: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // In a real application, you would upload to a cloud storage service
            // For now, we'll just store the base64 data directly
            // You should implement proper image upload to AWS S3, Cloudinary, etc.

            const updatedUser = await ctx.db.user.update({
                where: { id: userId },
                data: { image: input.imageData },
                select: {
                    id: true,
                    image: true,
                },
            });

            return updatedUser;
        }),
});