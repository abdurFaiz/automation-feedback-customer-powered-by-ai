import { Input, Textarea, Select, SelectItem } from '@heroui/react';
import type { BusinessFormData } from '@/types/business';
import { useState, useEffect } from 'react';

interface BrandFormProps {
    businessData?: BusinessFormData | null;
    onDataChange?: (data: Record<string, any>) => void;
}

export default function BrandForm({ businessData, onDataChange }: BrandFormProps) {
    const [formData, setFormData] = useState({
        businessName: businessData?.name || '',
        industry: businessData?.type || '',
        location: businessData?.address || '',
        tagline: businessData?.tagline || '',
    });

    useEffect(() => {
        onDataChange?.(formData);
    }, [formData, onDataChange]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const formatIndustryType = (type: string | null) => {
        if (!type) return '';
        const typeMap: Record<string, string> = {
            'fb': 'fb',
            'coffee_shop': 'coffee_shop',
            'restaurant': 'restaurant',
            'cafe': 'cafe',
            'retail': 'retail',
            'hospitality': 'hospitality',
            'other': 'other'
        };
        return typeMap[type] || type;
    };

    return (
        <div className="space-y-4">
            <Input
                label="Business Name"
                placeholder="Enter business name"
                value={formData.businessName}
                onValueChange={(value) => handleChange('businessName', value)}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                }}
            />
            <Select
                label="Industry"
                placeholder="Select industry"
                selectedKeys={formData.industry ? [formData.industry] : []}
                onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleChange('industry', selectedKey);
                }}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    value: "dark:text-white transition-colors duration-300",
                    trigger: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300",
                    popoverContent: "dark:bg-[#1f1f1f] dark:border-white/10"
                }}
            >
                <SelectItem key="coffee_shop">Coffee Shop</SelectItem>
                <SelectItem key="restaurant">Restaurant</SelectItem>
                <SelectItem key="cafe">Cafe</SelectItem>
                <SelectItem key="fb">Food & Beverage</SelectItem>
                <SelectItem key="retail">Retail</SelectItem>
                <SelectItem key="hospitality">Hospitality</SelectItem>
                <SelectItem key="other">Other</SelectItem>
            </Select>
            <Input
                label="Location (HQ)"
                placeholder="Enter location"
                value={formData.location}
                onValueChange={(value) => handleChange('location', value)}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                }}
            />
            <Textarea
                label="Tagline"
                placeholder="Enter tagline"
                value={formData.tagline}
                onValueChange={(value) => handleChange('tagline', value)}
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
