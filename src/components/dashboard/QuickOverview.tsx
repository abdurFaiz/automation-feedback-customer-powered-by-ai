'use client';

import { useState, useEffect } from 'react';
import { Filter, ChartNoAxesColumn, MessageSquareWarning, Zap } from 'lucide-react';
import { Button } from '@heroui/button';
import Image from 'next/image';
import { api } from '@/trpc/react';
import { DailyReviewChart } from './DailyReviewChart';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { PeriodSelect } from '../ui/PeriodSelect';
import { TrendIndicator } from '../ui/TrendIndicator';
import { MetricCard } from '../ui/MetricCard';
import { UrgentReviewItem } from '../ui/UrgentReviewItem';
import { UrgentIssueModal } from './UrgentIssueModal';
import { format } from 'date-fns';

interface QuickOverviewProps {
    className?: string;
}

interface IssueItem {
    issue: string;
    count: number;
}

export function QuickOverview({ className = '' }: QuickOverviewProps) {
    const [impactPeriod, setImpactPeriod] = useState('This Month');
    const [reviewPeriod, setReviewPeriod] = useState('This Month');
    const [urgentPeriod, setUrgentPeriod] = useState('This Month');
    const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

    const { data: stats } = api.analytics.getStats.useQuery({ period: impactPeriod });
    const { data: reviewStats } = api.analytics.getStats.useQuery({ period: reviewPeriod });
    const { data: dailyVolume } = api.analytics.getDailyVolume.useQuery({ period: reviewPeriod });
    const { data: urgentIssues } = api.analytics.getUrgentIssues.useQuery({ period: urgentPeriod });

    const utils = api.useUtils();
    const backgroundAnalysis = api.analytics.triggerBackgroundAnalysis.useMutation({
        onSuccess: (data) => {
            if (data.processed > 0) {
                // If we processed something, refresh the stats and run again to drain queue
                utils.analytics.getStats.invalidate();
                utils.analytics.getUrgentIssues.invalidate();

                // Optional: Continue processing if there's more work
                // setTimeout(() => backgroundAnalysis.mutate(), 2000); 
            }
        }
    });

    // Auto-trigger analysis when component mounts or when stats are first loaded
    // This creates a "worker" effect that runs while the user views the dashboard


    // I'll add the hook logic here.
    useEffect(() => {
        // Start the background process
        const interval = setInterval(() => {
            if (!backgroundAnalysis.isPending) {
                backgroundAnalysis.mutate();
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`bg-gradient-to-b from-blue-200/30 to-white to-90% dark:bg-none dark:bg-[#1F1F1F] rounded-3xl p-1 flex flex-col transition-colors duration-300 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                    <Image src={'/icons/icon-layout-solid.svg'} alt='layout' width={24} height={24} className='size-6' />
                    <div className="flex flex-col">
                        <h2 className="text-xl font-semibold text-title-black dark:text-white transition-colors duration-300">Quick Overview</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 dark:bg-[#161616] rounded-3xl overflow-clip transition-colors duration-300">
                {/* Impact Velocity */}
                <Card>
                    <CardBody>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                                <span className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">Impact Velocity</span>
                            </div>
                            <PeriodSelect
                                variant='heroui'
                                selectedPeriod={impactPeriod}
                                onPeriodChange={(val) => setImpactPeriod(val)}
                            />
                        </CardHeader>

                        <div className="flex flex-row gap-3 items-center py-6 md:pt-10 px-3">
                            <MetricCard
                                value={stats?.totalReviews.toLocaleString() || "0"}
                                label="Total Reviews"
                                trend={stats?.totalReviewsTrend || { value: "0%", isPositive: true }}
                            />
                            <MetricCard
                                value={stats?.avgRating?.toFixed(1) || "0.0"}
                                label="Avg Rating"
                                trend={stats?.avgRatingTrend || { value: "Stable", isPositive: true }}
                            />
                        </div>
                    </CardBody>
                    <CardFooter>
                        <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300 line-clamp-1">
                            {stats?.topRecommendation ? (
                                <>
                                    {stats.topRecommendation.action} since <span className="font-medium">{stats.topRecommendation.date ? format(new Date(stats.topRecommendation.date), 'd MMM yyyy') : 'Recently'}</span>
                                </>
                            ) : (
                                "No current recommendations"
                            )}
                        </p>
                    </CardFooter>
                </Card>

                {/* Daily Review Volume Chart */}
                <Card>
                    <CardBody>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ChartNoAxesColumn className='size-4 text-gray-900 dark:text-gray-100' />
                                <span className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">Daily Review Vol</span>
                            </div>
                            <PeriodSelect
                                variant='heroui'
                                selectedPeriod={reviewPeriod}
                                onPeriodChange={(val) => setReviewPeriod(val)}
                            />
                        </CardHeader>

                        <div className="flex flex-col gap-1 items-start py-4 px-3">
                            <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 transition-colors duration-300">
                                <span className='text-sm font-medium'>Last 7 Days</span>
                                <TrendIndicator
                                    value={reviewStats?.totalReviewsTrend?.value || "0%"}
                                    isPositive={reviewStats?.totalReviewsTrend?.isPositive ?? true}
                                />
                            </div>

                            <DailyReviewChart data={dailyVolume} />
                        </div>
                    </CardBody>
                    <CardFooter>
                        {(() => {
                            if (!dailyVolume || dailyVolume.length === 0) return null;
                            const total = dailyVolume.reduce((acc, curr) => acc + curr.count, 0);
                            const avg = total / (dailyVolume.length || 1);
                            const max = Math.max(...dailyVolume.map(d => d.count));

                            // Solicitation Indicator (Low Volume)
                            if (total < 5) {
                                return (
                                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md w-full">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                        <span>Solicitation Needed: Review volume is critically low.</span>
                                    </div>
                                );
                            }

                            // Volume Anomaly (Spike)
                            if (max > avg * 3 && max > 5) {
                                return (
                                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md w-full">
                                        <Zap className="w-3 h-3 fill-current" />
                                        <span>Volume Spike Detected: Unusually high activity recently.</span>
                                    </div>
                                );
                            }

                            return <span className="text-xs text-gray-500 dark:text-gray-400">Activity is normal.</span>
                        })()}
                    </CardFooter>
                </Card>

                {/* Urgent Reviews */}
                <Card>
                    <CardBody>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MessageSquareWarning className='size-4 text-gray-900 dark:text-gray-100' />
                                <span className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">Urgent Reviews</span>
                            </div>
                            <PeriodSelect
                                variant='heroui'
                                selectedPeriod={urgentPeriod}
                                onPeriodChange={(val) => setUrgentPeriod(val)}
                            />
                        </CardHeader>

                        <div className="flex flex-col gap-1 w-full items-center p-3 h-[180px] overflow-y-auto no-scrollbar">
                            {urgentIssues && urgentIssues.length > 0 ? (
                                urgentIssues.map((item, idx) => (
                                    <UrgentReviewItem
                                        key={idx}
                                        customerCount={item.count}
                                        issue={item.issue}
                                        onClick={() => setSelectedIssue(item)}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 py-4">No urgent issues found.</p>
                            )}
                        </div>
                    </CardBody>

                    <CardFooter>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">Top Report in month</p>
                    </CardFooter>
                </Card>
            </div>

            {/* Modal */}
            <UrgentIssueModal
                isOpen={!!selectedIssue}
                onClose={() => setSelectedIssue(null)}
                category={selectedIssue?.issue || ''}
                count={selectedIssue?.count || 0}
                period={urgentPeriod}
            />
        </div>
    );
}