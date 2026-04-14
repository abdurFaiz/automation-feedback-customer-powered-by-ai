'use client';

import MultiStepForm from '@/components/forms/MultiStepForm';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { Spinner } from "@heroui/spinner";
import { useEffect, useState } from 'react';

const splitOpeningHours = (value?: string | null) => {
    if (!value) {
        return { start: '', end: '' };
    }

    const [start, end] = value.split('-').map((part) => part.trim());
    return { start: start || '', end: end || '' };
};

const formSteps = [
    {
        id: 1,
        title: 'Brand Identity',
        subtitle: 'Identitas Dasar - Branding dashboard dan laporan',
        fields: [
            {
                name: 'businessName',
                label: 'Business Name',
                type: 'text' as const,
                placeholder: 'Enter your business name',
                required: true,
            },
            {
                name: 'industry',
                label: 'Industry/Category',
                type: 'select' as const,
                placeholder: 'Select your industry',
                required: true,
                options: [
                    { label: 'Food & Beverage (F&B)', value: 'fb' },
                    { label: 'Retail', value: 'retail' },
                    { label: 'Hospitality', value: 'hospitality' },
                    { label: 'Coffee Shop', value: 'coffee_shop' },
                    { label: 'Restaurant', value: 'restaurant' },
                    { label: 'Cafe', value: 'cafe' },
                    { label: 'Other', value: 'other' },
                ],
            },
            {
                name: 'location',
                label: 'Location (HQ)',
                type: 'text' as const,
                placeholder: 'City or operational center address',
                required: true,
            },
            {
                name: 'tagline',
                label: 'Tagline/Mission',
                type: 'textarea' as const,
                placeholder: 'Core values you want to maintain (helps AI determine brand voice)',
                required: false,
            },
        ],
    },
    {
        id: 2,
        title: 'Operational Anatomy',
        subtitle: 'Detail Lapangan & Fasilitas - Understanding your physical location',
        fields: [
            {
                name: 'amenities',
                label: 'Amenities/Facilities',
                type: 'select' as const,
                placeholder: 'Select amenities',
                required: true,
                options: [
                    { label: 'WiFi', value: 'wifi' },
                    { label: 'Parking', value: 'parking' },
                    { label: 'Prayer Room', value: 'prayer_room' },
                    { label: 'Smoking Area', value: 'smoking_area' },
                    { label: 'Power Outlets', value: 'power_outlets' },
                    { label: 'AC', value: 'ac' },
                ],
            },
            {
                name: 'serviceStyle',
                label: 'Service Style',
                type: 'select' as const,
                placeholder: 'Select service style',
                required: true,
                options: [
                    { label: 'Self-service', value: 'self_service' },
                    { label: 'Full-service', value: 'full_service' },
                    { label: 'To-go', value: 'to_go' },
                    { label: 'Mixed', value: 'mixed' },
                ],
            },
            {
                name: 'avgDailyGuests',
                label: 'Average Daily Guests',
                type: 'text' as const,
                placeholder: 'Estimated number of daily visitors',
                required: false,
            },
            {
                name: 'openingHoursStart',
                secondaryName: 'openingHoursEnd',
                label: 'Opening Hours',
                type: 'timeRange' as const,
                placeholder: 'Start time',
                secondaryLabel: 'Until',
                secondaryPlaceholder: 'End time',
                required: true,
                secondaryRequired: true,
            },
            {
                name: 'staffPerShift',
                label: 'Staff per Shift',
                type: 'text' as const,
                placeholder: 'Number of employees per shift',
                required: false,
            },
        ],
    },
    {
        id: 3,
        title: 'Business Pulse & Persona',
        subtitle: 'Konteks Strategis - Strategic context for revenue and loyalty analysis',
        fields: [
            {
                name: 'primaryAudience',
                label: 'Primary Audience (Persona)',
                type: 'text' as const,
                placeholder: 'e.g., Students, Remote Workers, Families',
                required: true,
            },
            {
                name: 'valueProposition',
                label: 'Key Value Proposition',
                type: 'text' as const,
                placeholder: 'e.g., Affordable pricing, Aesthetic space, Authentic taste',
                required: true,
            },
            {
                name: 'returnCycle',
                label: 'Customer Return Cycle',
                type: 'select' as const,
                placeholder: 'How often do customers return?',
                required: false,
                options: [
                    { label: 'Daily', value: 'daily' },
                    { label: 'Weekly', value: 'weekly' },
                    { label: 'Bi-weekly', value: 'biweekly' },
                    { label: 'Monthly', value: 'monthly' },
                    { label: 'Rarely', value: 'rarely' },
                ],
            },
        ],
    },
    {
        id: 4,
        title: 'Data Sync & Goal Setting',
        subtitle: 'Sumber Data & Target - Activate data pipeline and set your goals',
        fields: [
            {
                name: 'googleMapsUrl',
                label: 'Google Maps URL',
                type: 'text' as const,
                placeholder: 'Your Google Maps business page URL',
                required: true,
                validation: (value: string) => {
                    if (value && !value.includes('https://maps.app.goo.gl')) {
                        return 'Please enter a valid Google Maps URL';
                    }
                    return null;
                },
            },
            {
                name: 'criticalThreshold',
                label: 'Critical Threshold',
                type: 'text' as const,
                placeholder: 'e.g., Notify if weekly rating below 4.0',
                required: false,
            },
            {
                name: 'primaryGoal',
                label: 'Primary Business Goal',
                type: 'text' as const,
                placeholder: 'e.g., Increase Rating, Reduce Churn, Optimize Speed',
                required: true,
            },
            {
                name: 'targetKpi',
                label: 'Target KPI',
                type: 'textarea' as const,
                placeholder: 'e.g., Target rating 4.9 in 90 days',
                required: false,
            },
        ],
    },
];

