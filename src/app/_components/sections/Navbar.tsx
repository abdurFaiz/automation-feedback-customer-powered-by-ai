"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Navbar() {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 40);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 w-full">
            {/* Main Navigation */}
            <nav
                className={cn(
                    "w-full transition-all duration-300",
                    scrolled ? "h-[72px]" : "h-[80px]"
                )}
            >
                <div className="max-w-[1280px] h-full mx-auto px-6 md:px-10 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/" className="shrink-0">
                            <div className="flex items-center gap-1">
                                <Image src="/icons/icon-brand.png" alt="Logo" width={40} height={40} className="w-8" />
                                <div className="flex flex-row gap-1 item-center justify-end">
                                    <span className="text-3xl font-bold text-title-black">Everloop</span>
                                    <span className="text-xs text-title-black justify-end">by Spinotek</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center bg-white/30 backdrop-blur-md rounded-full p-2 gap-1">
                        {['Home', 'Feature', 'AI Agents', 'Testimonials'].map((item) => (
                            <Link key={item} href={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`} className="relative group px-4 py-2 text-[15px] font-medium text-[#111827] rounded-lg transition-colors">
                                <motion.span
                                    className="relative z-10"
                                    whileHover={{ color: "#2063E6" }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {item}
                                </motion.span>
                                <motion.span
                                    className="absolute inset-0 bg-[#f3f4f6] rounded-lg z-0"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileHover={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                />
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/auth/login"
                            className="hidden sm:block"
                        >
                            <motion.span
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-block px-6 py-3 text-base font-semibold text-[#111827] hover:opacity-70 transition-opacity"
                            >
                                Log in
                            </motion.span>
                        </Link>
                        <Link
                            href="/auth/register"
                        >
                            <motion.span
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/20 text-white px-6 py-3 rounded-full text-base font-semibold transition-all shadow-md hover:shadow-blue-500/25 cursor-pointer"
                            >
                                Become Our User
                            </motion.span>
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}