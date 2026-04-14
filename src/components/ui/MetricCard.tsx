'use client';

import type { ReactNode } from 'react';
import { TrendIndicator } from './TrendIndicator';

interface MetricCardProps {
    value: string;
    label: string;
    trend?: {
        value: string;
        isPositive?: boolean;
    };
    className?: string;
}

export function MetricCard({ value, label, trend, className = '' }: MetricCardProps) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <div className="flex items-end gap-2">
                <span className="text-2xl md:text-4xl font-bold text-title-black dark:text-white transition-colors duration-300">{value}</span>
                {trend && (
                    <TrendIndicator
                        value={trend.value}
                        isPositive={trend.isPositive}
                    />
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">{label}</p>
        </div>
    );
}