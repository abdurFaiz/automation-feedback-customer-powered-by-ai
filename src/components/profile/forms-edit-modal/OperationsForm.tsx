import { Input, Select, SelectItem } from '@heroui/react';
import type { BusinessFormData } from '@/types/business';
import { useState, useEffect } from 'react';

interface OperationsFormProps {
    businessData?: BusinessFormData | null;
    onDataChange?: (data: Record<string, any>) => void;
}

export default function OperationsForm({ businessData, onDataChange }: OperationsFormProps) {
    const formatAmenities = (amenities: string[]) => {
        if (!amenities || amenities.length === 0) return '';
        return amenities.map(amenity =>
            amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        ).join(', ');
    };

    const [formData, setFormData] = useState({
        amenities: formatAmenities(businessData?.amenities || []),
        serviceStyle: businessData?.serviceStyle || '',
        openingHours: businessData?.openingHours || '',
        avgDailyGuests: businessData?.avgDailyGuests || '',
        staffPerShift: businessData?.staffPerShift || '',
    });

    useEffect(() => {
        onDataChange?.(formData);
    }, [formData, onDataChange]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-4">
            <Input
                label="Amenities"
                placeholder="e.g., WiFi, Parking, AC"
                value={formData.amenities}
                onValueChange={(value) => handleChange('amenities', value)}
                labelPlacement="outside"
                description="Separate multiple amenities with commas"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300",
                    description: "dark:text-gray-400"
                }}
            />
            <Input
                label="Service Style"
                placeholder="e.g., Full-service, To-go"
                value={formData.serviceStyle}
                onValueChange={(value) => handleChange('serviceStyle', value)}
                labelPlacement="outside"
                description="Separate multiple amenities with commas"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300",
                    description: "dark:text-gray-400"
                }}
            />
            <Input
                label="Opening Hours"
                placeholder="e.g., 08:00 - 22:00"
                value={formData.openingHours}
                onValueChange={(value) => handleChange('openingHours', value)}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                }}
            />
            <Input
                label="Avg Daily Guests"
                placeholder="e.g., 150-200"
                value={formData.avgDailyGuests}
                onValueChange={(value) => handleChange('avgDailyGuests', value)}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                }}
            />
            <Input
                label="Staff per Shift"
                placeholder="e.g., 5-7"
                value={formData.staffPerShift}
                onValueChange={(value) => handleChange('staffPerShift', value)}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                }}
            />
        </div>
    );
}
