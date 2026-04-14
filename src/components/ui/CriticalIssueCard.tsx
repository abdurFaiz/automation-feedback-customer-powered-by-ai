'use client';

interface CriticalIssueCardProps {
    title: string;
    description: string;
    percentage: string;
    timeframe: string;
    className?: string;
}

export function CriticalIssueCard({
    title,
    description,
    percentage,
    timeframe,
    className = ''
}: CriticalIssueCardProps) {
    return (
        <div className={`flex gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors duration-300 ${className}`}>
            <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0"></div>
            <div className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white transition-colors duration-300">{title}</span>
                <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300"> {description}. Negativity increased by </span>
                <span className="font-medium text-red-600 dark:text-red-400">{percentage}</span>
                <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300"> {timeframe}.</span>
            </div>
        </div>
    );
}