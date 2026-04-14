"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Highlighter } from "@/components/ui/HighlightText";
import { TextAnimate } from "@/components/ui/TextAnimate";

const agents = [
    {
        type: "Overview Agent",
        title: "Tracks key stats and urgent customer alerts in real-time.",
        image: "/images/carausel-card-1.png",
        alt: "Visual of the Quick Overview panel showing real-time star ratings and volume.",
    },
    {
        type: "Neural Engine",
        title: "Suggests optimized growth strategies based on feedback patterns.",
        image: "/images/carausel-card-2.png",
        alt: "The Actionable Insights widget showing AI-generated business recommendations.",
    },
    {
        type: "Forecasting Agent",
        title: "Detects 'Silent Issues' before they damage your brand reputation.",
        image: "/images/carausel-card-4.png",
        alt: "The Early Warning system display predicting potential future crisis points.",
    },
    {
        type: "Diagnostic Agent",
        title: "Prioritizes business gaps to focus your budget where it matters.",
        image: "/images/carausel-card-5.png",
        alt: "The 4-quadrant Pain Point Matrix identifying critical operational issues.",
    },
    {
        type: "Velocity Tracker",
        title: "Measures exactly how your actions drive real rating recovery.",
        image: "/images/carausel-card-6.png",
        alt: "The Impact Timeline chart showing improvement curves post-management action.",
    },
    {
        type: "Loyalty Auditor",
        title: "Audits customer retention and calculates potential revenue risks.",
        image: "/images/carausel-card-7.png",
        alt: "Visual representation of Churn analysis and revenue impact scores.",
    },
    {
        type: "AI Assistant",
        title: "24/7 concierge to draft responses and solve daily business questions.",
        image: "/images/carausel-card-8.png",
        alt: "The sidebar Chat Bot providing automated customer response templates.",
    },
];

export default function AIAgentsCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, []);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = direction === "left" ? -400 : 400;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
            setTimeout(checkScroll, 300);
        }
    };

    return (
        <section className="py-[120px] bg-white overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="flex flex-col gap-2 text-center">
                        <span className='text-sm font-semibold text-primary leading-tight text-center'>
                            <Highlighter action="underline" color="#2063E6">
                                AI Agents
                            </Highlighter>
                        </span>
                        <TextAnimate
                            animation="blurIn"
                            as="h2"
                            className="text-[48px] leading-[1.2] font-semibold text-[#111827] mb-6 max-w-[800px] capitalize mx-auto"
                        >
                            AI agents built so you can focus on operational excellence
                        </TextAnimate>
                    </div>

                </div>

                <div className="relative">
                    <div
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className="flex gap-8 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-12"
                        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
                    >
                        {agents.map((agent, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className="relative group shrink-0 w-[380px] md:w-[420px] snap-start bg-[#F3F4F6] rounded-[24px] overflow-hidden flex flex-col pt-10 px-8 hover:shadow-lg transition-shadow duration-300"
                            >
                                {/* Background Gradient Hover Effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                    <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                                    <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-blue-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                                    <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

                                </div>

                                <div className="relative z-10 min-h-[110px] mb-6">
                                    <p className="text-[#6B7280] text-[14px] mb-2">{agent.type}</p>
                                    <h3 className="text-[20px] md:text-[24px] leading-[1.3] font-semibold text-[#111827]">
                                        {agent.title}
                                    </h3>
                                </div>
                                <div className="relative z-10 w-full aspect-4/3 rounded-t-[12px] bg-white border-t border-x border-[#E5E7EB] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] flex items-center justify-center pt-8 mt-auto">
                                    <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                                        <Image
                                            src={agent.image}
                                            alt={agent.alt}
                                            width={800}
                                            height={200}
                                            className="object-cover scale-110 size-full"
                                        />
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex justify-center gap-4 mt-8">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                            className={`p-3 rounded-full border border-[#E5E7EB] bg-white transition-all ${!canScrollLeft ? "opacity-30 cursor-not-allowed" : "hover:bg-[#F9FAFB]"
                                }`}
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-5 h-5 text-[#111827]" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                            className={`p-3 rounded-full border border-[#E5E7EB] bg-white transition-all ${!canScrollRight ? "opacity-30 cursor-not-allowed" : "hover:bg-[#F9FAFB]"
                                }`}
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-5 h-5 text-[#111827]" />
                        </motion.button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </section>
    );
}