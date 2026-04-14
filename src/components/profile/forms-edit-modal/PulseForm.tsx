import { Input, Select, SelectItem } from '@heroui/react';
import type { BusinessFormData } from '@/types/business';
import { useState, useEffect } from 'react';

interface PulseFormProps {
    businessData?: BusinessFormData | null;
    onDataChange?: (data: Record<string, any>) => void;
}

export default function PulseForm({ businessData, onDataChange }: PulseFormProps) {
    const [formData, setFormData] = useState({
        primaryAudience: businessData?.primaryAudience || '',
        valueProposition: businessData?.valueProposition || '',
        returnCycle: businessData?.returnCycle || '',
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
                label="Primary Audience"
                placeholder="e.g., Remote Workers, Students"
                value={formData.primaryAudience}
                onValueChange={(value) => handleChange('primaryAudience', value)}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                }}
            />
            <Input
                label="Value Proposition"
                placeholder="e.g., Cozy workspace, Quality coffee"
                value={formData.valueProposition}
                onValueChange={(value) => handleChange('valueProposition', value)}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    input: "dark:text-white transition-colors duration-300",
                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                }}
            />
            <Select
                label="Return Cycle"
                placeholder="Select return cycle"
                selectedKeys={formData.returnCycle ? [formData.returnCycle] : []}
                onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleChange('returnCycle', selectedKey);
                }}
                labelPlacement="outside"
                classNames={{
                    label: "text-gray-700 dark:text-gray-300 transition-colors duration-300",
                    value: "dark:text-white transition-colors duration-300",
                    trigger: "dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300",
                    popoverContent: "dark:bg-[#1f1f1f] dark:border-white/10"
                }}
            >
                <SelectItem key="daily">Daily</SelectItem>
                <SelectItem key="weekly">Weekly</SelectItem>
                <SelectItem key="biweekly">Bi-weekly</SelectItem>
                <SelectItem key="monthly">Monthly</SelectItem>
                <SelectItem key="rarely">Rarely</SelectItem>
            </Select>
        </div>
    );
}
