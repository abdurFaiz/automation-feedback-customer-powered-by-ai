"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Highlighter } from '@/components/ui/HighlightText';
import { TextAnimate } from "@/components/ui/TextAnimate";

const FeaturesGrid = () => {
    return (
        <section className="py-[120px] bg-white">
            <div className="container mx-auto max-w-[1280px] px-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 justify-center items-center mb-20 mx-auto">
                    <div className="flex flex-col gap-2">
                        <span className='text-sm font-semibold text-primary leading-tight text-center'>
                            <Highlighter action="underline" color="#2063E6">
                                Benefits
                            </Highlighter>
                        </span>
                        <TextAnimate
                            animation="blurIn"
                            as="h2"
                            className="text-[48px] text-center leading-[1.2] font-semibold text-[#111827] capitalize tracking-tight"
                        >
                            Turning every voice into a growth driver.
                        </TextAnimate>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="text-[18px] text-center leading-[1.6] max-w-2xl text-[#6B7280]"
                    >
                        builds a continuous bridge between customer sentiment and your management team, automating the lifecycle of feedback to operational excellence
                    </motion.p>
                </div>

                {/* 2x2 Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card 1: Easily add context */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="relative group bg-[#F3F4F6] rounded-[24px] overflow-hidden flex flex-col min-h-[580px] border border-[#E5E7EB] hover:shadow-xl transition-shadow duration-300"
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                            <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-blue-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                            <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                        </div>
                        <div className="p-10 pb-6 relative z-10">
                            <h3 className="text-2xl font-semibold text-[#111827] mb-1">
                                Watch Your Improvements Pay Off
                            </h3>
                            <p className="text-base leading-[1.6] text-[#6B7280]  max-w-[520px]">
                                Directly correlate every operational fix on our Impact Timeline. Measure your "Velocity" how many days it takes for your management efforts to translate into improved ratings and customer loyalty.
                            </p>
                        </div>
                        <div className="flex justify-center pb-6 relative z-10">
                            <Image src={"/images/quickoverview-card.png"} alt="card 1" width={500} height={500} className='size-full ' />
                        </div>
                    </motion.div>

                    {/* Card 2: Generated lineage */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="relative group bg-[#F3F4F6] rounded-[24px] overflow-hidden flex flex-col justify-between min-h-[580px] border border-[#E5E7EB] hover:shadow-xl transition-shadow duration-300"
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                            <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                            <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                        </div>
                        <div className="p-10 pb-6 relative z-10">
                            <h3 className="text-2xl font-semibold text-[#111827] mb-1">
                                Stop 1-Star Reviews Before They Happen                            </h3>
                            <p className="text-base leading-[1.6] text-[#6B7280] max-w-[520px]">
                                Severity of issues through our AI-Automated Pain Point Matrix. Instantly identify "Crisis Zones" vs. "Maintain Areas" while quantifying churn risk to protect your monthly performance.
                            </p>
                        </div>
                        <div className="flex justify-center pb-6 relative z-10">
                            <Image src={"/images/sentiment-card.png"} alt="card 1" width={500} height={500} className='size-full ' />
                        </div>
                    </motion.div>

                    {/* Card 3: Monitor your data */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="relative group bg-[#F3F4F6] rounded-[24px] overflow-hidden justify-between flex flex-col min-h-[580px] border border-[#E5E7EB] hover:shadow-xl transition-shadow duration-300"
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                            <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                            <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                        </div>
                        <div className="p-10 pb-0 relative z-10">
                            <h3 className="text-2xl font-semibold text-[#111827] mb-1">
                                See Your Biggest Problems First                        </h3>
                            <p className="text-base leading-[1.6] text-[#6B7280] max-w-[520px]">
                                Monitor the health of every category from product to ambiance instantly. Use our "Silent Issue" Forecast to detect rising friction points among neutral customers.
                            </p>
                        </div>
                        <div className="flex justify-center py-6 relative z-10">
                            <Image src={"/images/painpoint-card.png"} alt="card 1" width={500} height={500} className='h-full w-fit ' />
                        </div>
                    </motion.div>

                    {/* Card 4: Automate tasks */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="relative group bg-[#F3F4F6] rounded-[24px] overflow-hidden flex flex-col justify-between min-h-[580px] border border-[#E5E7EB] hover:shadow-xl transition-shadow duration-300"
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                            <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                            <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                        </div>
                        <div className="p-10 pb-0 relative z-10">
                            <h3 className="text-2xl font-semibold text-[#111827] mb-1">
                                A Smart To-Do List, Powered by AI
                            </h3>
                            <p className="text-base leading-[1.6] text-[#6B7280] max-w-[520px]">
                                Our Neural Engine transforms hundreds of review patterns into Context-Aware Strategies. It suggests specific operational fixes so you aren't just reading complaints, you are solving them.
                            </p>
                        </div>
                        <div className="flex justify-center py-6 relative z-10">
                            <Image
                                src={"/images/ai-card.png"}
                                alt="card 1"
                                width={500}
                                height={500}
                                className='size-full '
                                sizes="(max-width: 768px) 100vw, 500px"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;