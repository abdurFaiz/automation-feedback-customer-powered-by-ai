'use client'

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Highlighter } from '@/components/ui/HighlightText';
import { TextAnimate } from "@/components/ui/TextAnimate";

/**
 * Testimonial Card Interface
 */
interface TestimonialCardProps {
    logo: string;
    logoAlt: string;
    quote: string;
    gradientClass: string;
    index: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
    logo,
    logoAlt,
    quote,
    gradientClass,
    index,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
            className={`relative flex flex-col p-8 md:p-10 rounded-[24px] overflow-hidden min-h-[460px] md:min-h-[500px] justify-between text-white ${gradientClass} shadow-xl`}
        >
            <div className="relative z-10">
                <div className="mb-12 h-[32px] w-auto relative">
                    <Image
                        src={logo}
                        alt={logoAlt}
                        width={150}
                        height={40}
                        className="h-full w-auto object-contain brightness-0 invert"
                    />
                </div>
                <p className="text-[20px] md:text-[24px] font-semibold leading-[1.4] tracking-tight">
                    "{quote}"
                </p>
            </div>
        </motion.div>
    );
};

const LOGOS = [
    {
        name: "Partner 1",
        src: "/images/partner-1.svg"
    },
    {
        name: "Partner 2",
        src: "/images/partner-2.svg"
    },
    {
        name: "Partner 3",
        src: "/images/partner-3.svg"
    },
    {
        name: "Partner 4",
        src: "/images/partner-4.svg"
    },
    {
        name: "Partner 5",
        src: "/images/partner-5.svg"
    },
    {
        name: "Partner 6",
        src: "/images/partner-6.svg"
    }
];

const Testimonials: React.FC = () => {
    const testimonials = [
        {
            logo: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/ba1b69f0-d580-42c1-b0e3-2c6a13a14518-secoda-co/assets/svgs/6839d67d1f8f34da47261c7e_licht-white-66.svg",
            logoAlt: "BrewHouse Coffee",
            quote: "Spinofy is the only platform that shows us exactly how our service changes affect our reputation. It turned our customer voice into a growth strategy.",
            gradientClass: "bg-linear-to-br from-[#4b71be] via-[#7d9bd7] to-[#efb38e]",
        },
        {
            logo: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/ba1b69f0-d580-42c1-b0e3-2c6a13a14518-secoda-co/assets/svgs/6839d73c7ec5d64e0ab34671_minto-68.svg",
            logoAlt: "UrbanFit Retail",
            quote: "With Spinofy, we've essentially closed the loop between feedback and action. We stopped guessing and started making data-driven improvements in days.",
            gradientClass: "bg-linear-to-br from-[#45476a] via-[#7eb6bf] to-[#c7e3da]",
        },
        {
            logo: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/ba1b69f0-d580-42c1-b0e3-2c6a13a14518-secoda-co/assets/svgs/68a4e12144ba17209c690654_dialpad-white-69.svg",
            logoAlt: "GrillMaster Resto",
            quote: "The Impact Velocity metric changed how we manage our staff. Now, we act instantly on pain points and see the positive rating shift in real-time.",
            gradientClass: "bg-linear-to-br from-[#6b8cd7] via-[#63A9F7] to-[#DCEBFD]",
        },
    ];

    return (
        <section className="py-[120px] bg-white">
            <div className="container max-w-[1280px] mx-auto px-6">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="flex flex-col gap-2 text-center">
                        <span className='text-sm font-semibold text-primary leading-tight text-center'>
                            <Highlighter action="underline" color="#2063E6">
                                Testimonials
                            </Highlighter>
                        </span>
                        <TextAnimate
                            animation="blurIn"
                            as="h2"
                            className="text-[32px] md:text-[48px] font-semibold text-[#111827] mb-6 leading-[1.2] tracking-[-0.01em]"
                        >
                            What are our customers saying?
                        </TextAnimate>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard key={index} {...testimonial} index={index} />
                    ))}
                </div>

                {/* G2 Badge Section */}
                <div className="mt-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 mb-8">
                            <span className="text-[12px] font-semibold text-[#6b7280] uppercase tracking-wider">
                                Trusted by data teams worldwide
                            </span>
                        </div>

                        {/* Infinite Scroll Container */}
                        <div className="w-full relative overflow-hidden h-20">
                            {/* Gradient Masks */}
                            <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
                            <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />

                            <motion.div
                                className="flex gap-16 items-center absolute left-0 top-0 h-full whitespace-nowrap"
                                animate={{ x: "-50%" }}
                                transition={{
                                    duration: 40,
                                    ease: "linear",
                                    repeat: Infinity
                                }}
                                style={{ width: "max-content" }}
                            >
                                {/* Quadruple the list to ensure seamless looping on large screens */}
                                {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((company, index) => (
                                    <div
                                        key={`${company.name}-${index}`}
                                        className="flex items-center justify-center p-4"
                                    >
                                        <Image
                                            src={company.src}
                                            alt={company.name}
                                            width={150}
                                            height={40}
                                            className="h-8 md:h-20 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity duration-300"
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;