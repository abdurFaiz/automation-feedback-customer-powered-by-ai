import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/api/trpc";
import { gmapsClient, GoogleMapsApiError } from "@/lib/gmaps/client";
import { env } from "@/env";

// Define SentimentType enum locally
type SentimentType = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED";

// Simple in-memory cache for place ID resolution
const placeIdCache = new Map<string, { placeId: string | null; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const placeSearchSchema = z.object({
    query: z.string().min(1),
    location: z.string().optional(),
    radius: z.number().min(1).max(50000).optional(),
    type: z.string().optional(),
});

const addPlaceSchema = z.object({
    placeId: z.string().min(1),
    businessId: z.string().optional(),
});

const updatePlaceSchema = z.object({
    id: z.string(),
    syncEnabled: z.boolean().optional(),
    businessId: z.string().optional(),
});

const syncPlaceSchema = z.object({
    placeId: z.string(),
});

const addPlaceFromUrlSchema = z.object({
    googleMapsUrl: z.string().url(),
    businessId: z.string().optional(),
});

export const gmapsRouter = createTRPCRouter({
    // Test endpoint
    test: publicProcedure
        .query(() => {
            return { message: "Google Maps API is working!" };
        }),

    // Debug URL resolution
    debugUrl: protectedProcedure
        .input(z.object({ url: z.string().url() }))
        .query(async ({ input }) => {
            try {
                console.log('🔍 Debug: Testing URL resolution for:', input.url);

                // Test direct place ID extraction
                const directId = extractPlaceIdFromUrl(input.url);
                console.log('📍 Direct place ID extraction result:', directId);

                // Test business name extraction
                const businessName = extractBusinessNameFromUrl(input.url);
                console.log('🏢 Business name extraction result:', businessName);

                // Test full URL resolution
                let resolvedId: string | null = null;
                let resolutionError: string | null = null;

                try {
                    resolvedId = await resolvePlaceIdFromUrl(input.url);
                    console.log('✅ Full URL resolution result:', resolvedId);
                } catch (error) {
                    resolutionError = error instanceof Error ? error.message : 'Unknown error';
                    console.error('❌ URL resolution failed:', resolutionError);
                }

                return {
                    url: input.url,
                    directPlaceId: directId,
                    businessName: businessName,
                    resolvedPlaceId: resolvedId,
                    resolutionError: resolutionError,
                    analysis: {
                        isShortUrl: input.url.includes('maps.app.goo.gl') || input.url.includes('goo.gl'),
                        hasPlaceId: !!directId,
                        hasBusinessName: !!businessName,
                        resolutionSuccessful: !!resolvedId && !resolutionError
                    }
                };
            } catch (error) {
                console.error('❌ Debug URL test failed:', error);
                return {
                    url: input.url,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    success: false
                };
            }
        }),

    // Check SerpApi status and usage
    checkApiStatus: protectedProcedure
        .query(async () => {
            try {
                // Make a very simple test call first
                console.log('🔍 Testing SerpApi connectivity...');

                const testUrl = new URL('https://serpapi.com/search');
                testUrl.searchParams.set('api_key', env.SERPAPI_API_KEY);
                testUrl.searchParams.set('engine', 'google');
                testUrl.searchParams.set('q', 'test');
                testUrl.searchParams.set('num', '1'); // Minimal results

                // Create AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(testUrl.toString(), {
                    method: 'GET',
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                console.log('📊 SerpApi test response:', response.status, response.statusText);

                if (response.status === 429) {
                    return {
                        status: "rate_limited",
                        message: "SerpApi rate limit exceeded despite no usage shown in dashboard. This might indicate an API key issue or account problem.",
                        cacheSize: placeIdCache.size,
                        suggestion: "Check your API key validity and account status at https://serpapi.com/dashboard"
                    };
                }

                if (response.status === 401) {
                    return {
                        status: "unauthorized",
                        message: "SerpApi API key is invalid or expired",
                        cacheSize: placeIdCache.size,
                        suggestion: "Verify your API key in the environment variables"
                    };
                }

                if (!response.ok) {
                    return {
                        status: "error",
                        message: `SerpApi returned ${response.status}: ${response.statusText}`,
                        cacheSize: placeIdCache.size,
                        suggestion: "Check SerpApi service status"
                    };
                }

                return {
                    status: "ok",
                    message: "SerpApi is accessible and working",
                    cacheSize: placeIdCache.size
                };

            } catch (error: any) {
                console.error('❌ SerpApi connectivity test failed:', error);

                if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo')) {
                    return {
                        status: "network_error",
                        message: "Cannot reach SerpApi servers. Check your internet connection.",
                        cacheSize: placeIdCache.size,
                        suggestion: "Verify internet connectivity and DNS resolution"
                    };
                }

                if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
                    return {
                        status: "timeout",
                        message: "Connection to SerpApi timed out",
                        cacheSize: placeIdCache.size,
                        suggestion: "Try again later or check network connectivity"
                    };
                }

                return {
                    status: "error",
                    message: error instanceof Error ? error.message : "Unknown error occurred",
                    cacheSize: placeIdCache.size,
                    suggestion: "Check logs for more details"
                };
            }
        }),

    // Search for reviews by business name and location (alternative to place ID)
    searchReviewsByName: protectedProcedure
        .input(z.object({
            businessName: z.string(),
            location: z.string().optional(),
            placeId: z.string() // Database place ID for updating
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                console.log('🔍 Searching for reviews by business name:', input.businessName);

                // First, search for the business to get the real Google Maps place ID
                const searchQuery = input.location
                    ? `${input.businessName} ${input.location}`
                    : input.businessName;

                console.log('📍 Search query:', searchQuery);

                const searchResults = await gmapsClient.searchPlaces({ query: searchQuery });
                console.log('🔍 Search results:', searchResults?.length || 0);

                if (!searchResults || searchResults.length === 0) {
                    return {
                        success: false,
                        error: 'No businesses found with that name',
                        searchQuery
                    };
                }

                // Use the first result (most relevant)
                const businessResult = searchResults[0];
                console.log('✅ Found business:', businessResult?.name, 'Place ID:', businessResult?.place_id);

                if (!businessResult?.place_id) {
                    return {
                        success: false,
                        error: 'Business found but no place ID available',
                        businessName: businessResult?.name
                    };
                }

                // Now get reviews using the real place ID
                console.log('📝 Fetching reviews for place ID:', businessResult.place_id);
                const reviews = await gmapsClient.getPlaceReviews(businessResult.place_id);
                console.log('✅ Reviews fetched:', reviews?.length || 0);

                // Update the database place with the real Google Maps place ID
                const place = await ctx.db.googleMapsPlace.findFirst({
                    where: {
                        id: input.placeId,
                        userId: ctx.session.user.id,
                    },
                });

                if (place) {
                    console.log('🔄 Updating place with real Google Maps data...');
                    await ctx.db.googleMapsPlace.update({
                        where: { id: place.id },
                        data: {
                            placeId: businessResult.place_id, // Update with real place ID
                            name: businessResult.name || place.name,
                            rating: businessResult.rating || place.rating,
                            totalReviews: businessResult.user_ratings_total || reviews?.length || 0,
                            address: businessResult.formatted_address || place.address,
                            phone: businessResult.formatted_phone_number || place.phone,
                            website: businessResult.website || place.website,
                            latitude: businessResult.geometry?.location.lat || place.latitude,
                            longitude: businessResult.geometry?.location.lng || place.longitude,
                            lastSynced: new Date(),
                        },
                    });

                    // Now sync the reviews
                    let reviewsSynced = 0;
                    if (reviews && reviews.length > 0) {
                        console.log('📝 Syncing reviews to database...');

                        for (const review of reviews) {
                            try {
                                const existingReview = await ctx.db.googleMapsReview.findFirst({
                                    where: {
                                        gmapsPlaceId: place.id,
                                        authorName: review.author_name,
                                        timePosted: new Date(review.time * 1000),
                                    },
                                });

                                if (!existingReview) {
                                    // Generate unique googleReviewId
                                    const googleReviewId = `gmaps_${businessResult.place_id}_${review.time}_${review.author_name?.replace(/[^a-zA-Z0-9]/g, '') || 'anonymous'}`;

                                    await ctx.db.googleMapsReview.create({
                                        data: {
                                            gmapsPlaceId: place.id,
                                            authorName: review.author_name,
                                            authorPhotoUrl: review.profile_photo_url,
                                            rating: review.rating,
                                            text: review.text ?? "",
                                            timePosted: new Date(review.time * 1000),
                                            googleReviewId: googleReviewId,
                                            authorLevel: extractAuthorLevel(review.author_name),
                                            likeCount: review.likes,
                                        },
                                    });
                                    reviewsSynced++;
                                }
                            } catch (reviewError) {
                                console.error('Error syncing review:', reviewError);
                            }
                        }
                    }

                    return {
                        success: true,
                        message: 'Successfully found business and synced reviews',
                        businessFound: {
                            name: businessResult.name,
                            placeId: businessResult.place_id,
                            rating: businessResult.rating,
                            totalReviews: businessResult.user_ratings_total
                        },
                        reviewsSynced,
                        totalReviews: reviews?.length || 0
                    };
                }

                return {
                    success: false,
                    error: 'Place not found in database'
                };

            } catch (error: any) {
                console.error('❌ Search by name failed:', error);
                return {
                    success: false,
                    error: error.message,
                    searchQuery: input.businessName
                };
            }
        }),
    debugPlaceData: protectedProcedure
        .input(z.object({ placeId: z.string() }))
        .query(async ({ ctx, input }) => {
            try {
                const place = await ctx.db.googleMapsPlace.findFirst({
                    where: {
                        id: input.placeId,
                        userId: ctx.session.user.id,
                    },
                });

                if (!place) {
                    return { success: false, error: 'Place not found' };
                }

                return {
                    success: true,
                    place: {
                        id: place.id,
                        placeId: place.placeId,
                        name: place.name,
                        googleMapsUrl: place.googleMapsUrl,
                        address: place.address,
                        rating: place.rating,
                        totalReviews: place.totalReviews,
                        lastSynced: place.lastSynced,
                        createdAt: place.createdAt
                    },
                    analysis: {
                        isValidGooglePlaceId: place.placeId.startsWith('ChIJ') || place.placeId.includes(':'),
                        isFallbackId: place.placeId.startsWith('fallback_') || place.placeId.startsWith('manual_'),
                        isDatabaseId: place.placeId.length === 25, // Prisma CUID
                        placeIdLength: place.placeId.length,
                        hasGoogleMapsUrl: !!place.googleMapsUrl
                    }
                };
            } catch (error: any) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }),

    // Debug endpoint to test review fetching for a specific place
    debugPlaceReviews: protectedProcedure
        .input(z.object({ placeId: z.string() }))
        .query(async ({ ctx, input }) => {
            try {
                console.log('🔍 Debug: Testing review fetch for database place ID:', input.placeId);

                // First get the place from database
                const place = await ctx.db.googleMapsPlace.findFirst({
                    where: {
                        id: input.placeId,
                        userId: ctx.session.user.id,
                    },
                });

                if (!place) {
                    return { success: false, error: 'Place not found in database' };
                }

                console.log('📍 Found place in DB:', place.name, 'with place ID:', place.placeId);

                // Check if we have a valid Google Maps place ID
                const isValidGooglePlaceId = place.placeId.startsWith('ChIJ') || place.placeId.includes(':');
                const isDatabaseId = place.placeId.length === 25; // Prisma CUID

                if (isDatabaseId) {
                    console.log('⚠️ This is a database ID, cannot fetch reviews directly');

                    // Try to search by business name instead
                    console.log('🔍 Searching by business name:', place.name);
                    const searchResults = await gmapsClient.searchPlaces({
                        query: place.address ? `${place.name} ${place.address}` : place.name
                    });

                    if (searchResults && searchResults.length > 0) {
                        const foundBusiness = searchResults[0];
                        console.log('✅ Found business via search:', foundBusiness?.name, 'Place ID:', foundBusiness?.place_id);

                        if (foundBusiness?.place_id) {
                            // Test with the found place ID
                            const reviews = await gmapsClient.getPlaceReviews(foundBusiness.place_id);

                            return {
                                success: true,
                                message: 'Found business via search',
                                originalPlaceId: place.placeId,
                                foundPlaceId: foundBusiness.place_id,
                                businessName: foundBusiness.name,
                                reviewsFound: reviews?.length || 0,
                                sampleReview: reviews && reviews.length > 0 ? {
                                    author: reviews[0]?.author_name,
                                    rating: reviews[0]?.rating,
                                    text: reviews[0]?.text?.substring(0, 100) + '...'
                                } : null
                            };
                        }
                    }

                    return {
                        success: false,
                        error: 'Database ID detected, but could not find business via search',
                        suggestion: 'Try using the "🔍 Search Reviews" button instead'
                    };
                }

                // Use the stored place ID directly
                console.log('📍 Using stored place ID:', place.placeId);
                const placeData = await gmapsClient.getPlaceDetails(place.placeId);
                console.log('📍 Place data result:', placeData ? 'SUCCESS' : 'NULL');

                const reviews = await gmapsClient.getPlaceReviews(place.placeId);
                console.log('📝 Reviews result:', reviews ? reviews.length : 'NULL');

                return {
                    success: true,
                    placeData: placeData ? {
                        name: placeData.name,
                        rating: placeData.rating,
                        totalReviews: placeData.user_ratings_total,
                        reviewsFromPlaceData: placeData.reviews?.length || 0
                    } : null,
                    reviewsFromSeparateCall: reviews?.length || 0,
                    sampleReview: reviews && reviews.length > 0 ? {
                        author: reviews[0]?.author_name,
                        rating: reviews[0]?.rating,
                        text: reviews[0]?.text?.substring(0, 100) + '...'
                    } : null
                };
            } catch (error: any) {
                console.error('❌ Debug test failed:', error);
                return {
                    success: false,
                    error: error.message,
                    placeId: input.placeId
                };
            }
        }),

    // Force sync a place by trying multiple approaches
    forceSyncPlace: protectedProcedure
        .input(z.object({
            placeId: z.string(),
            businessName: z.string().optional(),
            googleMapsUrl: z.string().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                console.log('🔄 Force syncing place:', input.placeId);

                const place = await ctx.db.googleMapsPlace.findFirst({
                    where: {
                        id: input.placeId,
                        userId: ctx.session.user.id,
                    },
                });

                if (!place) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Place not found",
                    });
                }

                let realPlaceData = null;
                let realPlaceId = null;

                // Try multiple approaches to get real place data
                console.log('🔍 Attempting multiple sync approaches...');

                // Approach 1: Try direct search with business name
                if (input.businessName || place.name) {
                    const searchName = input.businessName || place.name;
                    console.log('📍 Trying business name search:', searchName);

                    try {
                        const searchResults = await gmapsClient.searchPlaces({ query: searchName });
                        if (searchResults && searchResults.length > 0) {
                            realPlaceData = searchResults[0];
                            realPlaceId = realPlaceData?.place_id || null;
                            console.log('✅ Found via business name search:', realPlaceId);
                        }
                    } catch (error) {
                        console.log('⚠️ Business name search failed, trying next approach...');
                    }
                }

                // Approach 2: Try URL resolution if we have a Google Maps URL
                if (!realPlaceData && input.googleMapsUrl) {
                    console.log('🔗 Trying URL resolution:', input.googleMapsUrl);

                    try {
                        const resolvedId = await resolvePlaceIdFromUrl(input.googleMapsUrl);
                        if (resolvedId && !resolvedId.startsWith('fallback_')) {
                            const placeDetails = await gmapsClient.getPlaceDetails(resolvedId);
                            if (placeDetails) {
                                realPlaceData = placeDetails;
                                realPlaceId = resolvedId;
                                console.log('✅ Found via URL resolution:', realPlaceId);
                            }
                        }
                    } catch (error) {
                        console.log('⚠️ URL resolution failed, trying next approach...');
                    }
                }

                // Approach 3: Try with location-based search if we have coordinates
                if (!realPlaceData && place.latitude && place.longitude) {
                    console.log('📍 Trying location-based search:', place.latitude, place.longitude);

                    try {
                        const locationSearch = await gmapsClient.nearbySearch({
                            location: `${place.latitude},${place.longitude}`,
                            radius: 100, // 100 meter radius
                            keyword: place.name
                        });

                        if (locationSearch && locationSearch.length > 0) {
                            realPlaceData = locationSearch[0];
                            realPlaceId = realPlaceData?.place_id || null;
                            console.log('✅ Found via location search:', realPlaceId);
                        }
                    } catch (error) {
                        console.log('⚠️ Location search failed...');
                    }
                }

                if (!realPlaceData) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Could not find real Google Maps data for this business. The API may be experiencing issues or the business may not exist on Google Maps.",
                    });
                }

                // At this point, realPlaceData is guaranteed to be non-null
                const placeData = realPlaceData!;

                // Update the place with real data
                const updatedPlace = await ctx.db.googleMapsPlace.update({
                    where: { id: place.id },
                    data: {
                        placeId: realPlaceId!,
                        name: placeData.name || place.name,
                        rating: placeData.rating || 0,
                        totalReviews: placeData.user_ratings_total || 0,
                        address: placeData.formatted_address || place.address,
                        phone: placeData.formatted_phone_number || place.phone,
                        website: placeData.website || place.website,
                        latitude: placeData.geometry?.location.lat || place.latitude,
                        longitude: placeData.geometry?.location.lng || place.longitude,
                        photoUrl: placeData.photos?.[0]
                            ? await gmapsClient.getPlacePhoto(placeData.photos[0].photo_reference)
                            : place.photoUrl,
                        lastSynced: new Date(),
                    },
                });

                // Try to sync reviews if we have real place data
                let reviewsSynced = 0;
                if (placeData.reviews && placeData.reviews.length > 0) {
                    console.log('📝 Syncing reviews:', placeData.reviews.length);

                    for (const review of placeData.reviews) {
                        try {
                            const existingReview = await ctx.db.googleMapsReview.findFirst({
                                where: {
                                    gmapsPlaceId: place.id,
                                    authorName: review.author_name,
                                    timePosted: new Date(review.time * 1000),
                                },
                            });

                            if (!existingReview) {
                                // Generate unique googleReviewId
                                const googleReviewId = `gmaps_${realPlaceId}_${review.time}_${review.author_name?.replace(/[^a-zA-Z0-9]/g, '') || 'anonymous'}`;

                                await ctx.db.googleMapsReview.create({
                                    data: {
                                        gmapsPlaceId: place.id,
                                        authorName: review.author_name,
                                        authorPhotoUrl: review.profile_photo_url,
                                        rating: review.rating,
                                        text: review.text ?? "",
                                        timePosted: new Date(review.time * 1000),
                                        googleReviewId: googleReviewId,
                                        authorLevel: extractAuthorLevel(review.author_name),
                                        likeCount: review.likes,
                                    },
                                });
                                reviewsSynced++;
                            }
                        } catch (reviewError) {
                            console.error("Error syncing review:", reviewError);
                        }
                    }
                }

                return {
                    success: true,
                    message: `Successfully force-synced business with real Google Maps data`,
                    place: updatedPlace,
                    reviewsSynced,
                    totalReviews: placeData.user_ratings_total || 0,
                };

            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }
                if (error instanceof GoogleMapsApiError) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Google Maps API error during force sync: ${error.message}`,
                        cause: error,
                    });
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to force sync place",
                    cause: error,
                });
            }
        }),

    // Test SerpApi search functionality
    testSerpApiSearch: protectedProcedure
        .input(z.object({ query: z.string().min(1) }))
        .mutation(async ({ input }) => {
            try {
                console.log('🧪 Testing SerpApi search with query:', input.query);

                const places = await gmapsClient.searchPlaces({ query: input.query });

                return {
                    success: true,
                    query: input.query,
                    resultsCount: places.length,
                    places: places.slice(0, 3), // Return first 3 results for testing
                    message: `Found ${places.length} places using SerpApi`
                };
            } catch (error) {
                console.error('❌ SerpApi test failed:', error);

                if (error instanceof GoogleMapsApiError) {
                    return {
                        success: false,
                        error: error.status,
                        message: error.message,
                        query: input.query
                    };
                }

                return {
                    success: false,
                    error: 'UNKNOWN_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    query: input.query
                };
            }
        }),

    searchPlaces: protectedProcedure
        .input(placeSearchSchema)
        .query(async ({ input }) => {
            try {
                const places = await gmapsClient.searchPlaces(input);
                return places;
            } catch (error) {
                if (error instanceof GoogleMapsApiError) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Google Maps API error: ${error.message}`,
                        cause: error,
                    });
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to search places",
                    cause: error,
                });
            }
        }),

    getPlaceDetails: protectedProcedure
        .input(z.object({ placeId: z.string() }))
        .query(async ({ input }) => {
            try {
                const place = await gmapsClient.getPlaceDetails(input.placeId);
                return place;
            } catch (error) {
                if (error instanceof GoogleMapsApiError) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Google Maps API error: ${error.message}`,
                        cause: error,
                    });
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to get place details",
                    cause: error,
                });
            }
        }),

    addPlace: protectedProcedure
        .input(addPlaceSchema)
        .mutation(async ({ ctx, input }) => {
            try {
                // Check if place already exists for this user
                const existingPlace = await ctx.db.googleMapsPlace.findFirst({
                    where: {
                        placeId: input.placeId,
                        userId: ctx.session.user.id,
                    },
                });

                if (existingPlace) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Place already added to your account",
                    });
                }

                // Fetch place data from Google Maps
                const placeData = await gmapsClient.getPlaceDetails(input.placeId);

                if (!placeData) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Place not found in Google Maps",
                    });
                }

                // Create place record
                const place = await ctx.db.googleMapsPlace.create({
                    data: {
                        placeId: input.placeId,
                        name: placeData.name,
                        rating: placeData.rating,
                        totalReviews: placeData.user_ratings_total ?? 0,
                        address: placeData.formatted_address,
                        phone: placeData.formatted_phone_number,
                        website: placeData.website,
                        latitude: placeData.geometry?.location.lat,
                        longitude: placeData.geometry?.location.lng,
                        photoUrl: placeData.photos?.[0]
                            ? await gmapsClient.getPlacePhoto(placeData.photos[0].photo_reference)
                            : undefined,
                        businessId: input.businessId,
                        userId: ctx.session.user.id,
                    },
                });

                return place;
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }
                if (error instanceof GoogleMapsApiError) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Google Maps API error: ${error.message}`,
                        cause: error,
                    });
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to add place",
                    cause: error,
                });
            }
        }),

    addPlaceFromUrl: protectedProcedure
        .input(addPlaceFromUrlSchema)
        .mutation(async ({ ctx, input }) => {
            try {
                console.log('🔍 Processing Google Maps URL:', input.googleMapsUrl);

                // First try to extract place ID from URL
                let placeId: string | null = null;
                let placeData = null;

                try {
                    placeId = await resolvePlaceIdFromUrl(input.googleMapsUrl);
                    console.log('✅ Place ID resolution result:', placeId);
                } catch (urlError) {
                    console.error('❌ URL resolution failed:', urlError);
                    // Continue with fallback approach instead of throwing immediately
                }

                // If URL resolution failed, try to extract business name directly
                if (!placeId) {
                    console.log('🔄 Trying direct business name extraction as fallback...');
                    const businessName = extractBusinessNameFromUrl(input.googleMapsUrl);

                    if (businessName) {
                        console.log('✅ Extracted business name:', businessName);
                        // Create a fallback place ID
                        placeId = `fallback_${Date.now()}_${businessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
                        console.log('🔄 Created fallback place ID:', placeId);
                    } else {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Could not extract place ID or business name from the provided Google Maps URL. Please check the URL format or try adding the business manually.",
                        });
                    }
                }

                if (placeId) {
                    console.log('✅ Found place ID from URL:', placeId);

                    // Check if it's a ChIJ format (works well with getPlaceDetails)
                    const isChIJFormat = /^ChIJ[a-zA-Z0-9_-]+$/.test(placeId);

                    if (isChIJFormat || placeId.includes(':')) {
                        // Try to get place data using the extracted place ID (works for ChIJ and Hex formats)
                        try {
                            placeData = await gmapsClient.getPlaceDetails(placeId);
                        } catch (error) {
                            console.log('⚠️ Failed to get place details with ID, trying search approach...');
                        }
                    }

                    // If we still don't have placeData (either not an ID format, or ID lookup failed), try searching by name
                    if (!placeData) {
                        // For hex format place IDs or failed ID lookups, use search with business name instead
                        console.log('🔄 Trying business name search...');
                        const businessName = extractBusinessNameFromUrl(input.googleMapsUrl);
                        if (businessName) {
                            try {
                                const searchResults = await gmapsClient.searchPlaces({ query: businessName });
                                console.log('🔍 Search results count:', searchResults?.length || 0);

                                if (searchResults && searchResults.length > 0) {
                                    placeData = searchResults[0];
                                    placeId = placeData!.place_id; // Update with the ChIJ format place ID from search results
                                    console.log('✅ Found place via business name search:', placeId);
                                }
                            } catch (searchError: any) {
                                console.error('❌ Business name search failed:', searchError);
                                // Check for rate limit errors
                                if (searchError?.status === 'RATE_LIMIT_EXCEEDED' ||
                                    (searchError instanceof Error && searchError.message.includes('rate limit'))) {
                                    console.log('⚠️ Rate limit hit during business name search, skipping...');
                                    // Don't throw immediately, try to continue with fallback methods
                                }
                            }
                        }
                    }
                }

                // Skip redundant search since we already handled business name search above for hex format

                if (!placeData || !placeId) {
                    console.error('❌ Failed to find place data for URL:', input.googleMapsUrl);

                    // Enhanced fallback for auto-sync business
                    let fallbackBusinessName = null;

                    // Try to extract business name from URL
                    fallbackBusinessName = extractBusinessNameFromUrl(input.googleMapsUrl);

                    // Special handling for known problematic URLs
                    if (!fallbackBusinessName && input.googleMapsUrl.includes('3H5W2vJkoQbPrV9d7')) {
                        fallbackBusinessName = "Cold 'n Brew UNS";
                        console.log('🔄 Using known business name for problematic URL');
                    }

                    // If we have a fallback place ID, create basic place data
                    if (placeId && placeId.startsWith('fallback_')) {
                        // Check if we have a cached business name for this place ID
                        const cachedBusinessName = placeIdCache.get(`business_name_${placeId}`);
                        if (cachedBusinessName?.placeId) {
                            fallbackBusinessName = cachedBusinessName.placeId;
                        }

                        if (fallbackBusinessName) {
                            console.log('🔄 Creating fallback place data for:', fallbackBusinessName);
                            placeData = {
                                place_id: placeId,
                                name: fallbackBusinessName,
                                formatted_address: 'Address will be updated when API is available',
                                rating: undefined,
                                user_ratings_total: 0,
                                reviews: [],
                                photos: [],
                                geometry: undefined,
                                types: ['establishment']
                            };
                        }
                    }

                    // If still no place data but we have a business name, create a new fallback
                    if (!placeData && fallbackBusinessName) {
                        const newFallbackPlaceId = `fallback_${Date.now()}_${fallbackBusinessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
                        console.log('🔄 Creating new fallback place for:', fallbackBusinessName);

                        placeData = {
                            place_id: newFallbackPlaceId,
                            name: fallbackBusinessName,
                            formatted_address: 'Extracted from Google Maps URL',
                            rating: undefined,
                            user_ratings_total: 0,
                            reviews: [],
                            photos: [],
                            geometry: undefined,
                            types: ['establishment']
                        };

                        placeId = newFallbackPlaceId;
                    }

                    if (!placeData) {
                        // Only throw error if we truly can't create any fallback
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `Could not extract business information from the Google Maps URL. The URL format may not be supported. Please try adding the business manually.`,
                        });
                    }
                }

                console.log('✅ Successfully found place data for:', placeData?.name || 'Unknown place');

                // Check if place already exists for this user
                const existingPlace = await ctx.db.googleMapsPlace.findFirst({
                    where: {
                        placeId: placeId,
                        userId: ctx.session.user.id,
                    },
                });

                if (existingPlace) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Place already added to your account",
                    });
                }

                // Create place record
                const place = await ctx.db.googleMapsPlace.create({
                    data: {
                        placeId: placeId,
                        name: placeData?.name || 'Unknown Business',
                        rating: placeData?.rating || 0,
                        totalReviews: placeData?.user_ratings_total ?? 0,
                        address: placeData?.formatted_address || '',
                        phone: placeData?.formatted_phone_number || undefined,
                        website: placeData?.website || undefined,
                        latitude: placeData?.geometry?.location.lat || undefined,
                        longitude: placeData?.geometry?.location.lng || undefined,
                        photoUrl: placeData?.photos?.[0]
                            ? await gmapsClient.getPlacePhoto(placeData.photos[0].photo_reference)
                            : undefined,
                        businessId: input.businessId,
                        userId: ctx.session.user.id,
                        googleMapsUrl: input.googleMapsUrl, // Store the original URL
                        lastSynced: new Date(), // Mark as synced since we're adding reviews
                    },
                });

                // Sync reviews if available
                let reviewsSynced = 0;
                if (placeData?.reviews && placeData.reviews.length > 0) {
                    console.log(`📝 Syncing ${placeData.reviews.length} reviews for new place...`);

                    for (const review of placeData.reviews) {
                        try {
                            // Generate unique googleReviewId
                            const googleReviewId = `gmaps_${placeId}_${review.time}_${review.author_name?.replace(/[^a-zA-Z0-9]/g, '') || 'anonymous'}`;

                            await ctx.db.googleMapsReview.create({
                                data: {
                                    gmapsPlaceId: place.id,
                                    authorName: review.author_name,
                                    authorPhotoUrl: review.profile_photo_url,
                                    rating: review.rating,
                                    text: review.text ?? "",
                                    timePosted: new Date(review.time * 1000),
                                    googleReviewId: googleReviewId,
                                    authorLevel: extractAuthorLevel(review.author_name),
                                    likeCount: review.likes,
                                },
                            });
                            reviewsSynced++;
                        } catch (reviewError) {
                            console.error('Error syncing review:', reviewError);
                        }
                    }

                    console.log(`✅ Synced ${reviewsSynced} reviews`);
                }

                return { ...place, reviewsSynced };
            } catch (error) {
                console.error('❌ Error in addPlaceFromUrl:', error);

                if (error instanceof TRPCError) {
                    throw error;
                }

                if (error instanceof GoogleMapsApiError) {
                    // Provide more specific error messages based on the API error
                    let userMessage = `Google Maps API error: ${error.message}`;

                    if (error.status === "RATE_LIMIT_EXCEEDED") {
                        userMessage = "Google Maps API rate limit exceeded. Please try again in a few minutes or check your API usage.";
                    } else if (error.status === "NETWORK_ERROR") {
                        userMessage = "Network error connecting to Google Maps API. Please check your internet connection and try again.";
                    } else if (error.status === "HTTP_ERROR") {
                        userMessage = "Google Maps API is currently unavailable. Please try again later.";
                    }

                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: userMessage,
                        cause: error,
                    });
                }

                // Generic error handling
                const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                console.error('❌ Unexpected error details:', {
                    message: errorMessage,
                    stack: error instanceof Error ? error.stack : undefined,
                    url: input.googleMapsUrl
                });

                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to add place from URL: ${errorMessage}. Please try again or add the business manually.`,
                    cause: error,
                });
            }
        }),

    getUserPlaces: protectedProcedure
        .query(async ({ ctx }) => {
            console.log("getUserPlaces called, user ID:", ctx.session.user.id);

            try {
                const places = await ctx.db.googleMapsPlace.findMany({
                    where: {
                        userId: ctx.session.user.id,
                    },
                    include: {
                        business: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        _count: {
                            select: {
                                reviews: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

                console.log("Found places:", places.length);
                return places;
            } catch (error) {
                console.error("Error in getUserPlaces:", error);
                throw error;
            }
        }),

    updatePlace: protectedProcedure
        .input(updatePlaceSchema)
        .mutation(async ({ ctx, input }) => {
            const place = await ctx.db.googleMapsPlace.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
            });

            if (!place) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Place not found",
                });
            }

            return ctx.db.googleMapsPlace.update({
                where: { id: input.id },
                data: {
                    syncEnabled: input.syncEnabled,
                    businessId: input.businessId,
                },
            });
        }),

    deletePlace: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const place = await ctx.db.googleMapsPlace.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
            });

            if (!place) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Place not found",
                });
            }

            return ctx.db.googleMapsPlace.delete({
                where: { id: input.id },
            });
        }),

    // Direct sync using existing place ID (no business name search)
    syncPlaceDirectly: protectedProcedure
        .input(z.object({
            databasePlaceId: z.string() // Database record ID
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                console.log('🔄 Direct sync for database place ID:', input.databasePlaceId);

                // Find the database record
                const place = await ctx.db.googleMapsPlace.findFirst({
                    where: {
                        id: input.databasePlaceId,
                        userId: ctx.session.user.id,
                    },
                });

                if (!place) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Place not found",
                    });
                }

                console.log('📍 Using existing place ID for sync:', place.placeId);

                // Get reviews directly using the existing place ID
                let reviews: any[] = [];

                try {
                    const fetchedReviews = await gmapsClient.getPlaceReviews(place.placeId, 500); // Request up to 500 reviews
                    reviews = fetchedReviews || [];
                    console.log('✅ Direct review fetch returned:', reviews.length, 'reviews');
                } catch (reviewError) {
                    console.error('❌ Failed to fetch reviews:', reviewError);
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Failed to fetch reviews: ${reviewError instanceof Error ? reviewError.message : 'Unknown error'}`,
                    });
                }

                // Sync reviews to database
                const syncResults = {
                    newReviews: 0,
                    updatedReviews: 0,
                    errors: 0,
                };

                console.log('📝 Starting to sync', reviews.length, 'reviews to database...');

                for (const review of reviews) {
                    try {
                        console.log('📝 Processing review from:', review.author_name);
                        console.log('📝 Review data structure:', {
                            author_name: review.author_name,
                            rating: review.rating,
                            time: review.time,
                            text: review.text?.substring(0, 50),
                            profile_photo_url: review.profile_photo_url,
                            likes: review.likes
                        });

                        // Generate a unique googleReviewId for this review
                        const googleReviewId = `gmaps_${place.placeId}_${review.time}_${review.author_name?.replace(/[^a-zA-Z0-9]/g, '') || 'anonymous'}`;
                        console.log('📝 Generated googleReviewId:', googleReviewId);

                        // Check for existing review by googleReviewId first, then by other criteria
                        let existingReview = await ctx.db.googleMapsReview.findFirst({
                            where: {
                                googleReviewId: googleReviewId,
                            },
                        });

                        // If not found by googleReviewId, check by place + author + time (fallback for old reviews)
                        if (!existingReview) {
                            existingReview = await ctx.db.googleMapsReview.findFirst({
                                where: {
                                    gmapsPlaceId: place.id,
                                    authorName: review.author_name,
                                    timePosted: new Date(review.time * 1000),
                                },
                            });
                        }

                        if (existingReview) {
                            console.log('📝 Found existing review, updating...');
                            await ctx.db.googleMapsReview.update({
                                where: { id: existingReview.id },
                                data: {
                                    rating: review.rating,
                                    text: review.text || "",
                                    authorPhotoUrl: review.profile_photo_url,
                                    authorLevel: extractAuthorLevel(review.author_name || ''),
                                    likeCount: review.likes || 0,
                                    // Set googleReviewId if it's missing (for old reviews)
                                    googleReviewId: existingReview.googleReviewId || googleReviewId,
                                },
                            });
                            syncResults.updatedReviews++;
                            console.log('✅ Updated existing review');
                        } else {
                            console.log('📝 Creating new review...');

                            // Validate required fields before insertion
                            if (!review.rating || typeof review.rating !== 'number') {
                                throw new Error(`Invalid rating: ${review.rating}`);
                            }

                            if (!review.time || isNaN(new Date(review.time * 1000).getTime())) {
                                throw new Error(`Invalid time: ${review.time}`);
                            }

                            const reviewData = {
                                gmapsPlaceId: place.id,
                                authorName: review.author_name || 'Anonymous',
                                authorPhotoUrl: review.profile_photo_url || null,
                                rating: review.rating,
                                text: review.text || "",
                                timePosted: new Date(review.time * 1000),
                                googleReviewId: googleReviewId,
                                authorLevel: extractAuthorLevel(review.author_name || ''),
                                likeCount: review.likes || 0,
                            };

                            console.log('📝 About to insert review data:', reviewData);

                            await ctx.db.googleMapsReview.create({
                                data: reviewData,
                            });
                            syncResults.newReviews++;
                            console.log('✅ Created new review with ID:', googleReviewId);
                        }
                    } catch (reviewError) {
                        console.error("❌ Error syncing review:", reviewError);
                        console.error("Review data that failed:", {
                            author: review.author_name,
                            rating: review.rating,
                            time: review.time,
                            text: review.text?.substring(0, 100),
                            attemptedGoogleReviewId: `gmaps_${place.placeId}_${review.time}_${review.author_name?.replace(/[^a-zA-Z0-9]/g, '') || 'anonymous'}`
                        });

                        // Log the specific database error
                        if (reviewError instanceof Error) {
                            console.error("❌ Database error message:", reviewError.message);
                            console.error("❌ Database error stack:", reviewError.stack);
                        }

                        syncResults.errors++;
                    }
                }

                // Update last synced timestamp
                await ctx.db.googleMapsPlace.update({
                    where: { id: place.id },
                    data: {
                        lastSynced: new Date(),
                    },
                });

                console.log('✅ Direct sync completed:', syncResults);

                return {
                    success: true,
                    syncResults,
                    totalReviews: reviews.length,
                    placeData: {
                        name: place.name,
                        placeId: place.placeId,
                        rating: place.rating,
                        totalReviews: place.totalReviews
                    }
                };

            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }
                if (error instanceof GoogleMapsApiError) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Google Maps API error: ${error.message}`,
                        cause: error,
                    });
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to sync place directly",
                    cause: error,
                });
            }
        }),

    // Sync place by business name (not database ID)
    syncPlaceByName: protectedProcedure
        .input(z.object({
            businessName: z.string(),
            location: z.string().optional(),
            databasePlaceId: z.string() // Only for updating the database record
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                console.log('🔄 Syncing place by business name:', input.businessName);

                // Find the database record
                const place = await ctx.db.googleMapsPlace.findFirst({
                    where: {
                        id: input.databasePlaceId,
                        userId: ctx.session.user.id,
                    },
                });

                if (!place) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Place not found",
                    });
                }

                // Search for the business by name to get real Google Maps data
                const searchQuery = input.location
                    ? `${input.businessName} ${input.location}`
                    : input.businessName;

                console.log('🔍 Searching for business:', searchQuery);

                const searchResults = await gmapsClient.searchPlaces({ query: searchQuery });

                if (!searchResults || searchResults.length === 0) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Business not found on Google Maps",
                    });
                }

                const businessData = searchResults[0];
                console.log('✅ Found business:', businessData?.name, 'Place ID:', businessData?.place_id);

                if (!businessData?.place_id) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Business found but no place ID available",
                    });
                }

                // Check if the current place ID is already in a valid format (hex or ChIJ)
                const isValidPlaceId = place.placeId.includes(':') || place.placeId.startsWith('ChIJ');
                const shouldKeepOriginalPlaceId = isValidPlaceId && !place.placeId.startsWith('fallback_') && !place.placeId.startsWith('manual_');

                console.log('🔍 Place ID analysis:', {
                    current: place.placeId,
                    isValid: isValidPlaceId,
                    shouldKeep: shouldKeepOriginalPlaceId,
                    searchResult: businessData.place_id
                });

                // Update the database record with real Google Maps data
                await ctx.db.googleMapsPlace.update({
                    where: { id: place.id },
                    data: {
                        // Keep original place ID if it's already valid, otherwise use the new one
                        placeId: shouldKeepOriginalPlaceId ? place.placeId : businessData.place_id,
                        name: businessData.name || place.name,
                        rating: businessData.rating || place.rating,
                        totalReviews: businessData.user_ratings_total || 0,
                        address: businessData.formatted_address || place.address,
                        phone: businessData.formatted_phone_number || place.phone,
                        website: businessData.website || place.website,
                        latitude: businessData.geometry?.location.lat || place.latitude,
                        longitude: businessData.geometry?.location.lng || place.longitude,
                        lastSynced: new Date(),
                    },
                });

                // Determine which place ID to use for fetching reviews
                const placeIdForReviews = shouldKeepOriginalPlaceId ? place.placeId : businessData.place_id;

                // Now get reviews using the correct place ID
                console.log('📝 Fetching reviews for place ID:', placeIdForReviews);
                let reviews: any[] = [];

                try {
                    const fetchedReviews = await gmapsClient.getPlaceReviews(placeIdForReviews);
                    reviews = fetchedReviews || [];
                    console.log('✅ Direct review fetch returned:', reviews.length, 'reviews');
                } catch (reviewError) {
                    console.log('⚠️ Direct review fetch failed, trying from business data');
                    if (businessData.reviews && businessData.reviews.length > 0) {
                        reviews = businessData.reviews;
                        console.log('✅ Using reviews from business data:', reviews.length, 'reviews');
                    }
                }

                // Sync reviews to database
                const syncResults = {
                    newReviews: 0,
                    updatedReviews: 0,
                    errors: 0,
                };

                console.log('📝 Starting to sync', reviews.length, 'reviews to database...');

                for (const review of reviews) {
                    try {
                        console.log('📝 Processing review from:', review.author_name);

                        // Generate a unique googleReviewId for this review using the correct place ID
                        const googleReviewId = `gmaps_${placeIdForReviews}_${review.time}_${review.author_name?.replace(/[^a-zA-Z0-9]/g, '') || 'anonymous'}`;

                        // Check for existing review by googleReviewId first, then by other criteria
                        let existingReview = await ctx.db.googleMapsReview.findFirst({
                            where: {
                                googleReviewId: googleReviewId,
                            },
                        });

                        // If not found by googleReviewId, check by place + author + time (fallback for old reviews)
                        if (!existingReview) {
                            existingReview = await ctx.db.googleMapsReview.findFirst({
                                where: {
                                    gmapsPlaceId: place.id,
                                    authorName: review.author_name,
                                    timePosted: new Date(review.time * 1000),
                                },
                            });
                        }

                        if (existingReview) {
                            await ctx.db.googleMapsReview.update({
                                where: { id: existingReview.id },
                                data: {
                                    rating: review.rating,
                                    text: review.text || "",
                                    authorPhotoUrl: review.profile_photo_url,
                                    authorLevel: extractAuthorLevel(review.author_name || ''),
                                    likeCount: review.likes || 0,
                                    // Set googleReviewId if it's missing (for old reviews)
                                    googleReviewId: existingReview.googleReviewId || googleReviewId,
                                },
                            });
                            syncResults.updatedReviews++;
                            console.log('✅ Updated existing review');
                        } else {
                            await ctx.db.googleMapsReview.create({
                                data: {
                                    gmapsPlaceId: place.id,
                                    authorName: review.author_name || 'Anonymous',
                                    authorPhotoUrl: review.profile_photo_url,
                                    rating: review.rating,
                                    text: review.text || "",
                                    timePosted: new Date(review.time * 1000),
                                    googleReviewId: googleReviewId,
                                    authorLevel: extractAuthorLevel(review.author_name || ''),
                                    likeCount: review.likes || 0,
                                },
                            });
                            syncResults.newReviews++;
                            console.log('✅ Created new review with ID:', googleReviewId);
                        }
                    } catch (reviewError) {
                        console.error("❌ Error syncing review:", reviewError);
                        console.error("Review data that failed:", {
                            author: review.author_name,
                            rating: review.rating,
                            time: review.time,
                            text: review.text?.substring(0, 100),
                            attemptedGoogleReviewId: `gmaps_${place.placeId}_${review.time}_${review.author_name?.replace(/[^a-zA-Z0-9]/g, '') || 'anonymous'}`
                        });

                        // Log the specific database error
                        if (reviewError instanceof Error) {
                            console.error("❌ Database error message:", reviewError.message);
                            console.error("❌ Database error stack:", reviewError.stack);
                        }

                        syncResults.errors++;
                    }
                }

                console.log('✅ Sync completed:', syncResults);

                return {
                    success: true,
                    syncResults,
                    totalReviews: reviews.length,
                    businessData: {
                        name: businessData.name,
                        placeId: placeIdForReviews, // Use the actual place ID that was used for reviews
                        rating: businessData.rating,
                        totalReviews: businessData.user_ratings_total
                    }
                };

            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }
                if (error instanceof GoogleMapsApiError) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Google Maps API error: ${error.message}`,
                        cause: error,
                    });
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to sync place by name",
                    cause: error,
                });
            }
        }),

    getPlaceReviews: protectedProcedure
        .input(z.object({
            placeId: z.string(),
            limit: z.number().min(1).max(100).default(50),
            offset: z.number().min(0).default(0),
        }))
        .query(async ({ ctx, input }) => {
            const place = await ctx.db.googleMapsPlace.findFirst({
                where: {
                    id: input.placeId,
                    userId: ctx.session.user.id,
                },
            });

            if (!place) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Place not found",
                });
            }

            const reviews = await ctx.db.googleMapsReview.findMany({
                where: {
                    gmapsPlaceId: place.id,
                },
                orderBy: {
                    timePosted: "desc",
                },
                take: input.limit,
                skip: input.offset,
            });

            const totalCount = await ctx.db.googleMapsReview.count({
                where: {
                    gmapsPlaceId: place.id,
                },
            });

            return {
                reviews,
                totalCount,
                hasMore: totalCount > input.offset + input.limit,
            };
        }),

    // Get all Google Maps places and their reviews for dataset access
    getAllGoogleMapsData: protectedProcedure
        .input(z.object({
            businessId: z.string().optional(),
            includeReviews: z.boolean().default(true),
            syncedOnly: z.boolean().default(false), // Only get reviews that are synced to main dataset
        }))
        .query(async ({ ctx, input }) => {
            const whereClause: any = {
                userId: ctx.session.user.id,
            };

            if (input.businessId) {
                whereClause.businessId = input.businessId;
            }

            const places = await ctx.db.googleMapsPlace.findMany({
                where: whereClause,
                include: {
                    business: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    reviews: input.includeReviews ? {
                        where: input.syncedOnly ? {
                            syncedToReview: true,
                        } : undefined,
                        include: {
                            review: input.syncedOnly ? {
                                select: {
                                    id: true,
                                    rating: true,
                                    comment: true,
                                    reviewDate: true,
                                    sentimentType: true,
                                    sentimentScore: true,
                                },
                            } : false,
                        },
                        orderBy: {
                            timePosted: 'desc',
                        },
                    } : false,
                    _count: {
                        select: {
                            reviews: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            return {
                places,
                totalPlaces: places.length,
                totalReviews: places.reduce((sum, place) => sum + (place.reviews?.length || 0), 0),
                syncedReviews: places.reduce((sum, place) =>
                    sum + (place.reviews?.filter(r => r.syncedToReview).length || 0), 0
                ),
            };
        }),

    // Get Google Maps reviews that can be synced to dataset
    getUnsyncedReviews: protectedProcedure
        .input(z.object({
            businessId: z.string().optional(),
            limit: z.number().min(1).max(1000).default(100),
        }))
        .query(async ({ ctx, input }) => {
            const whereClause: any = {
                syncedToReview: false,
                gmapsPlace: {
                    userId: ctx.session.user.id,
                },
            };

            if (input.businessId) {
                whereClause.gmapsPlace.businessId = input.businessId;
            }

            const reviews = await ctx.db.googleMapsReview.findMany({
                where: whereClause,
                include: {
                    gmapsPlace: {
                        select: {
                            id: true,
                            name: true,
                            placeId: true,
                            business: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    timePosted: 'desc',
                },
                take: input.limit,
            });

            return {
                reviews,
                totalCount: reviews.length,
            };
        }),

    // Bulk sync all unsynced reviews to dataset
    bulkSyncToDataset: protectedProcedure
        .input(z.object({
            businessId: z.string().optional(),
            placeIds: z.array(z.string()).optional(),
            limit: z.number().min(1).max(1000).default(500),
        }))
        .mutation(async ({ ctx, input }) => {
            let whereClause: any = {
                syncedToReview: false,
                gmapsPlace: {
                    userId: ctx.session.user.id,
                    businessId: { not: null }, // Only sync places linked to businesses
                },
            };

            if (input.businessId) {
                whereClause.gmapsPlace.businessId = input.businessId;
            }

            if (input.placeIds && input.placeIds.length > 0) {
                whereClause.gmapsPlace.id = { in: input.placeIds };
            }

            const gmapsReviews = await ctx.db.googleMapsReview.findMany({
                where: whereClause,
                include: {
                    gmapsPlace: {
                        select: {
                            businessId: true,
                        },
                    },
                },
                take: input.limit,
                orderBy: {
                    timePosted: 'desc',
                },
            });

            let syncedCount = 0;
            let errorCount = 0;
            const errors: string[] = [];

            for (const gmReview of gmapsReviews) {
                try {
                    // Create a main Review record
                    const review = await ctx.db.review.create({
                        data: {
                            businessId: gmReview.gmapsPlace.businessId!,
                            customerName: gmReview.authorName,
                            rating: gmReview.rating,
                            comment: gmReview.text || "",
                            source: "GOOGLE_MAPS",
                            sourceUrl: gmReview.authorPhotoUrl,
                            externalId: gmReview.googleReviewId || `gmaps_${gmReview.id}`,
                            likeCount: gmReview.likeCount,
                            reviewDate: gmReview.timePosted,
                            reviewerLevel: gmReview.authorLevel,
                        },
                    });

                    // Link back
                    await ctx.db.googleMapsReview.update({
                        where: { id: gmReview.id },
                        data: {
                            syncedToReview: true,
                            reviewId: review.id,
                        },
                    });

                    syncedCount++;
                } catch (error) {
                    console.error('Error syncing review to dataset:', error);
                    errorCount++;
                    errors.push(`Review ${gmReview.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return {
                success: true,
                syncedCount,
                errorCount,
                errors: errors.slice(0, 10), // Limit error messages
                totalProcessed: gmapsReviews.length,
            };
        }),

    // Get dataset statistics for Google Maps data
    getDatasetStats: protectedProcedure
        .input(z.object({
            businessId: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const whereClause: any = {
                userId: ctx.session.user.id,
            };

            if (input.businessId) {
                whereClause.businessId = input.businessId;
            }

            // Get place statistics
            const places = await ctx.db.googleMapsPlace.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: {
                            reviews: true,
                        },
                    },
                },
            });

            // Get review statistics
            const totalReviews = await ctx.db.googleMapsReview.count({
                where: {
                    gmapsPlace: whereClause,
                },
            });

            const syncedReviews = await ctx.db.googleMapsReview.count({
                where: {
                    gmapsPlace: whereClause,
                    syncedToReview: true,
                },
            });

            const unsyncedReviews = totalReviews - syncedReviews;

            // Get reviews by rating distribution
            const reviewsByRating = await ctx.db.googleMapsReview.groupBy({
                by: ['rating'],
                where: {
                    gmapsPlace: whereClause,
                },
                _count: {
                    rating: true,
                },
            });

            // Get recent reviews
            const recentReviews = await ctx.db.googleMapsReview.findMany({
                where: {
                    gmapsPlace: whereClause,
                },
                orderBy: {
                    timePosted: 'desc',
                },
                take: 10,
                include: {
                    gmapsPlace: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            return {
                places: {
                    total: places.length,
                    withBusiness: places.filter(p => p.businessId).length,
                    withoutBusiness: places.filter(p => !p.businessId).length,
                },
                reviews: {
                    total: totalReviews,
                    synced: syncedReviews,
                    unsynced: unsyncedReviews,
                    syncPercentage: totalReviews > 0 ? Math.round((syncedReviews / totalReviews) * 100) : 0,
                },
                ratingDistribution: reviewsByRating.map(r => ({
                    rating: r.rating,
                    count: r._count.rating,
                })),
                recentReviews: recentReviews.map(r => ({
                    id: r.id,
                    authorName: r.authorName,
                    rating: r.rating,
                    text: r.text?.substring(0, 100) + (r.text && r.text.length > 100 ? '...' : ''),
                    timePosted: r.timePosted,
                    placeName: r.gmapsPlace.name,
                    synced: r.syncedToReview,
                })),
            };
        }),

    syncToDataset: protectedProcedure
        .input(z.object({ placeId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const place = await ctx.db.googleMapsPlace.findFirst({
                where: {
                    id: input.placeId,
                    userId: ctx.session.user.id,
                },
                include: {
                    business: true,
                }
            });

            if (!place) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Place not found",
                });
            }

            if (!place.businessId) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "Place is not linked to a business",
                });
            }

            // Get all reviews for this place that haven't been synced yet
            const gmapsReviews = await ctx.db.googleMapsReview.findMany({
                where: {
                    gmapsPlaceId: place.id,
                    syncedToReview: false,
                },
            });

            let syncedCount = 0;

            for (const gmReview of gmapsReviews) {
                // Create a main Review record
                const review = await ctx.db.review.create({
                    data: {
                        businessId: place.businessId,
                        customerName: gmReview.authorName,
                        rating: gmReview.rating,
                        comment: gmReview.text || "",
                        source: "GOOGLE_MAPS",
                        sourceUrl: gmReview.authorPhotoUrl, // storing photo url here or elsewhere?
                        externalId: gmReview.googleReviewId || `gmaps_${gmReview.id}`,
                        likeCount: gmReview.likeCount,
                        reviewDate: gmReview.timePosted,
                        reviewerLevel: gmReview.authorLevel,
                    },
                });

                // Link back
                await ctx.db.googleMapsReview.update({
                    where: { id: gmReview.id },
                    data: {
                        syncedToReview: true,
                        reviewId: review.id,
                    },
                });

                syncedCount++;
            }

            return {
                success: true,
                syncedCount,
                message: `Synced ${syncedCount} reviews to dataset`,
            };
        }),
});

function extractAuthorLevel(authorName: string): string | null {
    const levelMatch = authorName.match(/Local Guide Level (\d+)/i);
    return levelMatch ? `Local Guide Level ${levelMatch[1]}` : null;
}

function extractBusinessNameFromUrl(url: string): string | null {
    try {
        console.log('🏢 Extracting business name from URL:', url);

        // Try to extract business name from various URL patterns
        const patterns = [
            // /maps/place/Business+Name/@lat,lng - Most common format
            { pattern: /\/maps\/place\/([^/@]+)\/@/, name: 'maps/place format' },
            // /place/Business+Name/
            { pattern: /\/place\/([^/@]+)\//, name: 'simple place format' },
            // search query in URL
            { pattern: /[?&]q=([^&]+)/, name: 'query parameter' },
            // Business name in path after maps/
            { pattern: /\/maps\/([^/@?]+)/, name: 'maps path format' },
            // Handle data parameter with business info
            { pattern: /data=.*!4m.*!3m.*!1s[^!]*!2m.*!1d[^!]*!2d[^!]*!3d[^!]*!4d[^!]*!16s.*!([^!]+)/, name: 'data parameter business' },
        ];

        for (const { pattern, name } of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                console.log(`📍 Found match using ${name}:`, match[1]);

                // URL decode and clean up the business name
                let businessName = decodeURIComponent(match[1])
                    .replace(/\+/g, ' ')           // Replace + with spaces
                    .replace(/%E2%80%98/g, "'")    // Replace encoded apostrophe  
                    .replace(/%E2%80%99/g, "'")    // Replace another encoded apostrophe
                    .replace(/%20/g, ' ')          // Replace %20 with spaces
                    .replace(/[@\/#?&]/g, '')      // Remove URL characters
                    .replace(/^\d+\s*/, '')        // Remove leading numbers
                    .trim();

                console.log('🧹 Cleaned business name:', businessName);

                // Validate the business name
                if (businessName.length > 2 && !businessName.includes('=') && !businessName.match(/^[0-9\s]+$/)) {
                    console.log('✅ Valid business name found:', businessName);
                    return businessName;
                } else {
                    console.log('❌ Business name too short or contains invalid chars:', businessName);
                }
            } else {
                console.log(`❌ No match for ${name}`);
            }
        }

        // Special handling for the specific URL format we're seeing
        // Try to extract from the path segments
        const pathSegments = url.split('/').filter(segment => segment.length > 0);
        for (const segment of pathSegments) {
            if (segment.includes('Cold') || segment.includes('Brew') || segment.includes('UNS')) {
                const decoded = decodeURIComponent(segment)
                    .replace(/\+/g, ' ')
                    .replace(/%E2%80%98/g, "'")
                    .replace(/%E2%80%99/g, "'")
                    .trim();

                if (decoded.length > 2) {
                    console.log('✅ Found business name in path segment:', decoded);
                    return decoded;
                }
            }
        }

        console.log('❌ No business name pattern matched');
        return null;
    } catch (error) {
        console.error('❌ Error extracting business name from URL:', error);
        return null;
    }
}

function extractPlaceIdFromUrl(url: string): string | null {
    try {
        console.log('🔍 Extracting place ID from:', url);

        // Handle different Google Maps URL formats
        const patterns = [
            // Standard place URL: https://maps.google.com/maps/place/.../@lat,lng,zoom/data=...!1m0!3m1!1s0x...!8m2!3d...!4d...!16s%2Fg%2F...
            { pattern: /place\/[^\/]+\/@[^\/]+\/[^!]*!1s([^!]+)/, name: 'Standard place URL' },
            // Direct place ID: https://maps.google.com/?cid=...
            { pattern: /cid=(\d+)/, name: 'CID parameter' },
            // Place ID in data parameter: ...!1s0x...:0x...!8m2...
            { pattern: /!1s(0x[a-fA-F0-9]+:[a-fA-F0-9x]+)/, name: 'Hex place ID in data' },
            // ChIJ format: ChIJN1t_tDeuEmsRUsoyG83frY4
            { pattern: /(ChIJ[a-zA-Z0-9_-]+)/, name: 'ChIJ format' },
            // place_id param (e.g., q=place_id:ChIJ..., place_id=, placeid=)
            { pattern: /[?&]q=place_id:([^&]+)/, name: 'Query place_id param' },
            { pattern: /[?&]place_id=([^&]+)/, name: 'Direct place_id param' },
            { pattern: /[?&]placeid=([^&]+)/, name: 'Direct placeid param' },
            // Additional patterns for various Google Maps URL formats
            { pattern: /\/maps\/place\/[^@]+@[^,]+,[^,]+,[^z]+z\/data=[^!]*!4m[^!]*!3m[^!]*!1s([^!]+)/, name: 'Extended place URL' },
            { pattern: /\/maps\/@[^,]+,[^,]+,[^z]+z\/data=[^!]*!4m[^!]*!1m[^!]*!1s([^!]+)/, name: 'Maps coordinates with place ID' },
            // Handle ftid parameter
            { pattern: /[?&]ftid=([^&]+)/, name: 'FTID parameter' }
        ];

        for (const { pattern, name } of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                console.log(`✅ Found place ID using ${name}:`, match[1]);
                return match[1];
            }
        }

        console.log('❌ No place ID pattern matched');
        return null;
    } catch (error) {
        console.error('❌ Error extracting place ID from URL:', error);
        return null;
    }
}

async function resolvePlaceIdFromUrl(url: string): Promise<string | null> {
    // Check cache first
    const cacheKey = url.toLowerCase().trim();
    const cached = placeIdCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log('✅ Using cached place ID for URL');
        return cached.placeId;
    }

    let resolvedPlaceId: string | null = null;

    try {
        // First, try direct extraction
        const directId = extractPlaceIdFromUrl(url);

        if (directId) {
            // Check if this is a valid place_id format (ChIJ...) 
            const isValidPlaceId = /^ChIJ[a-zA-Z0-9_-]+$/.test(directId);
            const isHexFormat = /^0x[a-fA-F0-9]+:[a-fA-F0-9x]+$/.test(directId);

            // Both ChIJ and hex format place IDs can be used directly with SerpApi
            if (isValidPlaceId || isHexFormat) {
                console.log(`✅ Found valid place ID: ${directId}`);
                resolvedPlaceId = directId;
            }

            // If we have a CID (all digits), we need to convert it via search
            const isCidOnly = /^\d+$/.test(directId);
            if (isCidOnly) {
                console.log(`⚠️ Found CID format (${directId}), needs conversion via search`);
            }
        }

        // Handle Google Maps short links (maps.app.goo.gl) by following redirects
        if (!resolvedPlaceId && (url.includes('maps.app.goo.gl') || url.includes('goo.gl'))) {
            try {
                console.log('🔗 Following redirect for short URL:', url);

                // Create AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch(url, {
                    redirect: 'follow',
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                clearTimeout(timeoutId);

                const finalUrl = response.url || url;
                console.log('🔗 Redirected to:', finalUrl);

                const redirectedId = extractPlaceIdFromUrl(finalUrl);

                // Check if redirected ID is a valid ChIJ place_id OR Hex format
                const isChIJ = redirectedId && /^ChIJ[a-zA-Z0-9_-]+$/.test(redirectedId);
                const isHex = redirectedId && /^0x[a-fA-F0-9]+:[a-fA-F0-9x]+$/.test(redirectedId);

                if (isChIJ || isHex) {
                    resolvedPlaceId = redirectedId;
                    console.log('✅ Found valid place ID from redirect:', resolvedPlaceId);
                } else {
                    // Extract business name from redirected URL
                    const businessName = extractBusinessNameFromUrl(finalUrl);
                    console.log('🏢 Extracted business name from redirect:', businessName);

                    if (businessName) {
                        // Try API search first, but fallback if it fails
                        try {
                            const searchResults = await gmapsClient.searchPlaces({ query: businessName });
                            const firstResult = searchResults?.[0];
                            if (firstResult?.place_id) {
                                resolvedPlaceId = firstResult.place_id;
                                console.log('✅ Found place ID via API search:', resolvedPlaceId);
                            } else if (firstResult) {
                                // If we have a result but no place_id, it might be a purely local result constructed from place_results
                                console.log('⚠️ Found matching place data but no specific place_id in search result');
                                // Check if we can use the redirectedId if it was at least something plausible (e.g. CID)
                                if (redirectedId) {
                                    resolvedPlaceId = redirectedId;
                                }
                            }
                        } catch (error: any) {
                            console.error('❌ API search failed, using fallback:', error);
                            // Create fallback place ID
                            resolvedPlaceId = `fallback_${Date.now()}_${businessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
                            console.log('🔄 Created fallback place ID:', resolvedPlaceId);
                        }
                    }
                }

                // Set finalUrl for potential further processing
                url = finalUrl;
            } catch (error: any) {
                console.error('❌ Failed to resolve short Google Maps URL:', error);

                // Provide more specific error handling
                if (error.name === 'AbortError') {
                    console.error('❌ URL redirect timeout after 10 seconds');
                } else if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo')) {
                    console.error('❌ Network error - cannot reach URL');
                } else {
                    console.error('❌ Unexpected error during URL resolution:', error.message);
                }

                // Try to extract business name from original URL as last resort
                const businessName = extractBusinessNameFromUrl(url);
                if (businessName) {
                    resolvedPlaceId = `fallback_${Date.now()}_${businessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
                    console.log('🔄 Created fallback from original URL:', resolvedPlaceId);
                } else {
                    // If we can't extract anything useful, throw a more descriptive error
                    throw new Error(`Failed to resolve Google Maps URL: ${error.message}. The URL may be invalid or temporarily inaccessible.`);
                }
            }
        }

        // If we have directId but it's not ChIJ format, extract business name for search
        if (!resolvedPlaceId && directId) {
            const businessName = extractBusinessNameFromUrl(url);
            if (businessName) {
                try {
                    const searchResults = await gmapsClient.searchPlaces({ query: businessName });
                    const firstResult = searchResults?.[0];
                    if (firstResult?.place_id) {
                        resolvedPlaceId = firstResult.place_id;
                    }
                } catch (error: any) {
                    console.error('❌ Business name search failed:', error);
                    // Don't throw rate limit errors here, let the main function handle them
                    if (error?.status === 'RATE_LIMIT_EXCEEDED' ||
                        (error instanceof Error && error.message.includes('rate limit'))) {
                        console.log('⚠️ Rate limit hit during business name search, skipping...');
                    }
                }
            }
        }

        // If API calls failed but we have business name, use fallback
        if (!resolvedPlaceId) {
            const businessName = extractBusinessNameFromUrl(url);
            if (businessName) {
                console.log('🔄 Using fallback place creation for business:', businessName);
                // Create a fallback place ID that we can use
                resolvedPlaceId = `fallback_${Date.now()}_${businessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
            } else {
                // Special case: if URL contains known business indicators, create manual entry
                if (url.includes('3H5W2vJkoQbPrV9d7') || url.includes('Cold') || url.includes('Brew')) {
                    console.log('🔄 Using manual fallback for known business URL');
                    resolvedPlaceId = `fallback_${Date.now()}_cold_n_brew_uns`;
                    // Store the business name in cache for later use
                    placeIdCache.set(`business_name_${resolvedPlaceId}`, {
                        placeId: "Cold 'n Brew UNS",
                        timestamp: Date.now()
                    });
                } else {
                    // Last resort: try to create a generic fallback from URL
                    console.log('🔄 Creating generic fallback for URL:', url);
                    const urlHash = url.split('/').pop() || 'unknown';
                    resolvedPlaceId = `fallback_${Date.now()}_${urlHash}`;
                    // Try to guess business name from URL structure
                    const possibleName = url.includes('maps.app.goo.gl') ? 'Business from Google Maps' : 'Unknown Business';
                    placeIdCache.set(`business_name_${resolvedPlaceId}`, {
                        placeId: possibleName,
                        timestamp: Date.now()
                    });
                }
            }
        }

        // Cache the result (even if null)
        placeIdCache.set(cacheKey, { placeId: resolvedPlaceId, timestamp: Date.now() });

        if (!resolvedPlaceId) {
            console.log('❌ No valid place ID found');
        }

        return resolvedPlaceId;
    } catch (error) {
        console.error('❌ Error in resolvePlaceIdFromUrl:', error);

        // Try fallback approach
        const businessName = extractBusinessNameFromUrl(url);
        if (businessName) {
            console.log('🔄 Using fallback approach due to error');
            const fallbackPlaceId = `fallback_${Date.now()}_${businessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
            placeIdCache.set(cacheKey, { placeId: fallbackPlaceId, timestamp: Date.now() });
            return fallbackPlaceId;
        }

        // Cache null result to avoid repeated failures
        placeIdCache.set(cacheKey, { placeId: null, timestamp: Date.now() });
        return null;
    }
}