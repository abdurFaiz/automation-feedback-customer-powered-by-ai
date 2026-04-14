'use client';

import { useState } from 'react';
import { Filter, Star, Target, Flame } from 'lucide-react';
import { AvgRatingChart } from './AvgRatingChart';
import { LoyaltyChurnChart } from './LoyaltyChurnChart';
import { PainPointMatrix } from './PainPointMatrix';
import { LegendItem } from '../ui/LegendItem';
import { CriticalIssueCard } from '../ui/CriticalIssueCard';
import { TrendIndicator } from '../ui/TrendIndicator';
import Image from 'next/image';
import { Button } from '@heroui/button';
import { Card, CardBody, CardFooter, CardHeader } from '../ui/Card';
import { PeriodSelect } from '../ui/PeriodSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/trpc/react';
import { format } from 'date-fns';

interface InDepthInsightsProps {
    className?: string;
}

export function InDepthInsights({ className = '' }: InDepthInsightsProps) {
    const [ratingPeriod, setRatingPeriod] = useState('This Month');
    const [painPointPeriod, setPainPointPeriod] = useState('This Month');
    const [loyaltyPeriod, setLoyaltyPeriod] = useState('This Month');

    const { data: insights } = api.analytics.getInDepthInsights.useQuery({
        ratingPeriod,
        loyaltyPeriod,
        insightPeriod: painPointPeriod
    });
    const { data: categoricalData } = api.analytics.getCategoricalSentiment.useQuery({ period: painPointPeriod });

    return (
        <div className={`bg-gradient-to-b from-blue-200/30 to-white to-90% dark:bg-none dark:bg-[#1F1F1F] rounded-3xl p-1 flex flex-col transition-colors duration-300 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                    <Image src={'/icons/icon-round-insights.svg'} alt='layout' width={24} height={24} className='size-6' />
                    <div className="flex flex-col">
                        <h2 className="text-xl font-semibold text-title-black dark:text-white transition-colors duration-300">In-Depth Insights</h2>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="flex flex-col lg:flex-row gap-4 rounded-3xl overflow-visible transition-colors duration-300">
                        {/* Left Column */}
                        <div className="flex flex-col gap-4 lg:max-w-md w-full">
                            {/* Average Rating */}
                            <Card>
                                <CardBody>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-colors duration-300" />
                                            <span className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">Avg. Rating</span>
                                        </div>
                                        <PeriodSelect
                                            selectedPeriod={ratingPeriod}
                                            onPeriodChange={setRatingPeriod}
                                            variant="heroui"
                                        />
                                    </CardHeader>
                                    <div className="flex flex-col items-center p-3">
                                        <AvgRatingChart rating={insights?.avgRating} />
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">Avg based on {insights?.ratingCount || 0} reviews</span>
                                        </div>
                                    </div>
                                </CardBody>
                                <CardFooter className='flex flex-col gap-1'>
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                        <span>Based on {insights?.ratingCount || 0} Reviews in {ratingPeriod.toLowerCase()}</span>
                                        <TrendIndicator
                                            value={insights?.ratingTrend?.value || "0%"}
                                            isPositive={insights?.ratingTrend?.isPositive ?? true}
                                        />
                                    </div>
                                </CardFooter>
                            </Card>

                            {/* Loyalty VS Churn */}
                            <Card>
                                <CardBody>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-colors duration-300" />
                                            <span className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">Loyalty VS Churn</span>
                                        </div>
                                        <PeriodSelect
                                            selectedPeriod={loyaltyPeriod}
                                            onPeriodChange={setLoyaltyPeriod}
                                            variant="heroui"
                                        />
                                    </CardHeader>
                                    <div className="p-3">
                                        <LoyaltyChurnChart
                                            promoters={insights?.loyalty.promoters}
                                            passives={insights?.loyalty.passives}
                                            detractors={insights?.loyalty.detractors}
                                            nps={insights?.loyalty.nps}
                                            total={insights?.loyalty.total}
                                        />
                                    </div>
                                </CardBody>
                                <CardFooter>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                                        Based on <span className="font-medium">{insights?.loyalty.total}</span> total reviews.
                                        NPS Score: <span className={`font-medium ${(insights?.loyalty.nps || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>{insights?.loyalty.nps}</span>.
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="flex-1 w-full space-y-4">
                            {/* Pain Point Matrix */}
                            <Card>
                                <CardBody>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Flame className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-colors duration-300" />
                                            <span className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">Pain Point Matrix</span>
                                        </div>
                                        <PeriodSelect
                                            selectedPeriod={painPointPeriod}
                                            onPeriodChange={setPainPointPeriod}
                                            variant="heroui"
                                        />
                                    </CardHeader>

                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-4 text-xs pt-3 px-3">
                                        <LegendItem color="bg-blue-500" label="Monitor" />
                                        <LegendItem color="bg-green-500" label="Keep it up" />
                                        <LegendItem color="bg-orange-500" label="Need to check" />
                                        <LegendItem color="bg-red-500" label="High priority" />
                                    </div>

                                    <div className="p-3">
                                        <PainPointMatrix data={categoricalData} />
                                    </div>

                                    {/* Critical Analysis Summary */}
                                    <div className="space-y-3 p-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">Critical Analysis Summary</h3>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                                Last analysis: {insights?.criticalIssues?.length
                                                    ? format(new Date(Math.max(...insights.criticalIssues.map(i => new Date(i.updatedAt).getTime()))), 'MMM d, yyyy')
                                                    : format(new Date(), 'MMM d, yyyy')}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {insights?.criticalIssues && insights.criticalIssues.length > 0 ? (
                                                insights.criticalIssues.map((issue: any) => (
                                                    <CriticalIssueCard
                                                        key={issue.id}
                                                        title={issue.title}
                                                        description={issue.description}
                                                        percentage="High" // Or use confidence/score if available
                                                        timeframe={issue.updatedAt ? format(new Date(issue.updatedAt), 'MMM d, yyyy') : 'Recently'}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-sm text-gray-500 text-center py-4">No critical issues found. Great job!</div>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}