export default function BusinessProfilePage() {
    const router = useRouter();

    const { data: businessData, isLoading, error } = api.business.getMyBusiness.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
    const upsertMutation = api.business.upsertProfile.useMutation({
        onSuccess: () => {
            router.push('/profile');
        },
        onError: (error) => {
            console.error('Failed to save profile:', error);
            // Optionally add toast notification here
        }
    });

    const [initialData, setInitialData] = useState<Record<string, string>>({});
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        if (businessData && !dataLoaded) {
            const { start: openingHoursStart, end: openingHoursEnd } = splitOpeningHours(businessData.openingHours);

            setInitialData({
                businessName: businessData.name || '',
                industry: businessData.type || '',
                location: businessData.address || '',
                tagline: businessData.tagline || '',
                amenities: businessData.amenities ? businessData.amenities.join(',') : '',
                serviceStyle: businessData.serviceStyle || '',
                avgDailyGuests: businessData.avgDailyGuests || '',
                openingHoursStart,
                openingHoursEnd,
                staffPerShift: businessData.staffPerShift || '',
                primaryAudience: businessData.primaryAudience || '',
                valueProposition: businessData.valueProposition || '',
                returnCycle: businessData.returnCycle || '',
                googleMapsUrl: businessData.googleMapsUrl || '',
                criticalThreshold: businessData.criticalThreshold || '',
                primaryGoal: businessData.primaryGoal || '',
                targetKpi: businessData.targetKpi || '',
            });
            setDataLoaded(true);
        }
    }, [businessData, dataLoaded]);

    const handleComplete = (data: Record<string, string>) => {
        const openingHours = data.openingHoursStart && data.openingHoursEnd
            ? `${data.openingHoursStart} - ${data.openingHoursEnd}`
            : '';

        upsertMutation.mutate({
            businessName: data.businessName || '',
            industry: data.industry || '',
            location: data.location || '',
            tagline: data.tagline,
            amenities: data.amenities,
            serviceStyle: data.serviceStyle,
            avgDailyGuests: data.avgDailyGuests,
            openingHours,
            staffPerShift: data.staffPerShift,
            primaryAudience: data.primaryAudience,
            valueProposition: data.valueProposition,
            returnCycle: data.returnCycle,
            googleMapsUrl: data.googleMapsUrl,
            criticalThreshold: data.criticalThreshold,
            primaryGoal: data.primaryGoal,
            targetKpi: data.targetKpi,
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Spinner size="lg" color="primary" />
            </div>
        );
    }

    if (error) {
        console.error('Error loading business data:', error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error loading business data</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Decorative Side */}
            <div className="hidden lg:flex lg:w-1/3 relative overflow-hidden p-4" style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 30%, #f0f9ff 60%, #FFFFFF 100%)'
            }}>
                {/* Logo */}
                <div className="absolute top-8 left-8 z-50">
                    <div className="flex items-center gap-2">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-white text-xl font-semibold">Spinotek</span>
                    </div>
                </div>

                <img src="/images/mock-dashboard.png" alt="Dashboard Preview" className='size-full object-cover rounded-3xl' />
            </div>

            {/* Right Panel - Form Side with Grid Layout */}
            <div className="w-full lg:w-2/3 bg-white flex items-center justify-center p-8 relative overflow-hidden">
                {/* Grid Layout System - Responsive */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <defs>
                        {/* Hatched Pattern Definition */}
                        <pattern id="hatchPattern" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#93c5fd" fill='#ffff' fillOpacity={0.2} strokeWidth="1" />
                        </pattern>
                    </defs>

                    {/* Mobile Version (< 768px) */}
                    <g className="md:hidden">
                        {/* Left Margin Line */}
                        <line x1="20" y1="0" x2="20" y2="100%" stroke="#bfdbfe" strokeWidth="1" />
                        {/* Right Margin Line */}
                        <line x1="calc(100% - 20px)" y1="0" x2="calc(100% - 20px)" y2="100%" stroke="#bfdbfe" strokeWidth="1" />

                        {/* Horizontal Guidelines */}
                        <line x1="0" y1="5%" x2="100%" y2="5%" stroke="#bfdbfe" strokeWidth="1" />
                        <line x1="0" y1="95%" x2="100%" y2="95%" stroke="#bfdbfe" strokeWidth="1" />

                        {/* Corner Decorations - Small */}
                        <rect x="0" y="0" width="80" height="40" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 80px)" y="0" width="80" height="40" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="0" y="calc(100% - 40px)" width="80" height="40" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 80px)" y="calc(100% - 40px)" width="80" height="40" fill="url(#hatchPattern)" opacity="1" />
                    </g>

                    {/* Tablet Version (768px - 1024px) */}
                    <g className="hidden md:block lg:hidden">
                        {/* Left Margin Line */}
                        <line x1="32" y1="0" x2="32" y2="100%" stroke="#bfdbfe" strokeWidth="1" />
                        {/* Right Margin Line */}
                        <line x1="calc(100% - 32px)" y1="0" x2="calc(100% - 32px)" y2="100%" stroke="#bfdbfe" strokeWidth="1" />

                        {/* Column Lines */}
                        <line x1="calc(32px + 40px)" y1="0" x2="calc(32px + 40px)" y2="100%" stroke="#bfdbfe" strokeWidth="1" />
                        <line x1="calc(100% - 32px - 40px)" y1="0" x2="calc(100% - 32px - 40px)" y2="100%" stroke="#bfdbfe" strokeWidth="1" />

                        {/* Horizontal Guidelines */}
                        <line x1="0" y1="6%" x2="100%" y2="6%" stroke="#bfdbfe" strokeWidth="1" />
                        <line x1="0" y1="94%" x2="100%" y2="94%" stroke="#bfdbfe" strokeWidth="1" />

                        {/* Corner Decorations - Medium */}
                        <rect x="0" y="0" width="120" height="55" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 120px)" y="0" width="120" height="55" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="0" y="calc(100% - 55px)" width="120" height="55" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 120px)" y="calc(100% - 55px)" width="120" height="55" fill="url(#hatchPattern)" opacity="1" />
                    </g>

                    {/* Desktop Version (>= 1024px) */}
                    <g className="hidden lg:block">
                        {/* Left Margin Line */}
                        <line x1="50" y1="0" x2="50" y2="100%" stroke="#bfdbfe" strokeWidth="1" />
                        {/* Right Margin Line */}
                        <line x1="calc(100% - 64px)" y1="0" x2="calc(100% - 64px)" y2="100%" stroke="#bfdbfe" strokeWidth="1" />

                        {/* Column Lines with 24px gaps */}
                        <line x1="calc(94px + 60px)" y1="0" x2="calc(94px + 60px)" y2="100%" stroke="#bfdbfe" strokeWidth="1" />
                        <line x1="calc(94px + 107px)" y1="0" x2="calc(94px + 107px)" y2="100%" stroke="#bfdbfe" strokeWidth="1" />
                        <line x1="calc(100% - 94px - 60px)" y1="0" x2="calc(100% - 94px - 60px)" y2="100%" stroke="#bfdbfe" strokeWidth="1" />
                        <line x1="calc(100% - 94px - 107px)" y1="0" x2="calc(100% - 94px - 107px)" y2="100%" stroke="#bfdbfe" strokeWidth="1" />

                        {/* Horizontal Guidelines */}
                        <line x1="0" y1="8%" x2="100%" y2="8%" stroke="#bfdbfe" strokeWidth="1" />
                        <line x1="0" y1="92%" x2="100%" y2="92%" stroke="#bfdbfe" strokeWidth="1" />

                        {/* Corner Decorations - Full Size */}
                        <rect x="0" y="0" width="150" height="70" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 150px)" y="0" width="150" height="70" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="0" y="calc(100% - 70px)" width="150" height="70" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 150px)" y="calc(100% - 70px)" width="150" height="70" fill="url(#hatchPattern)" opacity="1" />
                    </g>
                </svg>

                <div className="w-full max-w-[728px] bg-gray-50 py-10 rounded-2xl relative z-10">
                    <MultiStepForm
                        steps={formSteps}
                        onComplete={handleComplete}
                        showTermsStep={true}
                        initialData={initialData}
                    />
                </div>
            </div>
        </div>
    );
}