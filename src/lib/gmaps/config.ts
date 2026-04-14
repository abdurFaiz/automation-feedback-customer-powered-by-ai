export const GMAPS_CONFIG = {
    // Rate limiting configuration
    RATE_LIMIT: {
        MAX_RETRIES: 3,
        RETRY_DELAY_MS: 2000,
        BACKOFF_MULTIPLIER: 2,
    },

    // Cache configuration
    CACHE: {
        TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
        MAX_ENTRIES: 1000,
    },

    // API configuration
    API: {
        TIMEOUT_MS: 30000, // 30 seconds
        MAX_CONCURRENT_REQUESTS: 5,
    },

    // Error messages
    ERRORS: {
        RATE_LIMIT: "SerpApi rate limit exceeded. Please wait a few minutes and try again, or check your usage at https://serpapi.com/dashboard",
        PLACE_NOT_FOUND: "Could not find business data from the provided Google Maps URL. Please try using a direct business name search instead.",
        NETWORK_ERROR: "Network error occurred while accessing Google Maps data. Please try again.",
    }
} as const;