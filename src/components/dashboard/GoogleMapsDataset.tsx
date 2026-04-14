'use client';

import { useState } from 'react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Progress,
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Spinner,
    Tabs,
    Tab,
} from '@heroui/react';
import {
    MapPin,
    Database,
    BarChart3,
    Star,
    Calendar,
    User,
    CloudBackupIcon,
    Upload,
} from 'lucide-react';
import { api } from '@/trpc/react';

export default function GoogleMapsDataset() {
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | undefined>();
    const [activeTab, setActiveTab] = useState('overview');

    // Modals
    const { isOpen: isBulkSyncOpen, onOpen: onBulkSyncOpen, onClose: onBulkSyncClose } = useDisclosure();
    const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();

    // API calls
    const { data: allGoogleMapsData, isLoading: isLoadingData, refetch: refetchData } =
        (api.gmaps as any).getAllGoogleMapsData.useQuery({
            businessId: selectedBusinessId,
            includeReviews: true,
            syncedOnly: false,
        });

    const { data: unsyncedReviews, isLoading: isLoadingUnsynced } =
        (api.gmaps as any).getUnsyncedReviews.useQuery({
            businessId: selectedBusinessId,
            limit: 100,
        });

    const { data: datasetStats, isLoading: isLoadingStats } =
        (api.gmaps as any).getDatasetStats.useQuery({
            businessId: selectedBusinessId,
        });

    const bulkSyncMutation = (api.gmaps as any).bulkSyncToDataset.useMutation({
        onSuccess: () => {
            refetchData();
            onBulkSyncClose();
        },
    });

    const handleBulkSync = async () => {
        try {
            const result = await bulkSyncMutation.mutateAsync({
                businessId: selectedBusinessId,
                limit: 500,
            });

            alert(`✅ Bulk sync completed!\n\n` +
                `• Synced: ${result.syncedCount} reviews\n` +
                `• Errors: ${result.errorCount}\n` +
                `• Total processed: ${result.totalProcessed}`);
        } catch (error: any) {
            alert(`❌ Bulk sync failed: ${error?.message || 'Unknown error'}`);
        }
    };

    if (isLoadingData || isLoadingStats) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const stats = datasetStats || {
        places: { total: 0, withBusiness: 0, withoutBusiness: 0 },
        reviews: { total: 0, synced: 0, unsynced: 0, syncPercentage: 0 },
        ratingDistribution: [],
        recentReviews: [],
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Google Maps Dataset</h2>
                    <p className="text-gray-600">Manage your Google Maps places and reviews data</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        color="primary"
                        startContent={<BarChart3 size={16} />}
                        onPress={onStatsOpen}
                    >
                        View Stats
                    </Button>
                    <Button
                        color="success"
                        startContent={<CloudBackupIcon size={16} />}
                        onPress={onBulkSyncOpen}
                        isDisabled={stats.reviews.unsynced === 0}
                    >
                        Bulk Sync ({stats.reviews.unsynced})
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Places</p>
                            <p className="text-2xl font-bold">{stats.places.total}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Star className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Reviews</p>
                            <p className="text-2xl font-bold">{stats.reviews.total}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Database className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Synced to Dataset</p>
                            <p className="text-2xl font-bold">{stats.reviews.synced}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Upload className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pending Sync</p>
                            <p className="text-2xl font-bold">{stats.reviews.unsynced}</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Sync Progress */}
            {stats.reviews.total > 0 && (
                <Card>
                    <CardBody>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Dataset Sync Progress</h3>
                            <Chip color="primary" variant="flat">
                                {stats.reviews.syncPercentage}% Complete
                            </Chip>
                        </div>
                        <Progress
                            value={stats.reviews.syncPercentage}
                            color="primary"
                            className="mb-2"
                        />
                        <p className="text-sm text-gray-600">
                            {stats.reviews.synced} of {stats.reviews.total} reviews synced to main dataset
                        </p>
                    </CardBody>
                </Card>
            )}

            {/* Tabs */}
            <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                className="w-full"
            >
                <Tab key="overview" title="Places Overview">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Google Maps Places</h3>
                        </CardHeader>
                        <CardBody>
                            {allGoogleMapsData?.places && allGoogleMapsData.places.length > 0 ? (
                                <Table aria-label="Google Maps Places">
                                    <TableHeader>
                                        <TableColumn>PLACE</TableColumn>
                                        <TableColumn>BUSINESS</TableColumn>
                                        <TableColumn>REVIEWS</TableColumn>
                                        <TableColumn>RATING</TableColumn>
                                        <TableColumn>SYNC STATUS</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {allGoogleMapsData.places.map((place: any) => (
                                            <TableRow key={place.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{place.name}</p>
                                                        <p className="text-sm text-gray-500">{place.address}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {place.business ? (
                                                        <Chip color="success" variant="flat" size="sm">
                                                            {place.business.name}
                                                        </Chip>
                                                    ) : (
                                                        <Chip color="warning" variant="flat" size="sm">
                                                            Not Linked
                                                        </Chip>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span>{place._count.reviews}</span>
                                                        <span className="text-gray-400">/</span>
                                                        <span className="text-gray-600">{place.totalReviews}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500" />
                                                        <span>{place.rating || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {place.reviews ? (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="text-sm">
                                                                {place.reviews.filter((r: any) => r.syncedToReview).length} synced
                                                            </div>
                                                            <Progress
                                                                value={
                                                                    place.reviews.length > 0
                                                                        ? (place.reviews.filter((r: any) => r.syncedToReview).length / place.reviews.length) * 100
                                                                        : 0
                                                                }
                                                                size="sm"
                                                                color="primary"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">No reviews</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-8">
                                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No Google Maps places found</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Tab>

                <Tab key="unsynced" title={`Unsynced Reviews (${stats.reviews.unsynced})`}>
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Reviews Pending Sync</h3>
                        </CardHeader>
                        <CardBody>
                            {unsyncedReviews?.reviews && unsyncedReviews.reviews.length > 0 ? (
                                <Table aria-label="Unsynced Reviews">
                                    <TableHeader>
                                        <TableColumn>REVIEWER</TableColumn>
                                        <TableColumn>PLACE</TableColumn>
                                        <TableColumn>RATING</TableColumn>
                                        <TableColumn>DATE</TableColumn>
                                        <TableColumn>REVIEW</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {unsyncedReviews.reviews.map((review: any) => (
                                            <TableRow key={review.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-gray-400" />
                                                        <span>{review.authorName || 'Anonymous'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{review.gmapsPlace.name}</p>
                                                        {review.gmapsPlace.business && (
                                                            <p className="text-sm text-gray-500">
                                                                {review.gmapsPlace.business.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500" />
                                                        <span>{review.rating}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm">
                                                            {new Date(review.timePosted).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm max-w-xs truncate">
                                                        {review.text || 'No text'}
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-8">
                                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">All reviews are synced to dataset</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>

            {/* Bulk Sync Modal */}
            <Modal isOpen={isBulkSyncOpen} onClose={onBulkSyncClose}>
                <ModalContent>
                    <ModalHeader>Bulk Sync to Dataset</ModalHeader>
                    <ModalBody>
                        <p>
                            This will sync <strong>{stats.reviews.unsynced}</strong> unsynced Google Maps reviews
                            to your main dataset. This process may take a few moments.
                        </p>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">What will happen:</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Create Review records in main dataset</li>
                                <li>• Link Google Maps reviews to dataset reviews</li>
                                <li>• Enable sentiment analysis and categorization</li>
                                <li>• Make reviews available for insights and reporting</li>
                            </ul>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onBulkSyncClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleBulkSync}
                            isLoading={bulkSyncMutation.isPending}
                        >
                            Sync {stats.reviews.unsynced} Reviews
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Stats Modal */}
            <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="2xl">
                <ModalContent>
                    <ModalHeader>Dataset Statistics</ModalHeader>
                    <ModalBody>
                        <div className="space-y-6">
                            {/* Rating Distribution */}
                            <div>
                                <h4 className="font-medium mb-3">Rating Distribution</h4>
                                <div className="space-y-2">
                                    {stats.ratingDistribution.map((rating: any) => (
                                        <div key={rating.rating} className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 w-16">
                                                <Star className="w-4 h-4 text-yellow-500" />
                                                <span>{rating.rating}</span>
                                            </div>
                                            <Progress
                                                value={(rating.count / stats.reviews.total) * 100}
                                                className="flex-1"
                                                color="primary"
                                            />
                                            <span className="text-sm text-gray-600 w-12">
                                                {rating.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Reviews */}
                            <div>
                                <h4 className="font-medium mb-3">Recent Reviews</h4>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {stats.recentReviews.map((review: any) => (
                                        <div key={review.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{review.authorName}</span>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500" />
                                                        <span>{review.rating}</span>
                                                    </div>
                                                </div>
                                                <Chip
                                                    color={review.synced ? 'success' : 'warning'}
                                                    variant="flat"
                                                    size="sm"
                                                >
                                                    {review.synced ? 'Synced' : 'Pending'}
                                                </Chip>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{review.text}</p>
                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                                <span>{review.placeName}</span>
                                                <span>{new Date(review.timePosted).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button onPress={onStatsClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}