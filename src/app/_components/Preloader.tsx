"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MorphingText } from "@/components/ui/MorphingText";

const Preloader: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Adjust time based on text length * morphTime + extra
        // 3 texts * ~1.5 - 2s each -> 5-6s
        // Let's set it to 5 seconds to allow the morphing to cycle through
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 8000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    key="preloader"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white"
                >
                    <div className="w-full max-w-full px-4">
                        <MorphingText
                            texts={["Turn Feedback.", "Into Impact.", "With Spinotek.", "Almost there."]}
                            className="text-black"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Preloader;
