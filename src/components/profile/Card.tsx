import { Edit2 } from 'lucide-react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-white dark:bg-[#161616] rounded-2xl border border-gray-200 dark:border-white/10 p-6 transition-colors duration-300 ${className}`}>
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    onEdit?: () => void;
}

export function CardHeader({ title, onEdit }: CardHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">{title}</h3>
            {onEdit && (
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors duration-300" onClick={onEdit}>
                    <Edit2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
            )}
        </div>
    );
}

interface SectionTitleProps {
    children: React.ReactNode;
}

export function SectionTitle({ children }: SectionTitleProps) {
    return (
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 transition-colors duration-300">{children}</p>
    );
}
