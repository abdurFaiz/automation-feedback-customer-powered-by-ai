import type { PlaceData } from './types';

/**
 * Fallback Google Maps integration that works without external APIs
 * Uses URL parsing and basic data extraction
 */

export interface FallbackPlaceData {
    place_id: string;
    name: string;
    formatted_address?: string;
    website?: string;
    source: 'url_extraction' | 'manual_input';
}

export class GoogleMapsFallback {
    /**
     * Extract place information from Google Maps URL without API calls
     */
    static extractPlaceFromUrl(url: string): FallbackPlaceData | null {
        try {
            console.log('🔄 Using fallback URL extraction for:', url);

            // Extract business name from URL
            const businessName = this.extractBusinessNameFromUrl(url);
            if (!businessName) {
                console.log('❌ Could not extract business name from URL');
                return null;
            }

            // Generate a fallback place ID
            const fallbackPlaceId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const placeData: FallbackPlaceData = {
                place_id: fallbackPlaceId,
                name: businessName,
                source: 'url_extraction'
            };

            // Try to extract additional info from URL
            const addressInfo = this.extractAddressFromUrl(url);
            if (addressInfo) {
                placeData.formatted_address = addressInfo;
            }

            console.log('✅ Extracted place data from URL:', placeData);
            return placeData;
        } catch (error) {
            console.error('❌ Fallback URL extraction failed:', error);
            return null;
        }
    }

    /**
     * Extract business name from various Google Maps URL formats
     */
    private static extractBusinessNameFromUrl(url: string): string | null {
        try {
            const patterns = [
                // /maps/place/Business+Name/@lat,lng - Most common format
                { pattern: /\/maps\/place\/([^/@]+)\/@/, name: 'maps/place format' },
                // /place/Business+Name/
                { pattern: /\/place\/([^/@]+)\//, name: 'simple place format' },
                // search query in URL
                { pattern: /[?&]q=([^&]+)/, name: 'query parameter' },
                // Business name in path after maps/
                { pattern: /\/maps\/([^/@?]+)/, name: 'maps path format' },
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
                        .trim();

                    // Validate the business name
                    if (businessName.length > 2 && !businessName.includes('=')) {
                        console.log('✅ Valid business name found:', businessName);
                        return businessName;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('❌ Error extracting business name:', error);
            return null;
        }
    }

    /**
     * Try to extract address information from URL coordinates
     */
    private static extractAddressFromUrl(url: string): string | null {
        try {
            // Look for coordinates in the URL
            const coordPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
            const match = url.match(coordPattern);

            if (match && match[1] && match[2]) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[2]);

                // Return a basic coordinate-based address
                return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            }

            return null;
        } catch (error) {
            console.error('❌ Error extracting address from URL:', error);
            return null;
        }
    }

    /**
     * Convert fallback data to standard PlaceData format
     */
    static convertToPlaceData(fallbackData: FallbackPlaceData): PlaceData {
        return {
            place_id: fallbackData.place_id,
            name: fallbackData.name,
            formatted_address: fallbackData.formatted_address,
            website: fallbackData.website,
            rating: undefined,
            user_ratings_total: 0,
            reviews: [],
            photos: [],
            geometry: undefined,
            types: ['establishment']
        };
    }

    /**
     * Create a manual place entry when URL extraction fails
     */
    static createManualPlace(name: string, address?: string, website?: string): FallbackPlaceData {
        const fallbackPlaceId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            place_id: fallbackPlaceId,
            name: name.trim(),
            formatted_address: address?.trim(),
            website: website?.trim(),
            source: 'manual_input'
        };
    }

    /**
     * Check if a place ID is from fallback system
     */
    static isFallbackPlaceId(placeId: string): boolean {
        return placeId.startsWith('fallback_') || placeId.startsWith('manual_');
    }

    /**
     * Get mock search results for testing when API is unavailable
     */
    static getMockSearchResults(query: string): PlaceData[] {
        console.log('🔄 Using mock search results for query:', query);

        const mockResults: PlaceData[] = [
            {
                place_id: `mock_${Date.now()}_1`,
                name: `${query} - Sample Business 1`,
                formatted_address: '123 Main St, Sample City, SC 12345',
                rating: 4.2,
                user_ratings_total: 150,
                types: ['restaurant', 'establishment']
            },
            {
                place_id: `mock_${Date.now()}_2`,
                name: `${query} - Sample Business 2`,
                formatted_address: '456 Oak Ave, Sample City, SC 12345',
                rating: 4.5,
                user_ratings_total: 89,
                types: ['store', 'establishment']
            }
        ];

        console.log('✅ Generated mock search results:', mockResults.length);
        return mockResults;
    }
}