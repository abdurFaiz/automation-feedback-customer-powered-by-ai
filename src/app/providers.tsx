'use client';

import { SessionProvider } from 'next-auth/react';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from "@heroui/toast";


interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <SessionProvider>
            <HeroUIProvider>
                <ThemeProvider>
                    <ToastProvider />
                    {children}
                </ThemeProvider>
            </HeroUIProvider>
        </SessionProvider>
    );
}
