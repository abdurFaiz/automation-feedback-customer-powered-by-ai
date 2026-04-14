'use client';

import { ArrowUpRight } from 'lucide-react';

interface UrgentReviewItemProps {
    customerCount: number;
    issue: string;
    className?: string;
}

export function UrgentReviewItem({ customerCount, issue, className = '', onClick }: UrgentReviewItemProps & { onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-3 w-full hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 cursor-pointer group ${className}`}
        >
            <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">{customerCount} Customer{customerCount !== 1 ? 's' : ''}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1 transition-colors duration-300">report</span>
                <span className="text-sm font-medium text-red-500 dark:text-red-400 ml-1 group-hover:underline">{issue}</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors" />
        </div>
    );
}