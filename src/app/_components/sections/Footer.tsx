"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="w-full bg-white pt-16 pb-40 px-4 relative overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-blue-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>
            <div className="container mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-[2.5rem] p-8 lg:p-16 shadow-xl shadow-gray-200/50 border border-gray-100"
                >
                    <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20 mb-16">
                        {/* Brand Column */}
                        <div className="flex flex-col gap-6 max-w-sm">
                            <div className="flex items-center gap-1">
                                {/* <Image src="/images/logo-platform.png" alt="Logo" width={64} height={64} className="w-10" /> */}
                                <div className="flex flex-row gap-1 item-center justify-end">
                                    <span className="text-3xl font-bold text-title-black">Everloop</span>
                                    <span className="text-xs text-title-black justify-end">by Spinotek</span>
                                </div>
                            </div>
                            <p className="text-gray-500 text-[15px] leading-relaxed">
                                Feedback Management System to hear your customers, analyze sentiment, and track the real-world impact of your business actions with AI-powered insights.
                            </p>

                            <div className="flex items-center gap-5 mt-2">
                                <a href="#" className="text-gray-400 hover:text-black transition-colors">
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a href="#" className="text-gray-400 hover:text-black transition-colors">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        {/* Navigation Columns */}
                        {/* Navigation Columns */}
                        <div className="grid grid-cols-2 gap-10 lg:gap-20">
                            <div className="flex flex-col gap-4">
                                <h4 className="font-semibold text-gray-900">Product</h4>
                                <ul className="flex flex-col gap-3 text-sm text-gray-500">
                                    <li><a href="/feature" className="hover:text-blue-600 transition-colors">Features</a></li>
                                    <li><a href="/ai-agents" className="hover:text-blue-600 transition-colors">AI Agents</a></li>
                                    <li><a href="/testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a></li>
                                    <li><a href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</a></li>
                                </ul>
                            </div>
                            <div className="flex flex-col gap-4">
                                <h4 className="font-semibold text-gray-900">Company</h4>
                                <ul className="flex flex-col gap-3 text-sm text-gray-500">
                                    <li><a href="/about" className="hover:text-blue-600 transition-colors">About</a></li>
                                    <li><a href="/careers" className="hover:text-blue-600 transition-colors">Careers</a></li>
                                    <li><a href="/contact" className="hover:text-blue-600 transition-colors">Contact</a></li>
                                    <li><a href="/partners" className="hover:text-blue-600 transition-colors">Partners</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full mb-8"></div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                        <p>© 2026 Everloop by Spinotek. All rights reserved.</p>
                        <div className="flex gap-8">
                            <a href="/privacy" className="hover:text-gray-900 transition-colors underline decoration-gray-300 underline-offset-4">Privacy Policy</a>
                            <a href="/terms" className="hover:text-gray-900 transition-colors underline decoration-gray-300 underline-offset-4">Terms of Service</a>
                            <a href="#" className="hover:text-gray-900 transition-colors underline decoration-gray-300 underline-offset-4">Cookies Settings</a>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Large Background Text */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none select-none flex justify-center ">
                <span className="text-[220px] font-bold text-gray-100/35 translate-y-[32%] tracking-tighter">
                    Everloop by Spinotek
                </span>
            </div>
        </footer>
    );
};

export default Footer;