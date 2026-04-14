interface TabButtonProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

export default function TabButton({ icon, label, active, onClick }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${active
                ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
        >
            <span className={active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}
