import { db } from "@/server/db";
import { gmapsClient, GoogleMapsApiError } from "@/lib/gmaps/client";

// Define types based on database structure
type GoogleMapsPlace = {
    id: string;
    placeId: string;
    name: string;
    rating?: number | null;
    totalReviews: number;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    businessId?: string | null;
    lastSynced: Date;
    syncEnabled: boolean;
};

type GoogleMapsReview = {
    id: string;
    gmapsPlaceId: string;
    authorName?: string | null;
    rating: number;
    text?: string | null;
    timePosted: Date;
    syncedToReview: boolean;
    reviewId?: string | null;
};

export interface SyncResult {
    success: boolean;
    placesProcessed: number;
    newReviews: number;
    updatedReviews: number;
    errors: string[];
    syncedAt: Date;
}

export interface PlaceSyncResult {
    placeId: string;
    placeName: string;
    success: boolean;
    newReviews: number;
    updatedReviews: number;
    totalReviews: number;
    error?: string;
}

export class GMapsSync {
    async syncAllUserPlaces(userId: string): Promise<SyncResult> {
        const result: SyncResult = {
            success: false,
            placesProcessed: 0,
            newReviews: 0,
            updatedReviews: 0,
            errors: [],
            syncedAt: new Date(),
        };

        try {
            const userPlaces = await db.googleMapsPlace.findMany({
                where: {
                    userId,
                    syncEnabled: true,
                },
            });

            if (userPlaces.length === 0) {
                result.success = true;
                return result;
            }

            for (const place of userPlaces) {
                try {
                    const placeSyncResult = await this.syncPlaceReviews(place);
                    result.placesProcessed++;
                    result.newReviews += placeSyncResult.newReviews;
                    result.updatedReviews += placeSyncResult.updatedReviews;
                } catch (error) {
                    result.errors.push(
                        `Failed to sync place ${place.name}: ${error instanceof Error ? error.message : "Unknown error"
                        }`
                    );
                }
            }

            result.success = result.errors.length === 0;
            return result;
        } catch (error) {
            result.errors.push(
                `Sync process failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            return result;
        }
    }

    async syncPlaceReviews(place: GoogleMapsPlace): Promise<PlaceSyncResult> {
        const result: PlaceSyncResult = {
            placeId: place.id,
            placeName: place.name,
            success: false,
            newReviews: 0,
            updatedReviews: 0,
            totalReviews: 0,
        };

        try {
            // Fetch latest place data from Google Maps
            const placeData = await gmapsClient.getPlaceDetails(place.placeId, [
                "name",
                "rating",
                "user_ratings_total",
                "reviews",
                "formatted_address",
                "formatted_phone_number",
                "website",
            ]);

            if (!placeData) {
                throw new Error("Place not found in Google Maps API");
            }

            // Update place metadata
            await db.googleMapsPlace.update({
                where: { id: place.id },
                data: {
                    name: placeData.name || place.name,
                    rating: placeData.rating,
                    totalReviews: placeData.user_ratings_total ?? 0,
                    address: placeData.formatted_address || place.address,
                    phone: placeData.formatted_phone_number || place.phone,
                    website: placeData.website || place.website,
                    lastSynced: new Date(),
                },
            });

            // Process reviews if available
            if (placeData.reviews && placeData.reviews.length > 0) {
                result.totalReviews = placeData.reviews.length;

                for (const review of placeData.reviews) {
                    const reviewResult = await this.processReview(place.id, review);
                    if (reviewResult.isNew) {
                        result.newReviews++;
                    } else if (reviewResult.isUpdated) {
                        result.updatedReviews++;
                    }
                }
            }

            result.success = true;
            return result;
        } catch (error) {
            result.error = error instanceof Error ? error.message : "Unknown error";
            return result;
        }
    }

    private async processReview(
        gmapsPlaceId: string,
        reviewData: any
    ): Promise<{ isNew: boolean; isUpdated: boolean }> {
        const timePosted = new Date(reviewData.time * 1000);

        // Create a unique identifier for the review based on author and time
        const reviewIdentifier = `${reviewData.author_name}-${timePosted.getTime()}`;

        try {
            // Try to find existing review
            const existingReview = await db.googleMapsReview.findFirst({
                where: {
                    gmapsPlaceId,
                    authorName: reviewData.author_name,
                    timePosted,
                },
            });

            if (existingReview) {
                // Check if update is needed
                const needsUpdate =
                    existingReview.rating !== reviewData.rating ||
                    existingReview.text !== (reviewData.text || "") ||
                    existingReview.authorPhotoUrl !== reviewData.profile_photo_url;

                if (needsUpdate) {
                    await db.googleMapsReview.update({
                        where: { id: existingReview.id },
                        data: {
                            rating: reviewData.rating,
                            text: reviewData.text || "",
                            authorPhotoUrl: reviewData.profile_photo_url,
                            authorLevel: this.extractAuthorLevel(reviewData.author_name),
                            updatedAt: new Date(),
                        },
                    });
                    return { isNew: false, isUpdated: true };
                }

                return { isNew: false, isUpdated: false };
            } else {
                // Create new review
                await db.googleMapsReview.create({
                    data: {
                        gmapsPlaceId,
                        authorName: reviewData.author_name,
                        authorPhotoUrl: reviewData.profile_photo_url,
                        rating: reviewData.rating,
                        text: reviewData.text || "",
                        timePosted,
                        authorLevel: this.extractAuthorLevel(reviewData.author_name),
                        googleReviewId: this.generateGoogleReviewId(reviewData),
                    },
                });
                return { isNew: true, isUpdated: false };
            }
        } catch (error) {
            console.error("Error processing review:", error);
            throw error;
        }
    }

    private extractAuthorLevel(authorName: string): string | null {
        if (!authorName) return null;

        const levelMatch = authorName.match(/Local Guide Level (\d+)/i);
        return levelMatch ? `Local Guide Level ${levelMatch[1]}` : null;
    }

    private generateGoogleReviewId(reviewData: any): string {
        // Generate a unique ID based on author and time since Google doesn't provide review IDs
        const timeString = reviewData.time.toString();
        const authorString = reviewData.author_name?.replace(/[^a-zA-Z0-9]/g, '') || 'anonymous';
        return `gmaps_${authorString}_${timeString}`;
    }

    async syncToMainReviews(gmapsReviewId: string, businessId?: string): Promise<void> {
        const gmapsReview = await db.googleMapsReview.findUnique({
            where: { id: gmapsReviewId },
            include: {
                gmapsPlace: {
                    include: {
                        business: true,
                    },
                },
            },
        });

        if (!gmapsReview) {
            throw new Error("Google Maps review not found");
        }

        const targetBusinessId = businessId || gmapsReview.gmapsPlace.businessId;

        if (!targetBusinessId) {
            throw new Error("No business associated with this place");
        }

        // Check if already synced
        if (gmapsReview.syncedToReview && gmapsReview.reviewId) {
            return;
        }

        // Create main review record
        const mainReview = await db.review.create({
            data: {
                businessId: targetBusinessId,
                customerName: gmapsReview.authorName,
                rating: gmapsReview.rating,
                comment: gmapsReview.text || "",
                source: "GOOGLE_MAPS",
                sourceUrl: `https://maps.google.com/maps/place/${gmapsReview.gmapsPlace.placeId}`,
                externalId: gmapsReview.googleReviewId,
                reviewDate: gmapsReview.timePosted,
                sentimentScore: gmapsReview.sentimentScore,
            },
        });

        // Update Google Maps review to mark as synced
        await db.googleMapsReview.update({
            where: { id: gmapsReviewId },
            data: {
                syncedToReview: true,
                reviewId: mainReview.id,
            },
        });
    }

    async getPlaceSyncStatus(placeId: string): Promise<{
        lastSynced: Date | null;
        totalReviews: number;
        syncedReviews: number;
        pendingReviews: number;
        syncEnabled: boolean;
    }> {
        const place = await db.googleMapsPlace.findUnique({
            where: { id: placeId },
            include: {
                _count: {
                    select: {
                        reviews: true,
                    },
                },
            },
        });

        if (!place) {
            throw new Error("Place not found");
        }

        const syncedCount = await db.googleMapsReview.count({
            where: {
                gmapsPlaceId: placeId,
                syncedToReview: true,
            },
        });

        return {
            lastSynced: place.lastSynced,
            totalReviews: place._count.reviews,
            syncedReviews: syncedCount,
            pendingReviews: place._count.reviews - syncedCount,
            syncEnabled: place.syncEnabled,
        };
    }
}

export const gmapsSync = new GMapsSync();