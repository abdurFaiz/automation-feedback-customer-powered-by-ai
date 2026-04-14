export interface SerpApiConfig {
    apiKey: string;
    engine?: string;
    location?: string;
    google_domain?: string;
    gl?: string;
    hl?: string;
}

export interface PlaceGeometry {
    location: {
        lat: number;
        lng: number;
    };
    viewport?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
    };
}

export interface PlacePhoto {
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
}

export interface PlaceReview {
    author_name: string;
    author_url?: string;
    language?: string;
    original_language?: string;
    profile_photo_url?: string;
    rating: number;
    relative_time_description?: string;
    text: string;
    time: number;
    translated?: boolean;
    likes?: number;
}

// SerpApi specific interfaces
export interface SerpApiReview {
    user: {
        name: string;
        link?: string;
        thumbnail?: string;
        reviews?: number;
        local_guide?: boolean;
        contributor_id?: string;
    };
    rating: number;
    date: string;
    iso_date?: string; // More accurate timestamp
    iso_date_of_last_edit?: string;
    snippet: string;
    extracted_snippet?: {
        original: string;
        translated?: string;
    };
    likes?: number;
    images?: string[];
    link?: string;
    review_id?: string;
    source?: string;
    details?: Record<string, any>;
    response?: {
        date: string;
        iso_date: string;
        snippet: string;
        extracted_snippet?: {
            original: string;
            translated?: string;
        };
    };
}

export interface SerpApiPlaceResult {
    place_id?: string;
    title: string;
    address?: string;
    phone?: string;
    website?: string;
    rating?: number;
    reviews?: number;
    type?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    // Additional SerpApi fields
    gps_coordinates?: {
        latitude: number;
        longitude: number;
    };
    price?: string;
    hours?: string;
    service_options?: {
        dine_in?: boolean;
        takeout?: boolean;
        delivery?: boolean;
    };
    place_results?: {
        title?: string;
        reviews?: SerpApiReview[];
        photos?: Array<{
            image: string;
            thumbnail: string;
        }>;
        hours?: Array<{
            day: string;
            hours: string;
        }>;
        rating?: number;
        reviews_count?: number;
        address?: string;
        phone?: string;
        website?: string;
    };
}

export interface PlaceData {
    place_id: string;
    name: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: PlaceReview[];
    photos?: PlacePhoto[];
    geometry?: PlaceGeometry;
    business_status?: string;
    opening_hours?: {
        open_now: boolean;
        weekday_text: string[];
    };
    price_level?: number;
    types?: string[];
}

export interface SerpApiResponse<T> {
    search_metadata: {
        id: string;
        status: string;
        json_endpoint: string;
        created_at: string;
        processed_at: string;
        google_url: string;
        raw_html_file: string;
        total_time_taken: number;
    };
    search_parameters: Record<string, any>;
    search_information?: {
        query_displayed: string;
        total_results: number;
        time_taken: number;
        organic_results_state: string;
    };
    local_results?: T[];
    place_results?: T;
    place_info?: SerpApiPlaceInfo;
    reviews?: SerpApiReview[];
    serpapi_pagination?: {
        next?: string;
        next_page_token?: string;
    };
    error?: string;
}

export interface SerpApiPlaceInfo {
    title: string;
    address?: string;
    rating?: number;
    reviews?: number;
    type?: string;
    gps_coordinates?: {
        latitude: number;
        longitude: number;
    };
    thumbnail?: string;
}

export interface GoogleMapsApiResponse<T> {
    result?: T;
    results?: T[];
    status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
    error_message?: string;
    next_page_token?: string;
}

export interface PlaceSearchParams {
    query: string;
    location?: string;
    radius?: number;
    type?: string;
    language?: string;
    region?: string;
}

export interface NearbySearchParams {
    location: string; // lat,lng
    radius: number;
    type?: string;
    keyword?: string;
    language?: string;
    minprice?: number;
    maxprice?: number;
}