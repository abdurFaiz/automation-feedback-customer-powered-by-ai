'use client'

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export default function SwitchMode() {
    const [mounted, setMounted] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-[88px] h-9 bg-gray-50 dark:bg-gray-700 rounded-full animate-pulse" />
        );
    }

    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center w-[88px] h-9 p-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors duration-300"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {/* Sliding Indicator */}
            <span
                className={`absolute h-7 w-10 rounded-full bg-white dark:bg-gray-700 shadow-md transition-all duration-300 ease-out ${isDark ? 'left-[calc(100%-44px)]' : 'left-1'
                    }`}
            />

            {/* Sun Option */}
            <span
                className={`relative z-10 flex items-center justify-center w-10 h-7 transition-colors duration-300 ${!isDark ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'
                    }`}
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm9-9a1 1 0 110 2h-1a1 1 0 110-2h1zM5 11a1 1 0 110 2H4a1 1 0 110-2h1zm14.071-6.071a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM6.05 16.636a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zm12.02 0a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM6.05 5.929a1 1 0 011.414 1.414l-.707.707A1 1 0 115.343 6.636l.707-.707zM12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
            </span>

            {/* Moon Option */}
            <span
                className={`relative z-10 flex items-center justify-center w-10 h-7 transition-colors duration-300 ${isDark ? 'text-indigo-400' : 'text-gray-400 dark:text-gray-500'
                    }`}
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z" />
                </svg>
            </span>
        </button>
    );
}
