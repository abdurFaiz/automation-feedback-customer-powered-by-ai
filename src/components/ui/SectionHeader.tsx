'use client';

import type { ReactNode } from 'react';
import { PeriodSelect } from './PeriodSelect';

interface SectionHeaderProps {
    icon: ReactNode;
    title: string;
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
    className?: string;
}

export function SectionHeader({
    icon,
    title,
    selectedPeriod,
    onPeriodChange,
    className = ''
}: SectionHeaderProps) {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm font-medium text-gray-700">{title}</span>
            </div>
            <PeriodSelect
                selectedPeriod={selectedPeriod}
                onPeriodChange={onPeriodChange}
                variant="native"
                className=""
            />
        </div>
    );
}