'use client';

import type { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

interface CardBodyProps {
    children: ReactNode;
    className?: string;
}

interface CardFooterProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`flex flex-col gap-2 border-3 bg-card-chart dark:bg-[#1F1F1F] border-card-chart dark:border-[#1F1F1F] rounded-3xl overflow-clip transition-colors duration-300 ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
    return (
        <div className={`flex items-center justify-between border-b border-card-chart dark:border-[#1F1F1F] p-2 transition-colors duration-300 ${className}`}>
            {children}
        </div>
    );
}

export function CardBody({ children, className = '' }: CardBodyProps) {
    return (
        <div className={`flex flex-col bg-white dark:bg-[#161616] max-h-full rounded-b-3xl h-full transition-colors duration-300 ${className}`}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
    return (
        <div className={`bg-gray-50 dark:bg-[#262626] rounded-lg p-3 transition-colors duration-300 ${className}`}>
            {children}
        </div>
    );
}