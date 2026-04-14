'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, Tab } from "@heroui/tabs";
import Image from 'next/image';
import Link from 'next/link';
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === '/auth/login';

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Dark Decorative Side */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-4" style={{
                background: 'linear-gradient(135deg, #DCEBFD 0%, #EFF6FF 30%, #FFFFFF 60%, #FFFFFF 100%)'
            }}>
                {/* Logo */}
                <div className="absolute top-8 left-8 z-50">
                    <Link href={"/"} className="flex items-center gap-2">
                        <Image src="/icons/icon-brand.png" alt="Logo" width={64} height={64} className="w-10 " />
                        <div className="flex flex-col item-center justify-end">
                            <span className="text-xl font-bold leading-tight text-title-black dark:text-white">Everloop</span>
                            <span className="text-xs uppercase  text-title-black dark:text-white justify-end">by Spinotek</span>
                        </div>
                    </Link>
                </div>

                <Image src="/images/mock-dashboard.png" alt="Logo" width={1200} height={1200} className='size-full object-cover object-left rounded-3xl' />
            </div>

            {/* Right Panel - Form Side with Grid Layout */}
            <div className="w-full lg:w-1/2 bg-white dark:bg-black flex items-center justify-center p-8 relative overflow-hidden transition-colors duration-200">
                {/* Grid Layout System - Responsive */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <defs>
                        {/* Hatched Pattern Definition */}
                        <pattern id="hatchPattern" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" className="stroke-[#95C8FB] dark:stroke-[#1A1A1A]" fill='#ffff' fillOpacity={0.2} strokeWidth="1" />
                        </pattern>
                    </defs>

                    {/* Mobile Version (< 768px) */}
                    <g className="md:hidden">
                        {/* Left Margin Line */}
                        <line x1="20" y1="0" x2="20" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        {/* Right Margin Line */}
                        <line x1="calc(100% - 20px)" y1="0" x2="calc(100% - 20px)" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />

                        {/* Horizontal Guidelines */}
                        <line x1="0" y1="5%" x2="100%" y2="5%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        <line x1="0" y1="95%" x2="100%" y2="95%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />

                        {/* Corner Decorations - Small */}
                        <rect x="0" y="0" width="80" height="40" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 80px)" y="0" width="80" height="40" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="0" y="calc(100% - 40px)" width="80" height="40" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 80px)" y="calc(100% - 40px)" width="80" height="40" fill="url(#hatchPattern)" opacity="1" />
                    </g>

                    {/* Tablet Version (768px - 1024px) */}
                    <g className="hidden md:block lg:hidden">
                        {/* Left Margin Line */}
                        <line x1="32" y1="0" x2="32" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        {/* Right Margin Line */}
                        <line x1="calc(100% - 32px)" y1="0" x2="calc(100% - 32px)" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />

                        {/* Column Lines */}
                        <line x1="calc(32px + 40px)" y1="0" x2="calc(32px + 40px)" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        <line x1="calc(100% - 32px - 40px)" y1="0" x2="calc(100% - 32px - 40px)" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />

                        {/* Horizontal Guidelines */}
                        <line x1="0" y1="6%" x2="100%" y2="6%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        <line x1="0" y1="94%" x2="100%" y2="94%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />

                        {/* Corner Decorations - Medium */}
                        <rect x="0" y="0" width="120" height="55" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 120px)" y="0" width="120" height="55" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="0" y="calc(100% - 55px)" width="120" height="55" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 120px)" y="calc(100% - 55px)" width="120" height="55" fill="url(#hatchPattern)" opacity="1" />
                    </g>

                    {/* Desktop Version (>= 1024px) */}
                    <g className="hidden lg:block">
                        {/* Left Margin Line */}
                        <line x1="50" y1="0" x2="50" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        {/* Right Margin Line */}
                        <line x1="calc(100% - 64px)" y1="0" x2="calc(100% - 64px)" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />

                        {/* Column Lines with 24px gaps */}
                        <line x1="calc(94px + 60px)" y1="0" x2="calc(94px + 60px)" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        <line x1="calc(94px + 107px)" y1="0" x2="calc(94px + 107px)" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        <line x1="calc(100% - 94px - 60px)" y1="0" x2="calc(100% - 94px - 60px)" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        <line x1="calc(100% - 94px - 107px)" y1="0" x2="calc(100% - 94px - 107px)" y2="100%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />

                        {/* Horizontal Guidelines */}
                        <line x1="0" y1="8%" x2="100%" y2="8%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />
                        <line x1="0" y1="92%" x2="100%" y2="92%" className="stroke-[#C0DDFD] dark:stroke-[#151515]" strokeWidth="1" />

                        {/* Corner Decorations - Full Size */}
                        <rect x="0" y="0" width="150" height="70" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 150px)" y="0" width="150" height="70" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="0" y="calc(100% - 70px)" width="150" height="70" fill="url(#hatchPattern)" opacity="1" />
                        <rect x="calc(100% - 150px)" y="calc(100% - 70px)" width="150" height="70" fill="url(#hatchPattern)" opacity="1" />
                    </g>
                </svg>

                <div className="w-full max-w-md bg-gray-50 dark:bg-[#090909] p-6 rounded-2xl transition-colors duration-200 border border-transparent dark:border-[#1F1F1F]">
                    {/* Tab Navigation */}
                    <Tabs
                        selectedKey={isLoginPage ? 'login' : 'register'}
                        onSelectionChange={(key) => router.push(key === 'login' ? '/auth/login' : '/auth/register')}
                        variant="light"
                        disableAnimation={false}
                        classNames={{
                            base: "w-full mb-8",
                            tabList: "gap-2 w-full bg-white dark:bg-[#151515] p-1.5 rounded-lg shadow-sm transition-colors duration-200 border border-gray-100 dark:border-[#1F1F1F]",
                            cursor: "bg-gray-100 hover:bg-gray-200 dark:bg-[#202020] dark:hover:bg-[#252525] shadow-sm transition-all duration-200",
                            tab: "h-10 text-sm font-medium transition-colors duration-200",
                            tabContent: "group-data-[selected=true]:text-gray-900 group-data-[selected=true]:dark:text-white text-gray-600 dark:text-gray-400"
                        }}
                    >
                        <Tab key="login" title="Login" />
                        <Tab key="register" title="Sign Up" />
                    </Tabs>

                    {/* Form Content with Smooth Transition */}
                    <div className="relative">
                        <div
                            key={pathname}
                            className="transition-all duration-300 ease-out"
                            style={{
                                animation: 'fadeIn 0.3s ease-out forwards'
                            }}
                        >
                            {children}
                        </div>
                    </div>
                </div>
            </div >

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div >
    );
}
