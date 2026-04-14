'use client';

import { useState } from 'react';
import {
    MessageCircle,
    Zap,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    ArrowRight,
    CircleDashed
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InsightItem {
    id: number;
    customerInput: string;
    aiSolution: string;
    category: string;
    impact: 'high' | 'medium' | 'low';
}

import { api } from '@/trpc/react';


export function ActionableInsight({ className = '' }: { className?: string }) {
    const { data: fetchedInsights } = api.analytics.getActionableInsights.useQuery();
    const insights = fetchedInsights || [];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const handleNext = () => {
        if (insights.length === 0) return;
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % insights.length);
    };

    const handlePrev = () => {
        if (insights.length === 0) return;
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
    };

    const current = insights[currentIndex];

    if (!current) {
        return (
            <div className={`relative overflow-hidden bg-white dark:bg-[#161616] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm transition-all duration-300 p-8 ${className}`}>
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Intelligence Active</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                            Our AI is continuously analyzing feedback. No immediate critical actions required at this moment.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 20 : -20,
            opacity: 0,
            filter: 'blur(10px)'
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            filter: 'blur(0px)'
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 20 : -20,
            opacity: 0,
            filter: 'blur(10px)'
        })
    };

    return (
        <div className={`relative overflow-hidden bg-white dark:bg-[#161616] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm transition-all duration-300 ${className}`}>
            {/* Subtle Gradient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] -z-10" />

            {/* Header Area */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 dark:border-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Actionable Insights</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">AI-driven optimizations for your business</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/[0.03] rounded-full">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        >
                            <CircleDashed className="w-3.5 h-3.5 text-blue-500" />
                        </motion.div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                            Neural Engine Active
                        </span>
                    </div>

                    <div className="flex gap-1">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePrev}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8 flex flex-col  justify-center">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                            filter: { duration: 0.2 }
                        }}
                        className="grid grid-cols-3 justify-center items-center"
                    >
                        {/* Input Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-gray-500 rounded-md">
                                    Customer Feedback
                                </span>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-linear-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                <div className="relative p-6 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-2xl">
                                    <MessageCircle className="w-5 h-5 text-blue-400 mb-3" />
                                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-medium italic">
                                        "{current.customerInput}"
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-full border border-blue-100 dark:border-blue-500/20">
                                    {current.category}
                                </span>
                            </div>
                        </div>

                        {/* Transition Icon */}
                        <div className="flex flex-row items-center justify-center gap-2 w-full">
                            <div className="h-px w-12 bg-linear-to-r from-transparent via-gray-200 dark:via-white/10 to-gray-200 dark:to-white/10" />
                            <div className="relative">
                                <motion.div
                                    animate={{
                                        boxShadow: ["0 0 0 0px rgba(59, 130, 246, 0.4)", "0 0 0 10px rgba(59, 130, 246, 0)"]
                                    }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/30"
                                >
                                    <Zap className="w-5 h-5 fill-current" />
                                </motion.div>
                            </div>
                            <div className="h-px w-12 bg-linear-to-r from-gray-200 dark:from-white/10 via-gray-200 dark:via-white/10 to-transparent" />
                        </div>

                        {/* Solution Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                                    AI Strategy
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase text-gray-400">Impact:</span>
                                    <span className={`text-[10px] font-bold uppercase ${current.impact === 'high' ? 'text-red-500' :
                                        current.impact === 'medium' ? 'text-orange-500' : 'text-emerald-500'
                                        }`}>
                                        {current.impact}
                                    </span>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                <div className="relative p-7 bg-emerald-50/30 dark:bg-emerald-500/[0.03] border border-emerald-100 dark:border-emerald-500/10 rounded-2xl">
                                    <div className="flex items-start gap-4">
                                        <p className="text-gray-900 dark:text-white text-xl font-bold leading-tight flex-1">
                                            {current.aiSolution}
                                        </p>
                                        <ArrowRight className="w-6 h-6 text-emerald-500 mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                This recommendation is based on sentiment patterns from the last 30 days.
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Pagination Dots */}
                <div className="mt-12 flex justify-center items-center gap-2">
                    {insights.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setDirection(i > currentIndex ? 1 : -1);
                                setCurrentIndex(i);
                            }}
                            className="group relative p-1"
                        >
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex
                                ? 'w-8 bg-blue-500'
                                : 'w-1.5 bg-gray-200 dark:bg-white/10 group-hover:bg-gray-300 dark:group-hover:bg-white/20'
                                }`} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ActionableInsight;
