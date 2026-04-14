'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Building2, Paperclip } from 'lucide-react';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import OrganizationDetails from '@/components/profile/OrganizationDetails';
import DocumentDetails from '@/components/profile/DocumentDetails';
import AccountDetails from '@/components/profile/AccountDetails';
import SurveyManage from '@/components/profile/SurveyManage';
import { Tab, Tabs } from '@heroui/tabs';

type Tab = 'organization' | 'Data Warehouse';
type View = 'business-profile' | 'my-account' | 'dashboard' | 'survey-manage';

export default function ProfilePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Initialize state from URL params or defaults
    const [activeTab, setActiveTabState] = useState<Tab>('organization');
    const [currentView, setCurrentViewState] = useState<View>('my-account');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const viewParam = searchParams.get('view') as View;
        const tabParam = searchParams.get('tab') as Tab;

        if (viewParam && ['business-profile', 'my-account', 'dashboard', 'survey-manage'].includes(viewParam)) {
            setCurrentViewState(viewParam);
        }

        if (tabParam && ['organization', 'Data Warehouse'].includes(tabParam)) {
            setActiveTabState(tabParam);
        }
    }, [searchParams]);

    const handleNavigation = (view: string) => {
        const newView = view as View;
        setCurrentViewState(newView);
        setIsSidebarOpen(false); // Close sidebar on navigation

        const params = new URLSearchParams(searchParams);
        params.set('view', newView);

        // Reset sidebar/tab logic
        if (newView === 'business-profile') {
            if (!params.get('tab')) {
                params.set('tab', 'organization');
                setActiveTabState('organization');
            }
        } else {
            params.delete('tab');
        }

        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleTabChange = (key: React.Key) => {
        const newTab = key as Tab;
        setActiveTabState(newTab);

        const params = new URLSearchParams(searchParams);
        params.set('tab', newTab);
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0F0F0F] flex transition-colors duration-300 relative overflow-hidden">
            {/* Ambient Background Gradients */}
            <div className="absolute top-[-50px] z-0 left-[-50px] w-96 h-96 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob pointer-events-none dark:hidden"></div>
            <div className="absolute top-[-50px] z-0 right-[-50px] w-96 h-96 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 pointer-events-none dark:hidden"></div>
            <div className="absolute top-[20%] z-0 left-[20%] w-96 h-96 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 pointer-events-none dark:hidden"></div>
            {/* Sidebar */}
            <ProfileSidebar
                currentView={currentView}
                onNavigate={handleNavigation}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <ProfileHeader
                    title={
                        currentView === 'my-account' ? 'My Account' :
                            currentView === 'business-profile' ? 'Business Profile' :
                                currentView === 'survey-manage' ? 'Survey Management' :
                                    'Dashboard'
                    }
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                {/* Page Content */}
                <main className="flex-1 p-6">
                    {/* Business Profile View */}
                    {currentView === 'business-profile' && (
                        <>

                            <div className="flex items-center gap-6 mb-4 border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
                                <Tabs
                                    variant='underlined'
                                    color="primary"
                                    aria-label="Business Profile Tabs"
                                    selectedKey={activeTab}
                                    onSelectionChange={handleTabChange}
                                    classNames={{
                                        tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider dark:border-white/10",
                                        cursor: "w-full bg-primary",
                                        tab: "max-w-fit px-0 h-12",
                                        tabContent: "group-data-[selected=true]:text-primary w-full text-gray-500 dark:text-gray-400 font-medium"
                                    }}
                                >
                                    <Tab
                                        key="organization"
                                        title={
                                            <div className="flex gap-2 items-center">
                                                <Building2 className="w-4 h-4" />
                                                <span>Organization</span>
                                            </div>
                                        }
                                    />

                                    <Tab
                                        key="Data Warehouse"
                                        title={
                                            <div className="flex gap-2 items-center">
                                                <Paperclip className="w-4 h-4" />
                                                <span>Data Warehouse</span>
                                            </div>
                                        }
                                    />
                                </Tabs>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'organization' && <OrganizationDetails />}
                            {activeTab === 'Data Warehouse' && <DocumentDetails />}
                        </>
                    )}

                    {/* My Account View */}
                    {currentView === 'my-account' && <AccountDetails />}

                    {/* Survey Management View */}
                    {currentView === 'survey-manage' && <SurveyManage />}

                    {/* Placeholder for other views */}
                    {currentView === 'dashboard' && (
                        <div className="text-gray-500 dark:text-gray-400">Dashboard coming soon...</div>
                    )}
                </main>
            </div>
        </div >
    );
}
