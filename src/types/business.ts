// Shared types for business data
export interface BusinessFormData {
    // Brand Identity
    name?: string;
    type?: string | null;
    address?: string | null;
    tagline?: string | null;

    // Operations
    amenities?: string[];
    serviceStyle?: string | null;
    openingHours?: string | null;
    avgDailyGuests?: string | null;
    staffPerShift?: string | null;

    // Business Pulse
    primaryAudience?: string | null;
    valueProposition?: string | null;
    returnCycle?: string | null;

    // Data Sync
    googleMapsUrl?: string | null;
    criticalThreshold?: string | null;
    primaryGoal?: string | null;
    targetKpi?: string | null;

    // Additional fields
    id?: string;
    description?: string | null;
    city?: string | null;
    country?: string | null;
    googlePlaceId?: string | null;
    ownerId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    owner?: any;
}