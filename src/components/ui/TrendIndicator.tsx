'use client';

import Image from 'next/image';

interface TrendIndicatorProps {
    value: string;
    isPositive?: boolean;
    className?: string;
}

export function TrendIndicator({ value, isPositive = true, className = '' }: TrendIndicatorProps) {
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    const iconSrc = isPositive ? '/icons/icon-up-tren.svg' : '/icons/icon-down-tren.svg';

    return (
        <div className={`flex items-center gap-1 ${colorClass} ${className}`}>
            <Image
                src={iconSrc}
                alt={isPositive ? 'up trend' : 'down trend'}
                width={12}
                height={12}
                className='size-2'
            />
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}