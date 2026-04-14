'use client';

import { useState } from 'react';
import {
    FileText, Search,
    Trash2, Eye, FileSpreadsheet,
    UploadCloud, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Play, MapPin, RotateCw,
    Star, Calendar, MessageSquare
} from 'lucide-react';
import {
    Button,
    Input,
    useDisclosure,
    Chip,
    Spinner,
    Table, TableHeader, TableBody, TableColumn, TableRow, TableCell,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Tooltip
} from '@heroui/react';
import { api } from '@/trpc/react';

type SortColumn = 'name' | 'date' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export default function DocumentDetails() {
    // All State Declarations First
    const [activeTab, setActiveTab] = useState<'datasets' | 'gmaps'>('datasets');
    const [activeDataTab, setActiveDataTab] = useState<'all' | 'processed' | 'pending'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Google Maps State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

    // Manual place modal state
    const { isOpen: isManualPlaceOpen, onOpen: onManualPlaceOpen, onClose: onManualPlaceClose } = useDisclosure();
    const [manualPlaceData, setManualPlaceData] = useState({
        name: '',
        address: '',
        website: '',
        phone: ''
    });

    // Upload Modal State
    const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
    const [uploadedFiles, setUploadedFiles] = useState<Array<{
        name: string;
        size: string;
        progress: number;
        status: 'uploading' | 'success' | 'failed';
        file?: File;
        url?: string;
    }>>([]);

    // View Modal State
    const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

    // Google Maps Reviews Modal State
    const { isOpen: isGmapsReviewsOpen, onOpen: onGmapsReviewsOpen, onClose: onGmapsReviewsClose } = useDisclosure();

    // Review Filters State
    const [reviewDateFilter, setReviewDateFilter] = useState<'all' | '3days' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
    const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

    // Report Modal State
    const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();
    const [processReport, setProcessReport] = useState<{
        successCount: number;
        errors: string[];
    } | null>(null);

    // Manual Fetching for View Data Hook
    const [viewDatasetName, setViewDatasetName] = useState<string | null>(null);

    // TRPC Hooks
    const utils = api.useUtils();
    const { data: datasets, isLoading } = api.dataset.list.useQuery();
    const createDataset = api.dataset.create.useMutation({
        onSuccess: () => {
            void utils.dataset.list.invalidate();
            // Reset upload state after success
            setUploadedFiles([]);
            onUploadClose();
        }
    });
    const processDataset = api.dataset.process.useMutation({
        onSuccess: () => void utils.dataset.list.invalidate()
    });

    // Business Data Hook (from OrganizationDetails)
    const { data: businessData, isLoading: isLoadingBusiness } = api.business.getMyBusiness.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Google Maps TRPC Hooks
    const { data: gmapsPlaces, isLoading: isLoadingPlaces } = (api.gmaps as any).getUserPlaces.useQuery();
    const [searchPlacesInput, setSearchPlacesInput] = useState<{ query: string } | null>(null);
    const { data: searchResults, isLoading: isSearching } = (api.gmaps as any).searchPlaces.useQuery(
        searchPlacesInput!,
        { enabled: !!searchPlacesInput }
    );
    const addPlace = (api.gmaps as any).addPlace.useMutation({
        onSuccess: () => {
            void (utils.gmaps as any).getUserPlaces.invalidate();
            setSearchQuery('');
            setSearchPlacesInput(null);
        }
    });
    const syncPlace = (api.gmaps as any).syncPlace.useMutation({
        onSuccess: () => {
            void (utils.gmaps as any).getUserPlaces.invalidate();
        }
    });
    const deletePlace = (api.gmaps as any).deletePlace.useMutation({
        onSuccess: () => {
            void (utils.gmaps as any).getUserPlaces.invalidate();
        }
    });

    // Search reviews by business name
    const searchReviewsByName = (api.gmaps as any).searchReviewsByName.useMutation({
        onSuccess: () => {
            void (utils.gmaps as any).getUserPlaces.invalidate();
        }
    });

    const handleSearchReviewsByName = async (placeId: string, businessName: string, address?: string) => {
        try {
            console.log('🔍 Searching reviews by name for:', businessName);

            const result = await searchReviewsByName.mutateAsync({
                businessName,
                location: address,
                placeId
            });

            if (result.success) {
                alert(`✅ Success! Found business and synced reviews:\n\n` +
                    `• Business: ${result.businessFound.name}\n` +
                    `• Real Place ID: ${result.businessFound.placeId}\n` +
                    `• Rating: ${result.businessFound.rating || 'N/A'}\n` +
                    `• Total Reviews: ${result.businessFound.totalReviews || 0}\n` +
                    `• Reviews Synced: ${result.reviewsSynced}\n\n` +
                    `Your place now has a real Google Maps place ID and can sync reviews normally!`);
            } else {
                alert(`❌ Search failed: ${result.error}\n\nTried searching for: "${result.searchQuery || businessName}"`);
            }
        } catch (error: any) {
            console.error('❌ Search by name failed:', error);
            alert(`❌ Search failed: ${error?.message || 'Unknown error'}`);
        }
    };
    const debugPlaceReviews = (api.gmaps as any).debugPlaceReviews.useQuery(
        { placeId: selectedPlaceId || '' },
        { enabled: false } // Only run manually
    );

    const debugPlaceData = (api.gmaps as any).debugPlaceData.useQuery(
        { placeId: selectedPlaceId || '' },
        { enabled: false } // Only run manually
    );

    const handleDebugReviews = async (placeId: string) => {
        try {
            const result = await debugPlaceReviews.refetch();
            console.log('🔍 Debug result:', result.data);

            if (result.data?.success) {
                const data = result.data;
                alert(`🔍 Debug Results:\n\n` +
                    `Place: ${data.placeData?.name || 'Not found'}\n` +
                    `Rating: ${data.placeData?.rating || 'N/A'}\n` +
                    `Total Reviews: ${data.placeData?.totalReviews || 0}\n` +
                    `Reviews from place data: ${data.placeData?.reviewsFromPlaceData || 0}\n` +
                    `Reviews from separate call: ${data.reviewsFromSeparateCall || 0}\n\n` +
                    `Sample review: ${data.sampleReview ? `${data.sampleReview.author} (${data.sampleReview.rating}★): ${data.sampleReview.text}` : 'None'}`
                );
            } else {
                alert(`❌ Debug failed: ${result.data?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Debug failed:', error);
            alert('❌ Debug test failed. Check console for details.');
        }
    };

    const handleDebugPlaceData = async (placeId: string) => {
        try {
            setSelectedPlaceId(placeId);
            const result = await debugPlaceData.refetch();
            console.log('🔍 Place data debug:', result.data);

            if (result.data?.success) {
                const data = result.data;
                alert(`🔍 Place Data Analysis:\n\n` +
                    `Database ID: ${data.place.id}\n` +
                    `Place ID: ${data.place.placeId}\n` +
                    `Name: ${data.place.name}\n` +
                    `Google Maps URL: ${data.place.googleMapsUrl || 'None'}\n\n` +
                    `Analysis:\n` +
                    `• Valid Google Place ID: ${data.analysis.isValidGooglePlaceId ? 'Yes' : 'No'}\n` +
                    `• Is Fallback ID: ${data.analysis.isFallbackId ? 'Yes' : 'No'}\n` +
                    `• Is Database ID: ${data.analysis.isDatabaseId ? 'Yes' : 'No'}\n` +
                    `• Place ID Length: ${data.analysis.placeIdLength}\n` +
                    `• Has Google Maps URL: ${data.analysis.hasGoogleMapsUrl ? 'Yes' : 'No'}\n\n` +
                    `${data.analysis.isDatabaseId ? '⚠️ This is a database-generated ID, not a Google Maps place ID!' : ''}`
                );
            } else {
                alert(`❌ Debug failed: ${result.data?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Place data debug failed:', error);
            alert('❌ Debug test failed. Check console for details.');
        }
    };

    // Auto-sync business Google Maps URL
    const addPlaceFromUrl = (api.gmaps as any).addPlaceFromUrl.useMutation({
        onSuccess: () => {
            void (utils.gmaps as any).getUserPlaces.invalidate();
        }
    });

    // Force sync place (for fallback entries)
    const forceSyncPlace = (api.gmaps as any).forceSyncPlace.useMutation({
        onSuccess: () => {
            void (utils.gmaps as any).getUserPlaces.invalidate();
        }
    });

    const syncToDataset = (api.gmaps as any).syncToDataset.useMutation({
        onSuccess: () => {
            void (utils.gmaps as any).getPlaceReviews.invalidate();
        }
    });

    // Google Maps Reviews Hook
    const { data: placeReviews, isLoading: isLoadingReviews } = (api.gmaps as any).getPlaceReviews.useQuery(
        { placeId: selectedPlaceId || '', limit: 50 },
        { enabled: !!selectedPlaceId }
    );

    // Manual place creation - Note: This method doesn't exist in the API yet
    // const addManualPlace = api.gmaps.addManualPlace.useMutation({
    //     onSuccess: () => {
    //         void utils.gmaps.getUserPlaces.invalidate();
    //         setManualPlaceData({ name: '', address: '', website: '', phone: '' });
    //         onManualPlaceClose();
    //     }
    // });

    // Manual Fetching for View Data Hook
    const { data: previewData, isLoading: isLoadingPreview } = api.dataset.getData.useQuery(
        { datasetName: viewDatasetName || '' },
        { enabled: !!viewDatasetName }
    );

    // Handler functions
    const handleAddManualPlace = async () => {
        if (!manualPlaceData.name.trim()) return;

        // TODO: Implement addManualPlace API endpoint
        console.log('Manual place creation not yet implemented:', manualPlaceData);
        alert('Manual place creation is not yet implemented. Please use the search functionality instead.');
        onManualPlaceClose();
    };

    const handleProcess = async (id: string) => {
        try {
            const result = await processDataset.mutateAsync({ datasetId: id });
            if (result.errors && result.errors.length > 0) {
                setProcessReport({
                    successCount: result.processedCount,
                    errors: result.errors
                });
                onReportOpen();
            }
        } catch (error) {
            console.error("Failed to process", error);
        }
    };

    const handleView = (name: string) => {
        setViewDatasetName(name);
        onViewOpen();
    };

    // Google Maps Functions
    const handleSearchPlaces = () => {
        if (!searchQuery.trim()) return;
        setSearchPlacesInput({ query: searchQuery });
    };

    const handleAddPlace = async (placeId: string) => {
        try {
            await addPlace.mutateAsync({ placeId });
        } catch (error) {
            console.error('Failed to add place:', error);
        }
    };

    // Direct sync using existing place ID
    const syncPlaceDirectly = (api.gmaps as any).syncPlaceDirectly.useMutation({
        onSuccess: () => {
            void (utils.gmaps as any).getUserPlaces.invalidate();
        }
    });

    const handleSyncPlace = async (placeId: string) => {
        try {
            // Get the place data
            const place = gmapsPlaces?.find((p: any) => p.id === placeId);
            if (!place) {
                alert('❌ Place not found');
                return;
            }

            console.log('📍 Syncing place directly with ID:', place.placeId);

            const result = await syncPlaceDirectly.mutateAsync({
                databasePlaceId: placeId
            });

            console.log('✅ Sync result:', result);
        } catch (error: any) {
            console.error('❌ Failed to sync place:', error);
            alert(`❌ Sync failed: ${error?.message || 'Unknown error'}. Check the console for more details.`);
        }
    };

    const handleForceSyncPlace = async (placeId: string, placeName: string, googleMapsUrl?: string) => {
        try {
            const result = await forceSyncPlace.mutateAsync({
                placeId,
                businessName: placeName,
                googleMapsUrl
            });
            const datasetResult = await syncToDataset.mutateAsync({ placeId });

            alert(`✅ Force sync successful!\n\n• Business: ${result.place.name}\n• Rating: ${result.place.rating || 'No rating'}\n• Reviews synced: ${result.reviewsSynced}\n• Reviews linked to dataset: ${datasetResult.syncedCount}\n• Total reviews: ${result.totalReviews}`);
        } catch (error: any) {
            console.error('Failed to force sync place:', error);

            if (error?.message?.includes('Could not find real Google Maps data')) {
                alert('🔍 Could not find this business on Google Maps. This could mean:\n\n• The business name is not exact\n• The business is not listed on Google Maps\n• The Google Maps URL is incorrect\n\nTry using the exact business name as it appears on Google Maps.');
            } else {
                alert('❌ Force sync failed. Please try again or check the API status.');
            }
        }
    };

    const handleDeletePlace = async (placeId: string) => {
        try {
            await deletePlace.mutateAsync({ id: placeId });
        } catch (error) {
            console.error('Failed to delete place:', error);
        }
    };

    const handleViewReviews = (placeId: string) => {
        setSelectedPlaceId(placeId);
        setReviewDateFilter('all'); // Reset filter when opening modal
        setCustomDateRange({ start: '', end: '' });
        onGmapsReviewsOpen();
    };

    // Filter reviews based on selected date filter
    const getFilteredReviews = () => {
        if (!placeReviews?.reviews) return [];

        const now = new Date();
        const reviews = placeReviews.reviews;

        switch (reviewDateFilter) {
            case '3days': {
                const threeDaysAgo = new Date(now);
                threeDaysAgo.setDate(now.getDate() - 3);
                return reviews.filter((review: any) => new Date(review.timePosted) >= threeDaysAgo);
            }
            case 'yesterday': {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                yesterday.setHours(0, 0, 0, 0);
                const endOfYesterday = new Date(yesterday);
                endOfYesterday.setHours(23, 59, 59, 999);
                return reviews.filter((review: any) => {
                    const reviewDate = new Date(review.timePosted);
                    return reviewDate >= yesterday && reviewDate <= endOfYesterday;
                });
            }
            case 'week': {
                const oneWeekAgo = new Date(now);
                oneWeekAgo.setDate(now.getDate() - 7);
                return reviews.filter((review: any) => new Date(review.timePosted) >= oneWeekAgo);
            }
            case 'month': {
                const oneMonthAgo = new Date(now);
                oneMonthAgo.setMonth(now.getMonth() - 1);
                return reviews.filter((review: any) => new Date(review.timePosted) >= oneMonthAgo);
            }
            case 'custom': {
                if (!customDateRange.start || !customDateRange.end) return reviews;
                const startDate = new Date(customDateRange.start);
                const endDate = new Date(customDateRange.end);
                endDate.setHours(23, 59, 59, 999); // Include end of day
                return reviews.filter((review: any) => {
                    const reviewDate = new Date(review.timePosted);
                    return reviewDate >= startDate && reviewDate <= endDate;
                });
            }
            default:
                return reviews;
        }
    };

    // Auto-sync business Google Maps URL when available
    const handleAutoSyncBusiness = async () => {
        if (!businessData?.googleMapsUrl) return;

        try {
            await addPlaceFromUrl.mutateAsync({
                googleMapsUrl: businessData.googleMapsUrl,
                businessId: businessData.id
            });

            // Show success message
            console.log('✅ Successfully auto-synced business place');
        } catch (error: any) {
            console.error('❌ Failed to auto-sync business place:', error);
            console.error('URL that caused the error:', businessData.googleMapsUrl);

            // Handle specific error types with better user feedback
            if (error?.data?.code === 'TOO_MANY_REQUESTS' ||
                error?.message?.includes('rate limit') ||
                error?.message?.includes('429')) {
                alert('⏰ SerpApi rate limit exceeded. Your business will be added in offline mode with basic information. Full sync will be available when the API is restored.');
            } else if (error?.message?.includes('SERPAPI_ERROR')) {
                alert('🔑 SerpApi configuration issue. Your business will be added in offline mode. Please check your API key and account status at https://serpapi.com/dashboard');
            } else if (error?.message?.includes('Could not extract business information')) {
                alert('🔍 Could not automatically extract business data from the URL. Please try using the manual "Add Business" option below.');
            } else if (error?.message?.includes('Could not find business data')) {
                alert('📍 Business added in offline mode with basic information. Full details and review syncing will be available when the API is restored.');
            } else {
                alert('❌ Failed to sync Google Maps URL. Your business has been added with basic information. You can update details manually if needed.');
            }
        }
    };

    // Helper function to extract place ID from URL (client-side)
    const extractPlaceIdFromBusinessUrl = (url: string): string | null => {
        try {
            const patterns = [
                /place\/[^\/]+\/@[^\/]+\/[^!]*!1s([^!]+)/,
                /cid=(\d+)/,
                /!1s(0x[a-fA-F0-9]+:[a-fA-F0-9x]+)/,
                /(ChIJ[a-zA-Z0-9_-]+)/,
                /[?&]q=place_id:([^&]+)/,
                /[?&]place_id=([^&]+)/,
                /[?&]placeid=([^&]+)/,
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    return match[1];
                }
            }
            return null;
        } catch {
            return null;
        }
    };

    // Check if business URL is already synced
    const isBusinessSynced = gmapsPlaces?.some((place: any) =>
        businessData?.googleMapsUrl && (
            place.googleMapsUrl === businessData.googleMapsUrl ||
            place.placeId === extractPlaceIdFromBusinessUrl(businessData.googleMapsUrl)
        )
    );

    const handleConfirmUpload = () => {
        // Create datasets for successful uploads
        const successFiles = uploadedFiles.filter(f => f.status === 'success' && f.url);
        successFiles.forEach(f => {
            createDataset.mutate({
                name: f.name,
                fileUrl: f.url!,
                description: "Uploaded via Document Manager"
            });
        });
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newFiles = Array.from(files).map(file => ({
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                progress: 0,
                status: 'uploading' as const,
                file: file
            }));

            setUploadedFiles(prev => [...prev, ...newFiles]);

            // Process uploads
            for (const fileObj of newFiles) {
                const formData = new FormData();
                formData.append('file', fileObj.file);

                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await res.json();

                    if (data.success) {
                        setUploadedFiles(prev => prev.map(f => f.name === fileObj.name ? { ...f, status: 'success', progress: 100, url: data.fileUrl } : f));
                    } else {
                        setUploadedFiles(prev => prev.map(f => f.name === fileObj.name ? { ...f, status: 'failed', progress: 0 } : f));
                    }
                } catch (e) {
                    setUploadedFiles(prev => prev.map(f => f.name === fileObj.name ? { ...f, status: 'failed', progress: 0 } : f));
                }
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'PROCESSING': return 'warning';
            case 'FAILED': return 'danger';
            default: return 'default';
        }
    };

    const getFileIcon = (type: string) => {
        if (type?.includes('csv')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
        return <FileText className="w-5 h-5 text-gray-400" />;
    };

    // Sorting & filtering logic
    const filteredFiles = (datasets || []).filter((d: any) => {
        if (activeDataTab === 'all') return true;
        if (activeDataTab === 'processed') return d.status === 'COMPLETED';
        if (activeDataTab === 'pending') return d.status === 'PENDING' || d.status === 'PROCESSING';
        return true;
    });

    const sortedFiles = [...filteredFiles].sort((a: any, b: any) => {
        if (!sortColumn || !sortDirection) return 0;
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        if (sortColumn === 'date') {
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(sortedFiles.length / itemsPerPage);
    const currentFiles = sortedFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex flex-row justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Data Warehouse</h2>
                    <div className="flex gap-2">
                        {activeTab === 'datasets' && (
                            <Button size="sm" color="primary" onPress={onUploadOpen} startContent={<UploadCloud size={16} />}>
                                Upload Data
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <Button
                    size="sm"
                    variant={activeTab === 'datasets' ? 'solid' : 'light'}
                    className={activeTab === 'datasets' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-400'}
                    onPress={() => setActiveTab('datasets')}
                    startContent={<FileText size={16} />}
                >
                    CSV Datasets
                </Button>
                <Button
                    size="sm"
                    variant={activeTab === 'gmaps' ? 'solid' : 'light'}
                    className={activeTab === 'gmaps' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-400'}
                    onPress={() => setActiveTab('gmaps')}
                    startContent={<MapPin size={16} />}
                >
                    Google Maps
                </Button>
            </div>

            {/* CSV Datasets Tab */}
            {activeTab === 'datasets' && (
                <>
                    {/* Dataset Controls */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2">
                            {['all', 'processed', 'pending'].map((tab) => (
                                <Button
                                    key={tab}
                                    size="sm"
                                    variant={activeDataTab === tab ? 'solid' : 'light'}
                                    className={activeDataTab === tab ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-400'}
                                    onPress={() => setActiveDataTab(tab as any)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Button>
                            ))}
                        </div>
                        <div className="w-64">
                            <Input
                                placeholder="Search datasets..."
                                startContent={<Search className="w-4 h-4 text-gray-400" />}
                                size="sm"
                                variant="bordered"
                            />
                        </div>
                    </div>

                    {/* Files Table */}
                    <div className="bg-white dark:bg-[#161616] p-2 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
                        {isLoading ? (
                            <div className="p-8 flex justify-center"><Spinner /></div>
                        ) : (
                            <Table aria-label="Datasets Table" removeWrapper>
                                <TableHeader>
                                    <TableColumn>NAME</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                    <TableColumn>RECORDS</TableColumn>
                                    <TableColumn>DATE</TableColumn>
                                    <TableColumn>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No datasets found">
                                    {currentFiles.map((dataset: any) => (
                                        <TableRow key={dataset.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-300">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {getFileIcon(dataset.fileType)}
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-white text-sm transition-colors duration-300">{dataset.name}</span>
                                                        <span className="text-tiny text-gray-400 dark:text-gray-500 transition-colors duration-300">CSV Source</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Chip size="sm" variant="flat" color={getStatusColor(dataset.status) as any}>
                                                        {dataset.status}
                                                    </Chip>
                                                    {dataset.errorMessage && (
                                                        <Tooltip content="View Error Log">
                                                            <div className="cursor-help">
                                                                <span className="text-xs text-danger">⚠️</span>
                                                            </div>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {dataset.rowCount?.toLocaleString() || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                                    {new Date(dataset.createdAt).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => handleView(dataset.name)}
                                                        title="View Data"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400 transition-colors duration-300" />
                                                    </Button>

                                                    {(dataset.status === 'PENDING' || dataset.status === 'FAILED') ? (
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            className="text-primary"
                                                            onPress={() => handleProcess(dataset.id)}
                                                            title="Process Pipeline"
                                                        >
                                                            <Play className="w-4 h-4" />
                                                        </Button>
                                                    ) : (
                                                        <div className="w-8"></div>
                                                    )}

                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        className="text-danger"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {/* Pagination Footer */}
                        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#161616] transition-colors duration-300">
                            <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                Page {currentPage} of {totalPages || 1}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button isIconOnly size="sm" variant="light" isDisabled={currentPage === 1} onPress={() => setCurrentPage(1)}><ChevronsLeft className="w-4 h-4" /></Button>
                                <Button isIconOnly size="sm" variant="light" isDisabled={currentPage === 1} onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}><ChevronLeft className="w-4 h-4" /></Button>
                                <Button isIconOnly size="sm" variant="light" isDisabled={currentPage === totalPages} onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}><ChevronRight className="w-4 h-4" /></Button>
                                <Button isIconOnly size="sm" variant="light" isDisabled={currentPage === totalPages} onPress={() => setCurrentPage(totalPages)}><ChevronsRight className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Google Maps Tab */}
            {activeTab === 'gmaps' && (
                <div className="space-y-6">

                    {/* Auto-sync Business Card */}
                    {businessData?.googleMapsUrl && !isBusinessSynced && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl transition-colors duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                                    <div>
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 transition-colors duration-300">Business Google Maps URL Found</h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 transition-colors duration-300">
                                            Auto-sync your business from Organization Details: {businessData.name || 'Your Business'}
                                        </p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate max-w-md transition-colors duration-300">
                                            {businessData.googleMapsUrl}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    color="primary"
                                    size="sm"
                                    onPress={handleAutoSyncBusiness}
                                    isLoading={addPlaceFromUrl.isPending}
                                    startContent={!addPlaceFromUrl.isPending && <MapPin size={16} />}
                                >
                                    Auto-Sync Business
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Google Maps Search */}
                    <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-gray-200 dark:border-white/10 transition-colors duration-300">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Add Google Maps Business</h3>
                            <Button
                                size="sm"
                                variant="light"
                                color="primary"
                                onPress={onManualPlaceOpen}
                                className="px-0 md:px-3"
                            >
                                Add Manually
                            </Button>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 mb-4">
                            <Input
                                placeholder="Search for your business on Google Maps..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearchPlaces()}
                                startContent={<Search className="w-4 h-4 text-gray-400" />}
                                className="flex-1"
                            />
                            <Button
                                color="primary"
                                onPress={handleSearchPlaces}
                                isLoading={isSearching}
                                startContent={!isSearching && <Search size={16} />}
                            >
                                Search
                            </Button>
                        </div>

                        {/* Search Results */}
                        {searchResults && searchResults.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-700">Search Results:</h4>
                                {searchResults.map((place: any) => (
                                    <div key={place.place_id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-white/5 rounded-lg transition-colors duration-300">
                                        <div className="flex-1">
                                            <h5 className="font-medium text-gray-900 dark:text-white transition-colors duration-300">{place.name}</h5>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">{place.formatted_address}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">{place.rating || 'No rating'}</span>
                                                </div>
                                                <span className="text-sm text-gray-500 dark:text-gray-500 transition-colors duration-300">
                                                    ({place.user_ratings_total || 0} reviews)
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            color="primary"
                                            onPress={() => handleAddPlace(place.place_id)}
                                            isLoading={addPlace.isPending}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Connected Places */}
                    <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-gray-200 dark:border-white/10 transition-colors duration-300">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white transition-colors duration-300">Connected Google Maps Places</h3>

                        {/* Info Banner for Offline Mode */}
                        {gmapsPlaces && gmapsPlaces.some((place: any) => place.placeId.startsWith('fallback_') || place.placeId.startsWith('manual_')) && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 transition-colors duration-300">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 transition-colors duration-300">ℹ️</div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1 transition-colors duration-300">Offline Mode Active</h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2 transition-colors duration-300">
                                            Some businesses were added in offline mode due to SerpApi limitations.
                                            Review syncing is not available for these entries.
                                        </p>
                                        <div className="text-xs text-blue-700 dark:text-blue-300 transition-colors duration-300">
                                            <strong>To enable review syncing:</strong>
                                            <br />• Check your SerpApi account status and quota
                                            <br />• Wait for rate limits to reset (usually monthly)
                                            <br />• Re-add the business when API is available
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isLoadingPlaces ? (
                            <div className="flex justify-center p-8"><Spinner /></div>
                        ) : !gmapsPlaces || gmapsPlaces.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-500 transition-colors duration-300" />
                                <p>No Google Maps places connected yet.</p>
                                <p className="text-sm">Search and add your business above to start syncing reviews.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {gmapsPlaces.map((place: any) => (
                                    <div key={place.id} className="border border-gray-200 dark:border-white/5 rounded-lg p-4 transition-colors duration-300">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-medium text-lg text-gray-900 dark:text-white transition-colors duration-300">{place.name}</h4>
                                                    <Chip size="sm" color={place.syncEnabled ? 'success' : 'default'}>
                                                        {place.syncEnabled ? 'Sync On' : 'Sync Off'}
                                                    </Chip>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 transition-colors duration-300">{place.address}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                        <span>{place.rating || 'No rating'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span>
                                                            {(() => {
                                                                const isFallbackId = place.placeId.startsWith('fallback_') ||
                                                                    place.placeId.startsWith('manual_') ||
                                                                    (place.placeId.length === 25 && !place.placeId.includes(':')); // Prisma CUID but not hex format

                                                                if (isFallbackId) {
                                                                    return 'Reviews unavailable (offline mode)';
                                                                } else {
                                                                    return `${place.totalReviews} reviews`;
                                                                }
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>
                                                            Last sync: {place.lastSynced
                                                                ? new Date(place.lastSynced).toLocaleDateString()
                                                                : 'Never'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => handleViewReviews(place.id)}
                                                    startContent={<Eye size={16} />}
                                                    className="dark:text-white"
                                                >
                                                    View Reviews
                                                </Button>

                                                {(() => {
                                                    const isFallbackId = place.placeId.startsWith('fallback_') ||
                                                        place.placeId.startsWith('manual_') ||
                                                        (place.placeId.length === 25 && !place.placeId.includes(':')); // Prisma CUID but not hex format

                                                    if (isFallbackId) {
                                                        return (
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    color="success"
                                                                    onPress={() => handleSearchReviewsByName(place.id, place.name, place.address || undefined)}
                                                                    isLoading={searchReviewsByName.isPending}
                                                                    startContent={!searchReviewsByName.isPending && <Search size={16} />}
                                                                    title="Search for this business by name to get real Google Maps data and reviews"
                                                                >
                                                                    🔍 Search Reviews
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    color="warning"
                                                                    onPress={() => handleForceSyncPlace(place.id, place.name, place.googleMapsUrl || undefined)}
                                                                    isLoading={forceSyncPlace.isPending}
                                                                    startContent={!forceSyncPlace.isPending && <RotateCw size={16} />}
                                                                    title="Try to get real Google Maps data using stored URL"
                                                                >
                                                                    Force Sync
                                                                </Button>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <Button
                                                                size="sm"
                                                                color="primary"
                                                                onPress={() => handleSyncPlace(place.id)}
                                                                isLoading={syncPlace.isPending}
                                                                startContent={!syncPlace.isPending && <RotateCw size={16} />}
                                                                title="Sync reviews from Google Maps"
                                                            >
                                                                Sync Now
                                                            </Button>
                                                        );
                                                    }
                                                })()}

                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    className="text-danger dark:text-red-400"
                                                    onPress={() => handleDeletePlace(place.id)}
                                                    isLoading={deletePlace.isPending}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Upload Modal */}
            <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="2xl">
                <ModalContent>
                    <ModalHeader className="border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-semibold">Upload Data Source</h3>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-primary/5 mb-6">
                            <UploadCloud className="w-12 h-12 text-primary mx-auto mb-3" />
                            <p className="text-sm font-medium">Drag CSV files here</p>
                            <label className="cursor-pointer mt-4 inline-block">
                                <input type="file" accept=".csv" multiple className="hidden" onChange={handleFileSelect} />
                                <Button size="sm" color="primary" as="span">Select Files</Button>
                            </label>
                        </div>
                        {uploadedFiles.length > 0 && (
                            <div className="space-y-3">
                                {uploadedFiles.map((file, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded p-3 flex justify-between items-center">
                                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                        <div className="flex items-center gap-2">
                                            {file.status === 'success' && <Chip size="sm" color="success">Uploaded</Chip>}
                                            {file.status === 'failed' && <Chip size="sm" color="danger">Failed</Chip>}
                                            {file.status === 'uploading' && <Spinner size="sm" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onUploadClose}>Cancel</Button>
                        <Button color="primary" onPress={handleConfirmUpload} isDisabled={uploadedFiles.filter(f => f.status === 'success').length === 0}>
                            Add to Warehouse
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* View Data Modal */}
            <Modal isOpen={isViewOpen} onClose={onViewClose} size="3xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>Data Preview: {viewDatasetName}</ModalHeader>
                    <ModalBody>
                        {isLoadingPreview ? (
                            <div className="flex justify-center p-8"><Spinner /></div>
                        ) : !previewData || previewData.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No data found or processed yet.</p>
                        ) : (
                            <Table aria-label="Preview Table">
                                <TableHeader>
                                    <TableColumn>Review</TableColumn>
                                    <TableColumn>Rating</TableColumn>
                                    <TableColumn>Source</TableColumn>
                                    <TableColumn>Date</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No data available">
                                    {previewData.map((row: any) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <div className="max-h-[60px] overflow-y-auto text-xs">{row.comment}</div>
                                            </TableCell>
                                            <TableCell>{row.rating}</TableCell>
                                            <TableCell>{row.customerName || 'Anonymous'}</TableCell>
                                            <TableCell>{new Date(row.reviewDate).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onPress={onViewClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Google Maps Reviews Modal */}
            <Modal isOpen={isGmapsReviewsOpen} onClose={onGmapsReviewsClose} size="4xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>
                        <div className="flex flex-col space-y-2">
                            <h3 className="text-lg font-semibold">Google Maps Reviews</h3>

                            {/* Date Filter Controls */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Filter by:</span>
                                <div className="flex gap-1">
                                    {[
                                        { key: 'all', label: 'All Time' },
                                        { key: '3days', label: 'Last 3 Days' },
                                        { key: 'yesterday', label: 'Yesterday' },
                                        { key: 'week', label: 'Last Week' },
                                        { key: 'month', label: 'Last Month' },
                                        { key: 'custom', label: 'Custom Range' }
                                    ].map((filter) => (
                                        <Button
                                            key={filter.key}
                                            size="sm"
                                            variant={reviewDateFilter === filter.key ? 'solid' : 'light'}
                                            className={reviewDateFilter === filter.key ? 'bg-primary text-white' : 'text-gray-600'}
                                            onPress={() => setReviewDateFilter(filter.key as any)}
                                        >
                                            {filter.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Date Range Inputs */}
                            {reviewDateFilter === 'custom' && (
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="date"
                                        label="Start Date"
                                        size="sm"
                                        value={customDateRange.start}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-40"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <Input
                                        type="date"
                                        label="End Date"
                                        size="sm"
                                        value={customDateRange.end}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-40"
                                    />
                                </div>
                            )}
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        {isLoadingReviews ? (
                            <div className="flex justify-center p-8"><Spinner /></div>
                        ) : !placeReviews || placeReviews.reviews.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium mb-2">No reviews found for this place</p>
                                <div className="text-sm space-y-1">
                                    <p>This could be because:</p>
                                    <p>• The business was added in offline mode</p>
                                    <p>• SerpApi rate limits are active</p>
                                    <p>• The business has no Google Maps reviews</p>
                                    <p className="mt-3 text-blue-600">
                                        Try syncing again when SerpApi is available
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Reviews Date Range Info */}
                                {placeReviews.reviews.length > 0 && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between text-sm text-gray-700">
                                            <span>
                                                <strong>Available Reviews Range:</strong> {' '}
                                                {new Date(Math.min(...placeReviews.reviews.map((r: any) => new Date(r.timePosted).getTime()))).toLocaleDateString()}
                                                {' '} to {' '}
                                                {new Date(Math.max(...placeReviews.reviews.map((r: any) => new Date(r.timePosted).getTime()))).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Total synced: {placeReviews.reviews.length} reviews
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Filtered Reviews Count */}
                                {(() => {
                                    const filteredReviews = getFilteredReviews();
                                    if (reviewDateFilter !== 'all') {
                                        return (
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm text-gray-600">
                                                    Showing {filteredReviews.length} of {placeReviews.reviews.length} reviews
                                                </span>
                                                {filteredReviews.length === 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-orange-600">No reviews found for selected period</span>
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            color="primary"
                                                            onPress={() => setReviewDateFilter('all')}
                                                        >
                                                            Show All
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Reviews List */}
                                {getFilteredReviews().map((review: any) => (
                                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            {review.authorPhotoUrl && (
                                                <img
                                                    src={review.authorPhotoUrl}
                                                    alt={review.authorName || 'Reviewer'}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h5 className="font-medium">{review.authorName || 'Anonymous'}</h5>
                                                    {review.authorLevel && (
                                                        <Chip size="sm" variant="flat" color="primary">
                                                            {review.authorLevel}
                                                        </Chip>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 mb-2">{review.text}</p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>{new Date(review.timePosted).toLocaleDateString()}</span>
                                                    {review.likeCount && review.likeCount > 0 && (
                                                        <span>{review.likeCount} likes</span>
                                                    )}
                                                    <Chip size="sm" color={review.syncedToReview ? 'success' : 'default'}>
                                                        {review.syncedToReview ? 'Synced' : 'Not Synced'}
                                                    </Chip>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onPress={onGmapsReviewsClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Processing Result Report Modal */}
            <Modal isOpen={isReportOpen} onClose={onReportClose} size="2xl">
                <ModalContent>
                    <ModalHeader className="bg-gray-50 border-b">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900">Processing Validation Report</h3>
                            <p className="text-sm text-gray-500">Result of your data ingestion</p>
                        </div>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                                <p className="text-sm text-emerald-600 font-medium">Accepted Rows</p>
                                <p className="text-2xl font-bold text-emerald-700">{processReport?.successCount || 0}</p>
                            </div>
                            <div className="flex-1 p-4 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-sm text-red-600 font-medium">Rejected Rows</p>
                                <p className="text-2xl font-bold text-red-700">{processReport?.errors.length || 0}</p>
                            </div>
                        </div>

                        {processReport && processReport.errors.length > 0 ? (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Detailed Error Log</h4>
                                <div className="bg-gray-100 rounded-lg p-4 h-[300px] overflow-y-auto space-y-2 border border-gray-200 font-mono text-sm">
                                    {processReport.errors.map((err, idx) => (
                                        <div key={idx} className="text-red-600 border-b border-gray-200 pb-1 last:border-0">
                                            • {err}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>All rows processed successfully! 🎉</p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onPress={onReportClose}>Close Report</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Manual Place Creation Modal */}
            <Modal isOpen={isManualPlaceOpen} onClose={onManualPlaceClose} size="2xl">
                <ModalContent>
                    <ModalHeader className="border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-semibold">Add Business Manually</h3>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Name *
                                </label>
                                <Input
                                    placeholder="e.g., Cold 'n Brew UNS"
                                    value={manualPlaceData.name}
                                    onChange={(e) => setManualPlaceData(prev => ({ ...prev, name: e.target.value }))}
                                    isRequired
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <Input
                                    placeholder="Business address (optional)"
                                    value={manualPlaceData.address}
                                    onChange={(e) => setManualPlaceData(prev => ({ ...prev, address: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Website
                                </label>
                                <Input
                                    placeholder="https://example.com (optional)"
                                    value={manualPlaceData.website}
                                    onChange={(e) => setManualPlaceData(prev => ({ ...prev, website: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <Input
                                    placeholder="Phone number (optional)"
                                    value={manualPlaceData.phone}
                                    onChange={(e) => setManualPlaceData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 transition-colors duration-300">
                                <p className="text-sm text-blue-800 dark:text-blue-200 transition-colors duration-300">
                                    <strong>Note:</strong> Manual entries won't have review syncing capabilities.
                                    For full functionality, try using the Google Maps URL or search method when the API is available.
                                </p>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onManualPlaceClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleAddManualPlace}
                            isDisabled={!manualPlaceData.name.trim()}
                        >
                            Add Business
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}