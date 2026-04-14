'use client';

import { useState } from 'react';
import { ChartSpline, Filter } from 'lucide-react';
import { SentimentTimelineChart } from './SentimentTimelineChart';
import { Button } from '@heroui/button';
import Image from 'next/image';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { PeriodSelect } from '../ui/PeriodSelect';

import { api } from '@/trpc/react';

interface ImpactTimelineProps {
    className?: string;
}

export function ImpactTimeline({ className = '' }: ImpactTimelineProps) {
    const [ratingPeriod, setRatingPeriod] = useState('This Month');
    const { data: timelineData } = api.analytics.getImpactTimeline.useQuery({ period: ratingPeriod });

    // Calculate Summary stats
    const calculateStats = () => {
        if (!timelineData || timelineData.length < 2) return {
            diff: 0,
            prevAvg: 0,
            newAvg: 0,
            trend: "Stable",
            isPositive: true,
            startScore: 0,
            endScore: 0
        };

        const startScore = parseFloat(timelineData[0]?.score || "0");
        const endScore = parseFloat(timelineData[timelineData.length - 1]?.score || "0");
        const diff = endScore - startScore;
        const trend = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);

        // Simple heuristic for Prev/New avg (first half vs second half)
        const mid = Math.floor(timelineData.length / 2);
        const firstHalf = timelineData.slice(0, mid);
        const secondHalf = timelineData.slice(mid);

        const prevAvg = firstHalf.reduce((acc, curr) => acc + parseFloat(curr.score), 0) / (firstHalf.length || 1);
        const newAvg = secondHalf.reduce((acc, curr) => acc + parseFloat(curr.score), 0) / (secondHalf.length || 1);

        return {
            diff,
            prevAvg: prevAvg.toFixed(1),
            newAvg: newAvg.toFixed(1),
            trend,
            isPositive: diff >= 0,
            startScore,
            endScore
        };
    };

    const stats = calculateStats();

    return (
        <div className={`bg-gradient-to-b from-blue-200/30 to-white to-90% dark:bg-none dark:bg-[#1F1F1F] rounded-3xl p-1 flex flex-col ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                    <Image src={'/icons/icon-up-tren.svg'} alt='layout' width={24} height={24} className='size-6' />
                    <div className="flex flex-col">
                        <h2 className="text-xl font-semibold dark:text-white text-title-black">Impact Timeline</h2>
                    </div>
                </div>

            </div>

            <div className="flex flex-col gap-4 rounded-3xl overflow-clip">
                {/* Sentiment Categories Header */}
                <Card>
                    <CardBody>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ChartSpline className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-base font-medium text-gray-900 dark:text-white">Sentiment Categories</span>
                            </div>
                            <PeriodSelect
                                selectedPeriod={ratingPeriod}
                                onPeriodChange={setRatingPeriod}
                                variant="heroui"
                            />
                        </CardHeader>
                        <div className="flex flex-col items-start p-3 w-full">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-base text-gray-900 dark:text-white">Summary Analysis :</span>
                                <div className="flex-1 flex flex-row gap-1">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Rating has {stats.isPositive ? 'increased' : 'decreased'} by <span className="font-medium text-gray-900 dark:text-white">{stats.trend} points</span> in this period.
                                        Overall sentiment is {stats.isPositive ? 'improving' : 'declining'}.
                                    </span>
                                    <div className={`flex items-center gap-1 ${stats.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                        <Image src={stats.isPositive ? '/icons/icon-up-tren.svg' : '/icons/icon-down-tren.svg'} alt='trend' width={16} height={16} className='size-3' />
                                        <span className="text-xs font-medium">{stats.trend}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-3 w-full">
                                {/* Chart */}
                                <SentimentTimelineChart data={timelineData} />
                                {/* Legend */}
                                <div className="flex items-center justify-center gap-6 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Prev. Avg: {stats.prevAvg}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">New Avg: {stats.newAvg}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Correlation Matrix Section */}
                <CorrelationSection period={ratingPeriod} />
            </div>
        </div>
    );
}

function CorrelationSection({ period }: { period: string }) {
    const { data: correlations } = api.analytics.getCorrelationInsights.useQuery({ period });

    return (
        <Card>
            <CardBody>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-medium text-gray-900 dark:text-white">Correlation Matrix (Sebab Akibat)</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Patterns of co-occurring feedback categories</span>
                        </div>
                    </div>
                </CardHeader>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {correlations && correlations.length > 0 ? (
                        correlations.map((item, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.pair}</span>
                                    <span className="text-xs font-mono bg-white dark:bg-black px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                        {item.count}x
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-3">
                                    "{item.example}"
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            No significant correlations found in this period.
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}