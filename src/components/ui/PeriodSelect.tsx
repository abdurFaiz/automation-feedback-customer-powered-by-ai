'use client';

import { Select, SelectItem } from "@heroui/select";
import { DateRangePicker } from "@heroui/date-picker";
interface PeriodSelectProps {
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
    className?: string;
    variant?: 'heroui' | 'native';
}

export function PeriodSelect({
    selectedPeriod,
    onPeriodChange,
    className = '',
    variant = 'heroui'
}: PeriodSelectProps) {
    if (variant === 'native') {
        return (
            <select
                value={selectedPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                className={`text-xs text-gray-500 bg-transparent border-none outline-none cursor-pointer ${className}`}
            >
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Quarter</option>
            </select>
        );
    }

    const isCustom = selectedPeriod === 'Custom Range' || selectedPeriod.startsWith('custom|');

    if (isCustom) {
        let defaultValue = undefined;
        if (selectedPeriod.startsWith('custom|')) {
            const parts = selectedPeriod.split('|');
            if (parts.length === 3) {
                try {
                    // Import parseDate dynamically or assume it's available if we use specific format
                    // Utilizing @internationalized/date which is a dependency of heroui
                    const { parseDate } = require("@internationalized/date");
                    defaultValue = {
                        start: parseDate(parts[1]),
                        end: parseDate(parts[2])
                    };
                } catch (e) {
                    console.error("Invalid date format", e);
                }
            }
        }

        return (
            <div className={`flex items-center gap-1 ${className}`}>
                <DateRangePicker
                    aria-label="Custom Period"
                    defaultValue={defaultValue}
                    onChange={(range) => {
                        if (range) {
                            const start = range.start.toString();
                            const end = range.end.toString();
                            onPeriodChange(`custom|${start}|${end}`);
                        }
                    }}
                    className="w-full min-w-[200px]"
                    size="sm"
                    visibleMonths={2}
                />
                <button
                    onClick={() => onPeriodChange('Dashboard Default')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        );
    }

    return (
        <Select
            selectedKeys={[selectedPeriod]}
            onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                if (val) onPeriodChange(val);
            }}
            size="sm"
            variant="flat"
            className={`w-auto min-w-[110px] ${className}`}
            classNames={{
                trigger: "bg-transparent border-none shadow-none min-h-unit-6 h-6",
                value: "text-xs text-gray-500",
                popoverContent: "min-w-40"
            }}
        >
            <SelectItem key="Dashboard Default">Last 3 Months</SelectItem>
            <SelectItem key="This Month">This Month</SelectItem>
            <SelectItem key="Last Month">Last Month</SelectItem>
            <SelectItem key="Last Year">Last Year</SelectItem>
            <SelectItem key="Custom Range">Custom Range...</SelectItem>
        </Select>
    );
}