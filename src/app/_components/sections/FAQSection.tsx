"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Accordion, AccordionItem } from "@heroui/accordion";
import { PlusIcon } from 'lucide-react';
import { Highlighter } from '@/components/ui/HighlightText';
import { TextAnimate } from "@/components/ui/TextAnimate";

export default function FAQSection() {
    const faqs = [
        {
            question: "How does Everloop by Spinotek turn feedback into growth?",
            answer: "Everloop by Spinotek builds a continuous bridge between customer sentiment and your management team. By automating the lifecycle of feedback, we help you transform raw reviews into operational excellence, ensuring every voice becomes a driver for business improvement."
        },
        {
            question: "How does the 'Pain Point Matrix' work?",
            answer: "Our AI-Automated Pain Point Matrix instantly categorizes issues into 'Crisis Zones' or 'Maintain Areas'. It quantifies churn risk by analyzing review severity, allowing you to stop 1-star reviews before they happen and protect your monthly performance."
        },
        {
            question: "Can I measure the ROI of my operational changes?",
            answer: "Yes. With our Impact Timeline, you can directly correlate operational fixes to improved ratings. We measure your 'Velocity'—the number of days it takes for your management efforts to translate into tangible customer loyalty and better reviews."
        },
        {
            question: "What is the 'Silent Issue' Forecast?",
            answer: "The Silent Issue Forecast is designed to detect rising friction points among neutral customers who haven't complained yet. It allows you to monitor the health of every category—from product to ambiance—and fix problems before they become visible complaints."
        },
        {
            question: "Does Everloop by Spinotek suggest how to fix problems?",
            answer: "Absolutely. Our Neural Engine analyzes hundreds of review patterns to generate 'Context-Aware Strategies'. Instead of just showing you complaints, Everloop by Spinotek provides a smart to-do list of specific operational fixes, so you can solve problems effectively."
        }
    ];

    return (
        <section className="w-full bg-white py-20 lg:py-32 px-4 lg:px-8">
            <div className="container mx-auto max-w-[1280px]">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">

                    {/* Left Column: Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="w-full lg:w-1/2 relative"
                    >
                        <div className="relative aspect-3/4 w-full max-w-[500px] mx-auto lg:mr-auto rounded-[32px] overflow-hidden ">
                            {/* Using a placeholder or existing image. Ideally this should be a relevant portrait photo */}
                            <Image
                                src="/images/faq-image.png"
                                alt="FAQ Support"
                                fill
                                className="object-cover object-left hover:scale-105 transition-transform duration-700"
                            />
                            {/* Overlay for better text contrast if needed, or just style */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none"></div>
                        </div>

                        {/* Decorative blob behind */}
                        <div className="absolute -z-10 top-[-20px] left-[-20px] w-2/3 h-2/3 bg-blue-200/30 rounded-full blur-3xl"></div>
                    </motion.div>

                    {/* Right Column: Content */}
                    <div className="w-full lg:w-1/2 flex flex-col">
                        <div className="flex flex-col gap-2">
                            <span className='text-sm font-semibold text-primary leading-tight'>
                                <Highlighter action="underline" color="#2063E6">
                                    FAQ
                                </Highlighter>
                            </span>
                            <TextAnimate
                                animation="blurIn"
                                as="h2"
                                className="text-4xl lg:text-5xl font-semibold capitalize text-gray-900 mb-10 tracking-tight"
                            >
                                Frequently asked questions
                            </TextAnimate>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-full"
                        >
                            <Accordion
                                variant="splitted"
                                selectionMode="single"
                                className="px-0 "
                                itemClasses={{
                                    base: "py-0 shadow-none border border-gray-100 data-[open=true]:bg-gray-50/20 rounded-2xl w-full mb-2",
                                    title: "font-medium text-lg text-gray-900",
                                    trigger: "py-6 data-[hover=true]:text-blue-600",
                                    indicator: "text-gray-400 data-[open=true]:text-blue-600 rotate-0 data-[open=true]:rotate-180",
                                    content: "text-gray-600 pb-6 leading-relaxed",
                                }}

                            >
                                {faqs.map((faq, index) => (
                                    <AccordionItem
                                        key={index}
                                        aria-label={faq.question}
                                        title={faq.question}
                                        indicator={
                                            <PlusIcon className="w-5 h-5" />
                                        }
                                    >
                                        {faq.answer}
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}