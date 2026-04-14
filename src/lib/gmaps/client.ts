import { env } from "@/env";
import type {
    SerpApiConfig,
    PlaceData,
    SerpApiResponse,
    SerpApiPlaceResult,
    SerpApiReview,
    PlaceSearchParams,
    NearbySearchParams,
    PlaceReview,
} from "./types";
import { GoogleMapsFallback } from "./fallback";

export class GoogleMapsApiError extends Error {
    constructor(
        public status: string,
        message: string,
        public originalResponse?: unknown
    ) {
        super(message);
        this.name = "GoogleMapsApiError";
    }
}

export class SerpApiClient {
    private config: SerpApiConfig;
    private baseUrl = "https://serpapi.com/search";

    constructor(config?: Partial<SerpApiConfig>) {
        this.config = {
            apiKey: config?.apiKey ?? env.SERPAPI_API_KEY,
            engine: config?.engine ?? "google_maps",
            google_domain: config?.google_domain ?? "google.com",
            gl: config?.gl ?? "us",
            hl: config?.hl ?? "en",
        };

        // Validate API key is available
        if (!this.config.apiKey) {
            console.warn("SerpApi API key not found. Please set SERPAPI_API_KEY environment variable.");
        }
    }

    private async makeRequest<T>(
        params: Record<string, string | number | boolean>,
        retryCount: number = 0
    ): Promise<SerpApiResponse<T>> {
        const url = new URL(this.baseUrl);

        // Add API key and default params
        url.searchParams.set("api_key", this.config.apiKey);
        url.searchParams.set("engine", this.config.engine!);

        if (this.config.google_domain) {
            url.searchParams.set("google_domain", this.config.google_domain);
        }
        if (this.config.gl) {
            url.searchParams.set("gl", this.config.gl);
        }
        if (this.config.hl) {
            url.searchParams.set("hl", this.config.hl);
        }

        // Add custom params
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        });

        console.log('📡 SerpApi request URL:', url.toString().replace(this.config.apiKey, 'API_KEY_HIDDEN'));
        console.log('📡 Request parameters:', Object.fromEntries(url.searchParams.entries()));

        try {
            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log('📊 SerpApi response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ SerpApi HTTP error response:', errorText);

                // Handle rate limiting with retry logic
                if (response.status === 429 && retryCount < 3) {
                    const retryDelay = (retryCount + 1) * 2;
                    console.warn(`⏰ SerpApi rate limit hit, retrying in ${retryDelay} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay * 1000));
                    return this.makeRequest(params, retryCount + 1);
                }

                // Handle rate limiting without retry
                if (response.status === 429) {
                    throw new GoogleMapsApiError(
                        "RATE_LIMIT_EXCEEDED",
                        "SerpApi rate limit exceeded. Please check your usage at https://serpapi.com/dashboard or upgrade your plan.",
                        response
                    );
                }

                throw new GoogleMapsApiError(
                    "HTTP_ERROR",
                    `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
                    response
                );
            }

            const data = await response.json() as SerpApiResponse<T>;

            console.log('📊 SerpApi response data keys:', Object.keys(data));
            console.log('📊 SerpApi search metadata:', data.search_metadata);

            if (data.error) {
                console.error('❌ SerpApi error:', data.error);
                throw new GoogleMapsApiError(
                    "SERPAPI_ERROR",
                    data.error,
                    data
                );
            }

            return data;
        } catch (error) {
            if (error instanceof GoogleMapsApiError) {
                throw error;
            }
            console.error('❌ Network error in SerpApi request:', error);
            throw new GoogleMapsApiError(
                "NETWORK_ERROR",
                `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    private convertSerpApiPlaceToPlaceData(serpPlace: SerpApiPlaceResult): PlaceData {
        // Use coordinates from either location
        const coords = serpPlace.coordinates || serpPlace.gps_coordinates;

        // Prefer place_results data if available, otherwise use top-level data
        const placeResults = serpPlace.place_results;

        return {
            place_id: serpPlace.place_id || `serpapi_${coords?.latitude}_${coords?.longitude}` || 'unknown',
            name: placeResults?.title || serpPlace.title,
            formatted_address: placeResults?.address || serpPlace.address,
            formatted_phone_number: placeResults?.phone || serpPlace.phone,
            website: placeResults?.website || serpPlace.website,
            rating: placeResults?.rating || serpPlace.rating,
            user_ratings_total: placeResults?.reviews_count || serpPlace.reviews,
            geometry: coords ? {
                location: {
                    lat: coords.latitude,
                    lng: coords.longitude
                }
            } : undefined,
            reviews: placeResults?.reviews?.map(review => this.convertSerpApiReviewToPlaceReview(review)),
            photos: placeResults?.photos?.map(photo => ({
                photo_reference: photo.image,
                height: 400,
                width: 400,
                html_attributions: []
            })),
            types: serpPlace.type ? [serpPlace.type] : undefined,
        };
    }

    private convertSerpApiReviewToPlaceReview(serpReview: SerpApiReview): PlaceReview {
        // Convert ISO date to Unix timestamp
        let dateTimestamp: number;

        if (serpReview.iso_date) {
            // Use ISO date if available (more accurate)
            dateTimestamp = new Date(serpReview.iso_date).getTime() / 1000;
        } else {
            // Fallback to parsing the relative date string
            dateTimestamp = new Date(serpReview.date).getTime() / 1000;
        }

        return {
            author_name: serpReview.user?.name || 'Anonymous',
            author_url: serpReview.user?.link || undefined,
            profile_photo_url: serpReview.user?.thumbnail || undefined,
            rating: serpReview.rating || 0,
            text: serpReview.snippet || '',
            time: dateTimestamp,
            relative_time_description: serpReview.date || '',
            likes: 0, // SerpApi doesn't provide likes count, default to 0
        };
    }

    async getPlaceDetails(placeId: string, fields?: string[]): Promise<PlaceData | null> {
        try {
            console.log('🔍 Getting place details for:', placeId);

            // Handle different place ID formats
            let searchParams: Record<string, string | number>;

            if (placeId.startsWith('ChIJ')) {
                // Standard Google place ID - use data_id parameter for google_maps_reviews
                searchParams = {
                    engine: "google_maps_reviews",
                    data_id: placeId,
                };
            } else if (placeId.includes(':')) {
                // Hex format place ID (0x...:0x...) - needs data_id parameter for google_maps_reviews
                searchParams = {
                    engine: "google_maps_reviews",
                    data_id: placeId,
                };
            } else if (placeId.startsWith('serpapi_')) {
                // Our generated pseudo place_id - extract coordinates and search
                const coords = placeId.replace('serpapi_', '').split('_');
                if (coords.length === 2) {
                    searchParams = {
                        engine: "google_maps",
                        ll: `${coords[0]},${coords[1]}`,
                        type: "search",
                        q: "business", // Generic search term
                    };
                } else {
                    throw new Error('Invalid pseudo place_id format');
                }
            } else {
                // Try as direct place_id first
                searchParams = {
                    engine: "google_maps_reviews",
                    place_id: placeId,
                };
            }

            console.log('📡 SerpApi place details params:', searchParams);

            const response = await this.makeRequest<SerpApiPlaceResult>(searchParams);

            console.log('📊 Place details response:', {
                hasPlaceResults: !!response.place_results,
                hasLocalResults: !!response.local_results,
                placeResultsKeys: response.place_results ? Object.keys(response.place_results) : [],
            });

            if (response.place_results) {
                const placeData = this.convertSerpApiPlaceToPlaceData({
                    place_id: placeId,
                    title: response.place_results.title || "Unknown Place",
                    place_results: response.place_results
                } as SerpApiPlaceResult);

                console.log('✅ Successfully converted place data:', placeData.name);
                return placeData;
            }

            // Handle google_maps_reviews engine response format (place_info + reviews)
            if (response.place_info) {
                console.log('✅ Found place_info in response');
                const info = response.place_info;
                const topLevelReviews = response.reviews?.map(review => this.convertSerpApiReviewToPlaceReview(review)) || [];

                const placeData: PlaceData = {
                    place_id: placeId,
                    name: info.title,
                    formatted_address: info.address,
                    rating: info.rating,
                    user_ratings_total: info.reviews,
                    geometry: info.gps_coordinates ? {
                        location: {
                            lat: info.gps_coordinates.latitude,
                            lng: info.gps_coordinates.longitude
                        }
                    } : undefined,
                    reviews: topLevelReviews,
                    photos: info.thumbnail ? [{
                        photo_reference: info.thumbnail,
                        height: 400,
                        width: 400,
                        html_attributions: []
                    }] : [],
                    types: info.type ? [info.type] : ['establishment']
                };

                console.log('✅ Successfully converted place_info data:', placeData.name, 'with', topLevelReviews.length, 'reviews');
                return placeData;
            }

            // Fallback: if no place_results but we have local_results, use the first one
            if (response.local_results && response.local_results.length > 0) {
                const firstResult = response.local_results[0] as SerpApiPlaceResult;
                firstResult.place_id = placeId; // Ensure we keep the original place_id
                const placeData = this.convertSerpApiPlaceToPlaceData(firstResult);
                console.log('✅ Using fallback local_results data:', placeData.name);
                return placeData;
            }

            console.log('❌ No place data found in response');
            return null;
        } catch (error) {
            console.error("Error fetching place details:", error);
            throw error;
        }
    }

    async searchPlaces(params: PlaceSearchParams): Promise<PlaceData[]> {
        try {
            const searchParams: Record<string, string | number> = {
                engine: "google_maps",
                q: params.query,
                type: "search",
            };

            if (params.location) {
                searchParams.ll = params.location;
            }

            console.log('🔍 SerpApi search params:', searchParams);

            const response = await this.makeRequest<SerpApiPlaceResult>(searchParams);

            console.log('📊 SerpApi response structure:', {
                hasLocalResults: !!response.local_results,
                localResultsCount: response.local_results?.length || 0,
                hasPlaceResults: !!response.place_results,
                searchInfo: response.search_information
            });

            if (response.local_results && Array.isArray(response.local_results)) {
                const places = response.local_results.map(place => {
                    // Ensure we have a valid place_id - generate one if missing
                    if (!place.place_id && place.coordinates) {
                        // Create a pseudo place_id from coordinates for SerpApi results
                        place.place_id = `serpapi_${place.coordinates.latitude}_${place.coordinates.longitude}`;
                    }
                    return this.convertSerpApiPlaceToPlaceData(place);
                });

                console.log('✅ Converted places:', places.length);
                return places;
            }

            // Fallback: Check if we have a single place_result (direct match)
            if (response.place_results) {
                console.log('✅ Found direct place_result match');
                const placeData = this.convertSerpApiPlaceToPlaceData({
                    ...response.place_results,
                    place_id: response.place_results.place_id || response.search_metadata?.id // Fallback ID if needed
                } as SerpApiPlaceResult);

                // Ensure name is set
                if (!placeData.name && response.place_results.title) {
                    placeData.name = response.place_results.title;
                }

                return [placeData];
            }

            console.log('⚠️ No local_results found in response');
            return [];
        } catch (error) {
            console.error("❌ SerpApi search failed, using fallback:", error);

            // Use fallback mock results when API fails
            if (error instanceof GoogleMapsApiError &&
                (error.status === "RATE_LIMIT_EXCEEDED" || error.status === "NETWORK_ERROR")) {
                console.log('🔄 Using fallback mock search results');
                return GoogleMapsFallback.getMockSearchResults(params.query);
            }

            throw error;
        }
    }

    async nearbySearch(params: NearbySearchParams): Promise<PlaceData[]> {
        try {
            console.log('🔍 SerpApi nearby search params:', params);

            const searchParams: Record<string, string | number> = {
                engine: "google_maps",
                ll: params.location,
                type: "search",
                q: params.keyword || params.type || "restaurant", // Default search term
            };

            console.log('📡 SerpApi nearby search request:', searchParams);

            const response = await this.makeRequest<SerpApiPlaceResult>(searchParams);

            console.log('📊 Nearby search response:', {
                hasLocalResults: !!response.local_results,
                localResultsCount: response.local_results?.length || 0,
            });

            if (response.local_results && Array.isArray(response.local_results)) {
                const places = response.local_results.map(place => {
                    // Ensure we have a valid place_id
                    if (!place.place_id && (place.coordinates || place.gps_coordinates)) {
                        const coords = place.coordinates || place.gps_coordinates;
                        place.place_id = `serpapi_${coords!.latitude}_${coords!.longitude}`;
                    }
                    return this.convertSerpApiPlaceToPlaceData(place);
                });

                console.log('✅ Converted nearby places:', places.length);
                return places;
            }

            console.log('❌ No local_results found in nearby search');
            return [];
        } catch (error) {
            console.error("Error in nearby search:", error);
            throw error;
        }
    }

    async getPlacePhoto(photoReference: string, maxWidth: number = 400): Promise<string> {
        // SerpApi returns direct image URLs, so we just return the reference
        return photoReference;
    }

    async getPlaceReviews(placeId: string, maxReviews: number = 100): Promise<PlaceReview[] | null> {
        try {
            console.log('🔍 Getting reviews for place:', placeId, 'max reviews:', maxReviews);

            let allReviews: PlaceReview[] = [];
            let nextPageToken: string | undefined = undefined;
            let pageCount = 0;
            const maxPages = Math.ceil(maxReviews / 10); // SerpApi returns ~8-10 reviews per page

            do {
                pageCount++;
                console.log(`📄 Fetching page ${pageCount}/${maxPages}...`);

                // Handle different place ID formats
                let searchParams: Record<string, string | number>;

                if (placeId.includes(':')) {
                    // Hex format place ID - needs data_id parameter
                    console.log('📍 Using hex format place ID with data_id parameter');
                    searchParams = {
                        engine: "google_maps_reviews",
                        data_id: placeId,
                        sort_by: "newestFirst", // Get newest reviews first
                    };
                } else if (placeId.startsWith('ChIJ')) {
                    // Standard Google place ID - use data_id parameter
                    console.log('📍 Using ChIJ format place ID with data_id parameter');
                    searchParams = {
                        engine: "google_maps_reviews",
                        data_id: placeId,
                        sort_by: "newestFirst", // Get newest reviews first
                    };
                } else if (placeId.startsWith('serpapi_')) {
                    // Our generated pseudo place_id - we need to search by coordinates
                    console.log('⚠️ Cannot get reviews for pseudo place_id, returning empty array');
                    return [];
                } else if (placeId.startsWith('fallback_')) {
                    // Fallback place_id - no reviews available
                    console.log('⚠️ Cannot get reviews for fallback place_id, returning empty array');
                    return [];
                } else {
                    // Try as direct data_id (for ChIJ format)
                    console.log('📍 Using unknown format place ID with data_id parameter');
                    searchParams = {
                        engine: "google_maps_reviews",
                        data_id: placeId,
                        sort_by: "newestFirst", // Get newest reviews first
                    };
                }

                // Add pagination token if we have one (for pages after the first)
                if (nextPageToken) {
                    searchParams.next_page_token = nextPageToken;
                    // Now we can use num parameter on subsequent pages
                    searchParams.num = 20; // Request maximum reviews per page
                    console.log('📄 Using pagination token for page', pageCount);
                } else {
                    console.log('📄 First page - will get 8 results (SerpApi limitation)');
                }

                console.log('📡 SerpApi reviews params:', searchParams);

                const response = await this.makeRequest<SerpApiReview>(searchParams);

                console.log('📊 Reviews response:', {
                    hasReviews: !!response.reviews,
                    reviewsCount: response.reviews?.length || 0,
                    hasPlaceInfo: !!response.place_info,
                    responseKeys: Object.keys(response),
                    hasPagination: !!response.serpapi_pagination,
                    paginationKeys: response.serpapi_pagination ? Object.keys(response.serpapi_pagination) : [],
                    nextPageToken: response.serpapi_pagination?.next_page_token,
                    nextUrl: response.serpapi_pagination?.next,
                    fullPagination: response.serpapi_pagination,
                    // Log the entire response to debug
                    fullResponseKeys: Object.keys(response),
                    rawPaginationObject: JSON.stringify(response.serpapi_pagination, null, 2)
                });

                // Process reviews from this page
                if (response.reviews && Array.isArray(response.reviews)) {
                    console.log(`✅ Found ${response.reviews.length} reviews on page ${pageCount}`);

                    const convertedReviews = response.reviews.map(review => this.convertSerpApiReviewToPlaceReview(review));
                    allReviews.push(...convertedReviews);
                    console.log(`✅ Total reviews collected so far: ${allReviews.length}`);
                } else {
                    console.log('❌ No reviews array found in response');
                    break;
                }

                // Check for pagination
                nextPageToken = response.serpapi_pagination?.next_page_token;

                // Stop if we have enough reviews or no more pages
                if (allReviews.length >= maxReviews || !nextPageToken || pageCount >= maxPages) {
                    break;
                }

                // Add a small delay between requests to be respectful to the API
                await new Promise(resolve => setTimeout(resolve, 1000));

            } while (nextPageToken && allReviews.length < maxReviews && pageCount < 50); // Safety limit

            console.log(`🎉 Pagination complete! Collected ${allReviews.length} total reviews across ${pageCount} pages`);

            // Limit to requested number of reviews
            const finalReviews = allReviews.slice(0, maxReviews);
            console.log(`📋 Returning ${finalReviews.length} reviews (limited to ${maxReviews})`);

            return finalReviews;
        } catch (error) {
            console.error("❌ Error fetching place reviews:", error);

            if (error instanceof GoogleMapsApiError) {
                console.log('⚠️ SerpApi error, returning empty reviews array:', error.message);
                console.log('⚠️ Error status:', error.status);
            } else {
                console.log('⚠️ Network/other error, returning empty reviews array:', error);
            }

            return [];
        }
    }
}

export const gmapsClient = new SerpApiClient();