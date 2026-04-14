"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TextAnimate } from "@/components/ui/TextAnimate";
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';

/**
 * MetadataControlPlane Section Component
 * 
 * Featured "The AI platform for data and analytics" section with 
 * a 3D-style stacked graphic on the left and a description on the right.
 */
const CTASection1: React.FC = () => {
    const router = useRouter();
    return (
        <section className="py-[120px] bg-white overflow-hidden">
            <div className="container mx-auto px-6 ">
                <div className="flex flex-col items-center justify-between gap-10">
                    {/* Right Side: Textual Content */}
                    <div className="max-w-full flex flex-col md:flex-row items-center justify-between gap-10 md:gap-32">
                        <TextAnimate
                            animation="blurIn"
                            as="h2"
                            className="text-[32px] md:text-[40px] capitalize lg:text-[48px] max-w-2xl w-full font-semibold text-[#111827] leading-[1.1] tracking-[-0.01em]"
                        >
                            Powered by your feedback intelligence
                        </TextAnimate>
                        <div className="flex flex-col gap-3">
                            <motion.p
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                className="text-[16px] md:text-[18px] text-[#6B7280] leading-[1.6] max-w-md"
                            >
                                Turn customer feedback into results. Generate AI insights, automate SOPs, and track your business growth instantly.
                            </motion.p>
                            <Button onPress={() => router.push('/auth/register')} className='px-6 py-3.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-all duration-300 ease-in-out w-fit text-base font-semibold'>
                                Join Us Now
                            </Button>
                        </div>
                    </div>
                    {/* Left Side: 3D Stacked Graphic Illustration */}
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                        className="w-full flex justify-center"
                    >
                        <div className="relative w-full bg-[#F9FAF7] rounded-[24px] overflow-hidden ">
                            <video
                                className="w-full h-[300px] md:h-[670px] object-cover rounded-[24px]"
                                preload="metadata"
                                poster="/images/video-thumbnail.jpg"
                                autoPlay
                                loop
                                muted
                                playsInline
                            >
                                <source src="/videos/demo-1.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                            <div className="absolute bottom-0 right-0 left-0 z-20 inset-0 min-w-full bg-linear-to-t from-white via-transparent to-transparent pointer-events-none"></div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default CTASection1;