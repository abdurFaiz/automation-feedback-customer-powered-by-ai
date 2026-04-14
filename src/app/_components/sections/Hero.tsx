"use client";

import Link from 'next/link';
import { FlickeringGrid } from "@/components/ui/FlickeringGrid";
import { cn } from "@/lib/utils"
import Image from 'next/image';
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { TextAnimate } from "@/components/ui/TextAnimate";
import { motion } from "framer-motion";
import { Meteors } from "@/components/ui/MeteorEffect";

const HeroSection = () => {
    return (
        <section className="relative min-h-screen overflow-hidden">
            {/* Background Gradient - Bold Light Vibe */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: 'linear-gradient(180deg, #EFF6FF 0%, #DCEBFD 35%, #E0F2FE 75%, #F0F9FF 100%)',
                }}
            />

            {/* Ambient Glows - Bold Light Mode */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/30 blur-[130px] rounded-full pointer-events-none mix-blend-multiply" />
            <div className="absolute bottom-[-100px] right-0 w-[600px] h-[600px] bg-blue-400/25 blur-[120px] rounded-full pointer-events-none mix-blend-multiply" />

            {/* Interactive Grid Pattern Overlay */}
            <div className="absolute inset-0 z-0">
                <FlickeringGrid
                    className={cn(
                        "[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)]",
                        "absolute inset-0 z-0",
                        "h-full w-full"
                    )}
                    squareSize={4}
                    gridGap={6}
                    color="rgb(32, 99, 230)"
                    maxOpacity={0.4}
                    flickerChance={0.05}
                />
            </div>

            {/* Meteor Effect */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <Meteors number={20} />
            </div>

            {/* Cloud-like decorative elements */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-[10%] left-0 scale-200 h-auto "
            >
                <Image src={'/images/cloud1.png'} alt='cloud' width={400} height={300} />
            </motion.div>
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="absolute top-[40%] right-0 scale-150 "
            >
                <Image src={'/images/cloud1.png'} alt='cloud' width={400} height={300} />
            </motion.div>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                className="absolute top-[40%] left-[20%] scale-100 "
            >
                <Image src={'/images/cloud1.png'} alt='cloud' width={400} height={300} />
            </motion.div>

            <div className="container relative z-10 mx-auto pt-32 lg:pt-52">

                {/* Text Content - Centered */}
                <div className="text-center max-w-[800px] px-6 mx-auto">
                    {/* Social Proof Avatars */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex items-center justify-center gap-3 mb-2"
                    >
                        <AvatarGroup
                            className="justify-center"
                            isBordered
                            max={3}
                            total={16000}
                            renderCount={(count) => (
                                <div className="text-xs font-semibold text-white bg-blue-600 px-3 py-1 rounded-full border-2 border-white flex items-center h-full ml-[-12px] z-10 relative shadow-md">
                                    Trusted by {count >= 1000 ? `${(count / 1000).toFixed(0)}k` : count} Business Owners
                                </div>
                            )}
                        >
                            <Avatar size="sm" src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                            <Avatar size="sm" src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                            <Avatar size="sm" src="https://i.pravatar.cc/150?u=a04258a2462d826712d" />
                            <Avatar size="sm" src="https://i.pravatar.cc/150?u=a04258a2462d826712d" />
                            <Avatar size="sm" src="https://i.pravatar.cc/150?u=a04258a2462d826712d" />
                        </AvatarGroup>
                    </motion.div>
                    {/* Main Headline */}
                    <h1 className="text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] font-semibold text-gray-900 mb-6 leading-[1.1] tracking-tight drop-shadow-sm">
                        <TextAnimate animation="blurIn" as="span">Turn Scattered Feedback</TextAnimate>
                        <br className="hidden sm:block" />
                        <span className="text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] font-semibold">
                            <TextAnimate animation="blurIn" as="span">Into Business Impact</TextAnimate>
                        </span>
                    </h1>

                    {/* Sub-headline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                        className="text-lg text-gray-600 max-w-[600px] mx-auto mb-10 leading-relaxed font-medium"
                    >
                        Transform feedback into results. Identify pain points and track real-time business improvements with AI-driven insights.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-20 lg:mb-10"
                    >
                      
                        <Link
                            href="/demo"
                            className="inline-flex items-center justify-center px-8 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-full font-semibold text-base transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md"
                        >
                            Book A Demo
                        </Link>
                    </motion.div>
                </div>

                {/* Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
                    className="relative flex justify-center items-center"
                >
                    {/* Main Dashboard Card */}
                    <div className="relative">
                        <Image
                            src={'/images/dashboard-hero.png'}
                            alt='dashboard hero'
                            width={800}
                            height={700}
                            className='scale-150'
                            priority
                            sizes="(max-width: 768px) 100vw, 800px"
                            quality={90}
                        />

                        {/* Gradient overlay on top of image */}
                    </div>
                </motion.div>
            </div>
            <div className="absolute bottom-0 right-0 left-0 z-20 inset-0 min-w-full bg-linear-to-t from-white via-transparent to-transparent pointer-events-none"></div>
        </section>
    );
};

export default HeroSection;
