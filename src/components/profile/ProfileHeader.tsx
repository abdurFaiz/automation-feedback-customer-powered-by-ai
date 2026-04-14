import { useSession } from 'next-auth/react';
import { Button } from '@heroui/react';
import { UserDropdown } from '../dashboard/UserDropdown';
import SwitchMode from '../dashboard/SwitchMode';

interface ProfileHeaderProps {
    title?: string;
    showSwitchMode?: boolean;
    onMenuClick?: () => void;
}

export default function ProfileHeader({ title = 'Profile', showSwitchMode = true, onMenuClick }: ProfileHeaderProps) {
    const { data: session } = useSession();

    return (
        <header className="bg-white dark:bg-[#1F1F1F] border-b border-gray-200 dark:border-white/10 px-4 md:px-8 py-4 transition-colors duration-300">
            <div className="flex items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="flex-1 flex items-center gap-3 max-w-md">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Open Menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <h1 className='text-xl md:text-2xl font-semibold text-title-black dark:text-white transition-colors duration-300 truncate'>{title}</h1>
                </div>

                {/* Right Actions */}
                <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
                    {/* Info Pills */}
                    <div className='flex items-center gap-2 flex-wrap'>
                        {/* Date */}
                        <div className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-lg transition-colors duration-300'>
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>

                        {/* Data Source */}
                        <div className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-lg transition-colors duration-300'>
                            <svg className="w-3.5 h-3.5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Google Maps</span>
                            <span className="relative flex h-2 w-2 ml-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-white/10 transition-colors duration-300"></div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {showSwitchMode && <SwitchMode />}
                        <UserDropdown
                            name={session?.user?.name || 'User'}
                            email={session?.user?.email || ''}
                            image={session?.user?.image || ''}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
