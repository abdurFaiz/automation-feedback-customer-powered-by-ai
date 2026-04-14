import { Input, Textarea } from '@heroui/react';
import type { BusinessFormData } from '@/types/business';
import { useState, useEffect } from 'react';

interface DataSyncFormProps {
    businessData?: BusinessFormData | null;
    onDataChange?: (data: Record<string, any>) => void;
}

export default function DataSyncForm({ businessData, onDataChange }: DataSyncFormProps) {
    const [formData, setFormData] = useState({
        googleMapsUrl: businessData?.googleMapsUrl || '',
        criticalThreshold: businessData?.criticalThreshold || '',
        primaryGoal: businessData?.primaryGoal || '',
        targetKpi: businessData?.targetKpi || '',
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
                label="Google Maps URL"
                placeholder="https://maps.app.goo.gl/..."
                value={formData.googleMapsUrl}
                onValueChange={(value) => handleChange('googleMapsUrl', value)}
                labelPlacement="outside"
                description="Your Google Maps business page URL"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300",
                    description: "dark:text-gray-400"
                }}
            />
            <Input
                label="Critical Threshold"
                placeholder="Notify if rating below..."
                value={formData.criticalThreshold}
                onValueChange={(value) => handleChange('criticalThreshold', value)}
                labelPlacement="outside"
                description="Set alerts for important metrics"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300",
                    description: "dark:text-gray-400"
                }}
            />
            <Input
                label="Primary Goal"
                placeholder="Your business goal"
                value={formData.primaryGoal}
                onValueChange={(value) => handleChange('primaryGoal', value)}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                }}
            />
            <Textarea
                label="Target KPI"
                placeholder="e.g., Target rating 4.9 in 90 days"
                value={formData.targetKpi}
                onValueChange={(value) => handleChange('targetKpi', value)}
                labelPlacement="outside"
                description="Specific measurable targets"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300",
                    description: "dark:text-gray-400"
                }}
            />
        </div>
    );
}
