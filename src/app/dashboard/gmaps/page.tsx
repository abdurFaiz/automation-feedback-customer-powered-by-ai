"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Badge } from "@heroui/badge";
import { Spinner } from "@heroui/spinner";
import type { PlaceData } from "@/lib/gmaps/types";

// Icons - using Lucide React as alternative
import {
    MapPin as MapPinIcon,
    Search as MagnifyingGlassIcon,
    Plus as PlusIcon,
    RefreshCw as ArrowPathIcon,
    Trash2 as TrashIcon,
    Star as StarIcon,
} from "lucide-react";

export default function GoogleMapsIntegration() {
    // All hooks must be called at the top level
    const { data: session, status } = useSession();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPlaceId, setSelectedPlaceId] = useState("");
    const [shouldSearch, setShouldSearch] = useState(false);

    const utils = api.useUtils();

    // Test query to verify API is working
    const { data: testData } = api.gmaps.test.useQuery();

    // Queries - always call hooks, but conditionally enable them
    const { data: userPlaces, isLoading: placesLoading, error: placesError } = api.gmaps.getUserPlaces.useQuery(
        undefined,
        { enabled: status === "authenticated" }
    );
    const { data: searchResults, isLoading: isSearching, error: searchError } = api.gmaps.searchPlaces.useQuery(
        { query: searchQuery },
        { enabled: shouldSearch && searchQuery.trim().length > 0 && status === "authenticated" }
    );

    // Mutations - always call hooks
    const addPlace = api.gmaps.addPlace.useMutation({
        onSuccess: () => {
            void utils.gmaps.getUserPlaces.invalidate();
            setSelectedPlaceId("");
        },
    });
    const syncPlace = api.gmaps.syncPlaceDirectly.useMutation({
        onSuccess: () => {
            void utils.gmaps.getUserPlaces.invalidate();
        },
    });
    const deletePlace = api.gmaps.deletePlace.useMutation({
        onSuccess: () => {
            void utils.gmaps.getUserPlaces.invalidate();
        },
    });

    // Placeholder for businesses - replace with your actual business query
    const businesses: Array<{ id: string; name: string; }> = [];

    // Debug logging
    console.log("Test API:", testData);
    console.log("Auth Status:", status, "Session:", session?.user?.id);
    console.log("Places Error:", placesError?.message);
    console.log("Places Loading:", placesLoading);

    // Show loading while checking authentication
    if (status === "loading") {
        return (
            <div className="container mx-auto p-6 flex justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    // Show login prompt if not authenticated
    if (status === "unauthenticated") {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardBody className="text-center p-8">
                        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
                        <p className="text-gray-600 mb-4">
                            Please sign in to access the Google Maps integration.
                        </p>
                        <div className="space-y-2">
                            <p className="text-sm text-blue-600">Test API: {testData?.message || "Loading..."}</p>
                            <Button
                                color="primary"
                                onClick={() => window.location.href = "/auth/login"}
                            >
                                Sign In
                            </Button>
                            <Button
                                color="secondary"
                                variant="ghost"
                                onClick={() => console.log("Debug info:", { status, session, testData, placesError })}
                            >
                                Debug Info
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Check for API configuration errors
    if (placesError?.message?.includes("API key")) {
        return (
            <div className="container mx-auto p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardBody className="text-center p-8">
                        <h1 className="text-2xl font-bold text-red-800 mb-4">Configuration Error</h1>
                        <p className="text-red-700 mb-4">
                            Google Maps API key is missing or invalid. Please check your environment configuration.
                        </p>
                        <div className="text-left bg-red-100 p-4 rounded-lg text-sm">
                            <p className="font-bold mb-2">To fix this:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Create a `.env.local` file in your project root</li>
                                <li>Add: `GOOGLE_MAPS_API_KEY=your_api_key_here`</li>
                                <li>Restart the development server</li>
                            </ol>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Reset search when query changes
    const handleSearchQueryChange = (value: string) => {
        setSearchQuery(value);
        if (shouldSearch) {
            setShouldSearch(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setShouldSearch(true);
    };

    const handleAddPlace = async (placeId: string, businessId?: string) => {
        await addPlace.mutateAsync({ placeId, businessId });
    };

    const handleSync = async (placeId: string) => {
        await syncPlace.mutateAsync({ databasePlaceId: placeId });
    };

    const handleDelete = async (placeId: string) => {
        if (confirm("Are you sure you want to remove this place?")) {
            await deletePlace.mutateAsync({ id: placeId });
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Google Maps Integration</h1>
                    <p className="text-gray-600">Sync reviews from your Google Maps business listings</p>
                </div>
                <Badge content={userPlaces?.length || 0} color="primary">
                    <MapPinIcon className="h-8 w-8 text-gray-400" size={32} />
                </Badge>
            </div>

            {/* Search Section */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold">Add New Place</h2>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Search for your business on Google Maps..."
                            value={searchQuery}
                            onChange={(e) => handleSearchQueryChange(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            className="flex-1"
                            startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" size={16} />}
                        />
                        <Button
                            color="primary"
                            onClick={handleSearch}
                            isLoading={isSearching}
                        >
                            Search
                        </Button>
                    </div>

                    {/* Search Results */}
                    {searchResults && searchResults.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-medium text-gray-900">Search Results</h3>
                            {searchResults.map((place: PlaceData) => (
                                <div key={place.place_id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{place.name}</h4>
                                        <p className="text-sm text-gray-600">{place.formatted_address}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {place.rating && (
                                                <div className="flex items-center gap-1">
                                                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current" size={16} />
                                                    <span className="text-sm">{place.rating}</span>
                                                </div>
                                            )}
                                            {place.user_ratings_total && (
                                                <span className="text-sm text-gray-500">
                                                    ({place.user_ratings_total} reviews)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {businesses && businesses.length > 0 && (
                                            <Select
                                                placeholder="Link to business"
                                                className="w-48"
                                                size="sm"
                                                onChange={(e) => setSelectedPlaceId(e.target.value)}
                                            >
                                                {businesses.map((business: { id: string; name: string; }) => (
                                                    <SelectItem key={business.id}>
                                                        {business.name}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        )}
                                        <Button
                                            size="sm"
                                            color="primary"
                                            startContent={<PlusIcon className="h-4 w-4" size={16} />}
                                            onClick={() => handleAddPlace(place.place_id, selectedPlaceId)}
                                            isLoading={addPlace.isPending}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {searchError && (
                        <p className="text-red-600 text-sm">
                            {searchError.message || 'Search failed'}
                        </p>
                    )}
                </CardBody>
            </Card>

            {/* User Places */}
            <Card>
                <CardHeader className="flex justify-between">
                    <h2 className="text-xl font-semibold">Your Places</h2>
                    {placesLoading && <Spinner size="sm" />}
                </CardHeader>
                <CardBody>
                    {placesLoading ? (
                        <div className="flex justify-center p-8">
                            <Spinner />
                        </div>
                    ) : userPlaces && userPlaces.length > 0 ? (
                        <div className="space-y-4">
                            {userPlaces.map((place: any) => (
                                <div key={place.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-lg">{place.name}</h3>
                                                {place.syncEnabled ? (
                                                    <Chip color="success" size="sm">Sync Enabled</Chip>
                                                ) : (
                                                    <Chip color="default" size="sm">Sync Disabled</Chip>
                                                )}
                                            </div>

                                            {place.address && (
                                                <p className="text-gray-600 text-sm mt-1">{place.address}</p>
                                            )}

                                            <div className="flex items-center gap-4 mt-2">
                                                {place.rating && (
                                                    <div className="flex items-center gap-1">
                                                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" size={16} />
                                                        <span className="text-sm font-medium">{place.rating}</span>
                                                    </div>
                                                )}
                                                <span className="text-sm text-gray-500">
                                                    {place.totalReviews} total reviews
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {place._count.reviews} synced
                                                </span>
                                                {place.business && (
                                                    <Chip color="primary" size="sm">
                                                        Linked to {place.business.name}
                                                    </Chip>
                                                )}
                                            </div>

                                            <p className="text-xs text-gray-500 mt-2">
                                                Last synced: {new Date(place.lastSynced).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                color="secondary"
                                                startContent={<ArrowPathIcon className="h-4 w-4" size={16} />}
                                                onClick={() => handleSync(place.id)}
                                                isLoading={syncPlace.isPending}
                                                isDisabled={!place.syncEnabled}
                                            >
                                                Sync
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="ghost"
                                                startContent={<TrashIcon className="h-4 w-4" size={16} />}
                                                onClick={() => handleDelete(place.id)}
                                                isLoading={deletePlace.isPending}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" size={48} />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No places added</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Search and add your business locations to start syncing reviews.
                            </p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Sync Results */}
            {syncPlace.data && (
                <Card className="border-green-200 bg-green-50">
                    <CardBody>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-800 font-medium">Sync completed successfully!</span>
                        </div>
                        <div className="mt-2 text-sm text-green-700">
                            <p>New reviews: {syncPlace.data.syncResults.newReviews}</p>
                            <p>Updated reviews: {syncPlace.data.syncResults.updatedReviews}</p>
                            <p>Total reviews processed: {syncPlace.data.totalReviews}</p>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Error Messages */}
            {(addPlace.error || syncPlace.error || deletePlace.error) && (
                <Card className="border-red-200 bg-red-50">
                    <CardBody>
                        <p className="text-red-800">
                            {addPlace.error?.message ||
                                syncPlace.error?.message ||
                                deletePlace.error?.message}
                        </p>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}