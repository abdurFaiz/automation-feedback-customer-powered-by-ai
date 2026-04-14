'use client';

import { useState, useLayoutEffect, useRef } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatbotAssistant } from './ChatbotAssistant';

export function ChatbotToggle() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const placeholderRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const checkIsDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
            // Auto-open on desktop, closed on mobile/tablet
            setIsOpen(window.innerWidth >= 1024);
        };

        checkIsDesktop();
        window.addEventListener('resize', checkIsDesktop);
        return () => window.removeEventListener('resize', checkIsDesktop);
    }, []);

    useLayoutEffect(() => {
        if (!isOpen || !isDesktop) return;

        let animationFrameId: number;

        const syncPosition = () => {
            if (placeholderRef.current && panelRef.current) {
                const rect = placeholderRef.current.getBoundingClientRect();
                const safeTop = Math.max(24, rect.top);
                const newHeight = Math.max(400, window.innerHeight - safeTop - 24);

                // Direct DOM manipulation for performance and stability
                panelRef.current.style.top = `${safeTop}px`;
                panelRef.current.style.left = `${rect.left}px`;
                panelRef.current.style.width = `${rect.width}px`;
                panelRef.current.style.height = `${newHeight}px`;
            }
            animationFrameId = requestAnimationFrame(syncPosition);
        };

        // Start the sync loop
        syncPosition();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isOpen, isDesktop]);

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {isOpen && isDesktop ? (
                    <>
                        {/* Placeholder to reserve space in flow */}
                        <div
                            ref={placeholderRef}
                            className="w-64 lg:w-72 xl:w-80 hidden lg:block shrink-0"
                        />

                        <motion.div
                            ref={panelRef}
                            key="chatbot-panel"
                            initial={{ opacity: 0, x: 100, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.95 }}
                            style={{ position: 'fixed', zIndex: 40 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                duration: 0.3
                            }}
                            className="hidden lg:block"
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="absolute top-4 right-4 z-10"
                            >

                            </motion.div>
                            <ChatbotAssistant className="h-full" onClose={toggleChatbot} />
                        </motion.div>
                    </>
                ) : (
                    /* Floating Button - Always visible when chatbot is closed */
                    <motion.div
                        key="floating-button"
                        initial={{ opacity: 0, scale: 0, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0, y: 100 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                            duration: 0.4
                        }}
                        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50"
                    >
                        <motion.button
                            onClick={toggleChatbot}
                            whileHover={{
                                scale: 1.1,
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            animate={{
                                y: [0, -8, 0],
                            }}
                            transition={{
                                y: {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                },
                                scale: { type: "spring", stiffness: 400, damping: 17 },
                                boxShadow: { duration: 0.2 }
                            }}
                            className="w-12 h-12 md:w-14 md:h-14 bg-orange-500 hover:bg-orange-600 rounded-full shadow-lg flex items-center justify-center"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.5
                                }}
                            >
                                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </motion.div>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile/Tablet Overlay Chatbot */}
            <AnimatePresence>
                {isOpen && !isDesktop && (
                    <motion.div
                        key="mobile-chatbot-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                        onClick={toggleChatbot}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                duration: 0.4
                            }}
                            className="absolute inset-x-4 top-4 bottom-4 md:inset-x-8 md:top-8 md:bottom-8 bg-white rounded-2xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="absolute top-4 right-4 z-10"
                            >
                                <motion.button
                                    onClick={toggleChatbot}
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </motion.button>
                            </motion.div>
                            <ChatbotAssistant className="h-full rounded-2xl" onClose={toggleChatbot} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}