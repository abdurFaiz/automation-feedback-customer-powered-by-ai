'use client';

import { useState } from 'react';
import { useDisclosure } from "@heroui/react";
import { Card, CardHeader, SectionTitle } from './Card';
import EditModal from './EditModal';
import BrandForm from './forms-edit-modal/BrandForm';
import OperationsForm from './forms-edit-modal/OperationsForm';
import PulseForm from './forms-edit-modal/PulseForm';
import DataSyncForm from './forms-edit-modal/DataSyncForm';
import { api } from '@/trpc/react';
import { Spinner } from "@heroui/react";
import type { BusinessFormData } from '@/types/business';

interface InfoItemProps {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

function InfoItem({ label, value, icon }: InfoItemProps) {
    return (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">{label}</p>
            <div className="flex items-center gap-1.5">
                {icon && <span className="text-gray-400 dark:text-gray-500 transition-colors duration-300">{icon}</span>}
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">{value}</p>
            </div>
        </div>
    );
}

interface AddressFieldProps {
    label: string;
    value?: string;
    sublabel?: string;
}

function AddressField({ label, value, sublabel }: AddressFieldProps) {
    return (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">{sublabel || label}</p>
            <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">{value || label}</p>
        </div>
    );
}

type EditSection = 'brand' | 'operations' | 'pulse' | 'data' | null;

export default function OrganizationDetails() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingSection, setEditingSection] = useState<EditSection>(null);

    // Fetch business data from database
    const { data: businessData, isLoading, error } = api.business.getMyBusiness.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Add mutation for updating business data
    const utils = api.useUtils();
    const updateMutation = api.business.upsertProfile.useMutation({
        onSuccess: () => {
            // Invalidate and refetch the business data
            utils.business.getMyBusiness.invalidate();
            onClose();
        },
        onError: (error) => {
            console.error('Failed to update business:', error);
            alert('Failed to save changes. Please try again.');
        }
    });

    const [formData, setFormData] = useState<Record<string, any>>({});

    const handleEdit = (section: EditSection) => {
        setEditingSection(section);
        setFormData({}); // Reset form data
        onOpen();
    };

    const handleSave = () => {
        if (!businessData || Object.keys(formData).length === 0) {
            onClose();
            return;
        }

        // Prepare data for mutation based on the editing section
        const updateData = {
            businessName: formData.businessName || businessData.name || '',
            industry: formData.industry || businessData.type || '',
            location: formData.location || businessData.address || '',
            tagline: formData.tagline || businessData.tagline,
            amenities: formData.amenities || (businessData.amenities ? businessData.amenities.join(',') : ''),
            serviceStyle: formData.serviceStyle || businessData.serviceStyle,
            avgDailyGuests: formData.avgDailyGuests || businessData.avgDailyGuests,
            openingHours: formData.openingHours || businessData.openingHours,
            staffPerShift: formData.staffPerShift || businessData.staffPerShift,
            primaryAudience: formData.primaryAudience || businessData.primaryAudience,
            valueProposition: formData.valueProposition || businessData.valueProposition,
            returnCycle: formData.returnCycle || businessData.returnCycle,
            googleMapsUrl: formData.googleMapsUrl || businessData.googleMapsUrl,
            criticalThreshold: formData.criticalThreshold || businessData.criticalThreshold,
            primaryGoal: formData.primaryGoal || businessData.primaryGoal,
            targetKpi: formData.targetKpi || businessData.targetKpi,
        };

        updateMutation.mutate(updateData);
    };

    const renderModalContent = () => {
        switch (editingSection) {
            case 'brand':
                return <BrandForm businessData={businessData as BusinessFormData | null} onDataChange={setFormData} />;
            case 'operations':
                return <OperationsForm businessData={businessData as BusinessFormData | null} onDataChange={setFormData} />;
            case 'pulse':
                return <PulseForm businessData={businessData as BusinessFormData | null} onDataChange={setFormData} />;
            case 'data':
                return <DataSyncForm businessData={businessData as BusinessFormData | null} onDataChange={setFormData} />;
            default:
                return null;
        }
    };

    const getModalTitle = () => {
        switch (editingSection) {
            case 'brand': return 'Edit Brand Persona';
            case 'operations': return 'Edit Operational Details';
            case 'pulse': return 'Edit Business Pulse';
            case 'data': return 'Edit Data Sync & Goals';
            default: return 'Edit Details';
        }
    };

    // Helper functions to format data
    const formatAmenities = (amenities: string[]) => {
        if (!amenities || amenities.length === 0) return 'Not specified';
        return amenities.map(amenity => {
            // Convert snake_case to readable format
            return amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }).join(', ');
    };

    const formatServiceStyle = (serviceStyle: string | null) => {
        if (!serviceStyle) return 'Not specified';
        return serviceStyle.split(',').map(style =>
            style.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        ).join(' & ');
    };

    const formatIndustryType = (type: string | null) => {
        if (!type) return 'Not specified';
        const typeMap: Record<string, string> = {
            'fb': 'Food & Beverage',
            'coffee_shop': 'Coffee Shop',
            'restaurant': 'Restaurant',
            'cafe': 'Cafe',
            'retail': 'Retail',
            'hospitality': 'Hospitality',
            'other': 'Other'
        };
        return typeMap[type] || type;
    };

    const truncateUrl = (url: string | null) => {
        if (!url) return 'Not configured';
        if (url.length > 30) {
            return url.substring(0, 30) + '...';
        }
        return url;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner size="lg" color="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 mb-4">Error loading business data</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!businessData) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No business profile found</p>
                <a
                    href="/business-profile"
                    className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                    Create Business Profile
                </a>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-title-black dark:text-white transition-colors duration-300">Organization Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Brand Identity Card */}
                <Card>
                    <CardHeader title="Brand Persona" onEdit={() => handleEdit('brand')} />
                    <div className="space-y-4">
                        <div className="border-t border-gray-100 dark:border-white/5 pt-4 transition-colors duration-300">
                            <SectionTitle>Brand Identity</SectionTitle>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <InfoItem label="Business Name" value={businessData.name || 'Not specified'} />
                                <InfoItem label="Industry" value={formatIndustryType(businessData.type)} />
                                <InfoItem label="Location (HQ)" value={businessData.address || 'Not specified'} />
                                <InfoItem label="Tagline" value={businessData.tagline || 'Not specified'} />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Operational Details Card */}
                <Card>
                    <CardHeader title="Operational Anatomy" onEdit={() => handleEdit('operations')} />
                    <div className="space-y-4">
                        <div className="border-t border-gray-100 pt-4">
                            <SectionTitle>Facilities & Operations</SectionTitle>
                            <div className="grid grid-cols-2 gap-4">
                                <AddressField label="Amenities" value={formatAmenities(businessData.amenities)} />
                                <AddressField label="Service Style" value={formatServiceStyle(businessData.serviceStyle)} />
                                <AddressField label="Opening Hours" value={businessData.openingHours || 'Not specified'} />
                                <AddressField label="Avg Daily Guests" value={businessData.avgDailyGuests || 'Not specified'} />
                                <AddressField label="Staff per Shift" value={businessData.staffPerShift || 'Not specified'} />
                                <AddressField label="Service Type" value={formatServiceStyle(businessData.serviceStyle)} />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Business Pulse & Data Sync */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Business Pulse Card */}
                <Card>
                    <CardHeader title="Business Pulse & Persona" onEdit={() => handleEdit('pulse')} />
                    <div>
                        <SectionTitle>Strategic Context</SectionTitle>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <InfoItem label="Primary Audience" value={businessData.primaryAudience || 'Not specified'} />
                            <InfoItem label="Value Proposition" value={businessData.valueProposition || 'Not specified'} />
                            <InfoItem label="Return Cycle" value={businessData.returnCycle || 'Not specified'} />
                            <InfoItem label="Customer Type" value={businessData.returnCycle ? `${businessData.returnCycle} visitors` : 'Not specified'} />
                        </div>
                    </div>
                </Card>

                {/* Data Sync Card */}
                <Card>
                    <CardHeader title="Data Sync & Goals" onEdit={() => handleEdit('data')} />
                    <div>
                        <SectionTitle>Tracking & Objectives</SectionTitle>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">Google Maps URL</p>
                                <p className="text-sm text-primary truncate">{truncateUrl(businessData.googleMapsUrl)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">Critical Threshold</p>
                                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">{businessData.criticalThreshold || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">Primary Goal</p>
                                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">{businessData.primaryGoal || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">Target KPI</p>
                                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">{businessData.targetKpi || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Edit Modal */}
            <EditModal
                isOpen={isOpen}
                onClose={onClose}
                title={getModalTitle()}
                onSave={handleSave}
                isLoading={updateMutation.isPending}
            >
                {renderModalContent()}
            </EditModal>
        </div>
    );
}
