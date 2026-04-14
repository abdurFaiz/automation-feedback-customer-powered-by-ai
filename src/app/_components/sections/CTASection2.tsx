"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TextAnimate } from "@/components/ui/TextAnimate";

const CTABanner = () => {
    // Using the specific asset provided for the gradient background
    const gradientImageUrl = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/ba1b69f0-d580-42c1-b0e3-2c6a13a14518-secoda-co/assets/images/688a031e2448425e432b73a5_gradient-2.webp";

    return (
        <section className="relative py-[60px] md:py-[120px] flex items-center justify-center overflow-hidden bg-white">
            <div className="container max-w-[1440px] w-full mx-auto relative z-10 px-4 md:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-full rounded-[32px] md:rounded-[48px] p-8 md:p-20 overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl min-h-[500px] md:min-h-[480px] bg-linear-to-br from-blue-800 via-blue-600 to-blue-400"
                >
                    {/* Ripple Background Effect - Responsive Positioning */}
                    <div className="absolute top-[60%] left-1/2 -translate-x-1/2 md:top-1/2 md:left-auto md:right-[-10%] md:translate-x-0 md:-translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[800px] pointer-events-none z-0">
                        {/* Concentric Circles with Ambient Ripple */}
                        {[
                            { size: '120%', color: 'bg-white/5', delay: 1 },
                            { size: '100%', color: 'bg-white/5', delay: 0.8 },
                            { size: '80%', color: 'bg-white/10', delay: 0.6 },
                            { size: '60%', color: 'bg-white/10', delay: 0.4 },
                            { size: '40%', color: 'bg-white/15', delay: 0.2 },
                            { size: '20%', color: 'bg-white/20', delay: 0, blur: true },
                        ].map((ring, i) => (
                            <motion.div
                                key={i}
                                className={`absolute inset-0 m-auto rounded-full ${ring.color}`}
                                style={{
                                    width: ring.size,
                                    height: ring.size,
                                    filter: ring.blur ? 'blur(20px)' : undefined
                                }}
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: ring.delay
                                }}
                            />
                        ))}

                        {/* Central Image - Responsive scaling and positioning */}
                        <div
                            className="absolute inset-0 m-auto w-full h-full md:w-[40%] md:h-[40%] flex items-center justify-center z-10"
                        >
                            <Image
                                src={"/images/quickoverview-card.png"}
                                alt="Quick Overview Card"
                                width={800}
                                height={800}
                                className="w-[180%] max-w-none md:w-full h-auto scale-110 md:scale-125 object-contain drop-shadow-2xl opacity-60 md:opacity-100"
                            />
                        </div>
                    </div>

                    {/* Content Left - Foreground */}
                    <div className="relative z-20 w-full md:w-1/2 text-center md:text-left space-y-4 md:space-y-6 mt-0 md:mt-0">
                        <TextAnimate
                            animation="blurIn"
                            as="h2"
                            className="text-white text-[2.5rem] sm:text-[3rem] md:text-[4.5rem] font-semibold leading-[1.1] tracking-[-0.02em] drop-shadow-sm"
                        >
                            Unlock Your Growth.
                        </TextAnimate>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-white/90 text-[1rem] sm:text-[1.125rem] md:text-[1.25rem] font-medium leading-[1.5] max-w-[480px] mx-auto md:mx-0 drop-shadow-sm"
                        >
                            Your customer data should serve you, not the other way around. We're happy to help you.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4 pt-4 md:pt-6 justify-center md:justify-start"
                        >
                            <Link href="/auth/register" className="w-full sm:w-auto">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full sm:w-auto flex items-center justify-between gap-4 px-2 pl-6 py-2 bg-black text-white rounded-full font-semibold text-[1rem] shadow-lg hover:shadow-xl transition-all h-[56px] md:h-[60px]"
                                >
                                    <span>Analyze Your Feedback</span>
                                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-linear-to-b from-[#e5e7eb] to-[#9ca3af] shadow-inner border border-white/20" />
                                </motion.div>
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTABanner;