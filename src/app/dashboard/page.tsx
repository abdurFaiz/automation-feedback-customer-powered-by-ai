import { auth } from '@/server/auth';
import SwitchMode from '@/components/dashboard/SwitchMode';
import { UserDropdown } from '@/components/dashboard/UserDropdown';
import { QuickOverview } from '@/components/dashboard/QuickOverview';
import { InDepthInsights } from '@/components/dashboard/InDepthInsights';
import { ImpactTimeline } from '@/components/dashboard/ImpactTimeline';
import { CategoricalSentiment } from '@/components/dashboard/CategoricalSentiment';
import { ActionableInsight } from '@/components/dashboard/ActionableInsight';
import { ChatbotToggle } from '@/components/dashboard/ChatbotToggle';

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <p style={{ textAlign: 'center' }}>
                        Anda harus login terlebih dahulu.{' '}
                        <a href="/auth/login">Login di sini</a>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-[#F8F9FC] dark:bg-[#0F0F0F] transition-colors duration-300 relative overflow-hidden'>
            {/* Ambient Background Gradients */}
            <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob pointer-events-none dark:hidden"></div>
            <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 pointer-events-none dark:hidden"></div>
            <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 pointer-events-none dark:hidden"></div>

            {/* Option 4: Info-Rich Minimal Header */}
            <header className='relative z-30 rounded-b-3xl px-6 py-5 bg-white/70 dark:bg-[#1F1F1F]/80 backdrop-blur-md dark:border-gray-800/50 supports-[backdrop-filter]:bg-white/50'>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    {/* Left: Title & Description */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className='text-xl font-bold text-gray-900 dark:text-white tracking-tight'>
                                Feedback Insights
                            </h1>
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full">
                                Beta
                            </span>
                        </div>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            Real-time customer sentiment & performance analytics.
                        </p>
                    </div>

                    {/* Right: Meta Info & Actions */}
                    <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
                        {/* Info Pills */}
                        <div className='flex items-center gap-2 flex-wrap'>
                            {/* Date */}
                            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>

                            {/* Data Source */}
                            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                                <svg className="w-3.5 h-3.5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Google Maps</span>
                                <span className="relative flex h-2 w-2 ml-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <SwitchMode />
                            <UserDropdown
                                name={session.user.name || 'User'}
                                email={session.user.email}
                                image={session.user.image}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className='p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative'>
                {/* Charts Section */}
                <div className="flex-1 min-w-0 space-y-4 md:space-y-8">
                    <QuickOverview />
                    <ActionableInsight />
                    <CategoricalSentiment />
                    <ImpactTimeline />
                    <InDepthInsights />
                </div>

                {/* Chatbot Toggle Component */}
                <ChatbotToggle />
            </main>
        </div>
    );
}