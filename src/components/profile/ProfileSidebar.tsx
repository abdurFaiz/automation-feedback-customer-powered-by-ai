import { Home, FileText, User, BriefcaseBusiness, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active
                ? 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
                }`}
        >
            <span className={active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}

interface ProfileSidebarProps {
    currentView?: string;
    onNavigate?: (view: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function ProfileSidebar({ currentView = 'business-profile', onNavigate, isOpen = false, onClose }: ProfileSidebarProps) {
    const router = useRouter();

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleNavigate = (view: string) => {
        if (onNavigate) {
            onNavigate(view);
        }
        if (onClose) {
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop Overlay for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                fixed lg:static inset-y-0 left-0 z-50 
                w-64 bg-white dark:bg-[#1F1F1F] 
                border-r border-gray-200 dark:border-white/10 
                h-screen lg:min-h-screen flex flex-col 
                transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
            >
                {/* Logo */}
                <div className="px-6 py-4 lg:py-2 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <Link href={"/dashboard"} className="flex items-center py-1.5 gap-2">
                        <Image src="/icons/icon-brand.png" alt="Logo" width={64} height={64} className="w-10 " />
                        <div className="flex flex-col item-center justify-end">
                            <span className="text-xl font-bold leading-tight text-title-black dark:text-white">Everloop</span>
                            <span className="text-xs uppercase leading-tight text-title-black dark:text-white justify-end">by Spinotek</span>
                        </div>
                    </Link>
                    {/* Close Button Mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Menu */}
                <nav className="flex-1 flex flex-col justify-between h-full p-4 overflow-y-auto">
                    <div className="space-y-2">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">MENU</span>
                        <div className="space-y-1">
                            <SidebarItem
                                icon={<Home className="w-5 h-5" />}
                                label="Dashboard"
                                active={currentView === 'dashboard'}
                                onClick={() => router.push('/dashboard')}
                            />
                            <SidebarItem
                                icon={<FileText className="w-5 h-5" />}
                                label="Survey Management"
                                active={currentView === 'survey-manage'}
                                onClick={() => handleNavigate('survey-manage')}
                            />
                            <SidebarItem
                                icon={<BriefcaseBusiness className="w-5 h-5" />}
                                label="Business Profile"
                                active={currentView === 'business-profile'}
                                onClick={() => handleNavigate('business-profile')}
                            />
                            <SidebarItem
                                icon={<User className="w-5 h-5" />}
                                label="My Account"
                                active={currentView === 'my-account'}
                                onClick={() => handleNavigate('my-account')}
                            />
                        </div>
                    </div>
                </nav>
            </aside>
        </>
    );
}
