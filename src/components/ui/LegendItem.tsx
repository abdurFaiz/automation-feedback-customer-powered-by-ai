'use client';

interface LegendItemProps {
    color: string;
    label: string;
    className?: string;
}

export function LegendItem({ color, label, className = '' }: LegendItemProps) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className={`w-2 h-2 ${color} rounded-full`}></div>
            <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{label}</span>
        </div>
    );
}