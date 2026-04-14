'use client';

import { useState } from 'react';
import { Filter, MessageSquare, Flame, ChartBarStacked, MessageSquareDot } from 'lucide-react';
import { SentimentCategoriesChart } from './SentimentCategoriesChart';
import { Button } from '@heroui/button';
import { api } from '@/trpc/react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { PeriodSelect } from '../ui/PeriodSelect';
import Image from 'next/image';

interface CategoricalSentimentProps {
    className?: string;
}

export function CategoricalSentiment({ className = '' }: CategoricalSentimentProps) {
    const [categoriesPeriod, setCategoriesPeriod] = useState('This Month');
    const [reviewsPeriod, setReviewsPeriod] = useState('This Month');

    const { data: categoricalData } = api.analytics.getCategoricalSentiment.useQuery({ period: categoriesPeriod });
    const { data: latestReviews } = api.analytics.getLatestReviews.useQuery({ period: reviewsPeriod });

    return (
        <div className={`bg-gradient-to-b from-blue-200/30 to-white to-90% dark:bg-none dark:bg-[#1F1F1F] rounded-3xl p-1 flex flex-col ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                    <Image src={'/icons/icon-layer.svg'} alt='layout' width={24} height={24} className='size-6' />
                    <div className="flex flex-col">
                        <h2 className="text-xl font-semibold dark:text-white text-title-black">Categorical Sentiment</h2>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-3xl overflow-clip">
                {/* Sentiment Categories Chart */}
                <Card>
                    <CardBody>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ChartBarStacked className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                                <span className="text-base font-medium text-gray-900 dark:text-white">Sentiment Categories</span>
                            </div>
                            <PeriodSelect
                                variant="heroui"
                                selectedPeriod={categoriesPeriod}
                                onPeriodChange={setCategoriesPeriod}
                            />
                        </CardHeader>
                        <div className="flex flex-col gap-3 items-center max-w-full justify-center p-3">
                            {/* Handle both old array and new object format safely */}
                            <SentimentCategoriesChart data={Array.isArray(categoricalData) ? categoricalData : categoricalData?.data || []} />

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Negative</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Positive</span>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Latest Review */}
                <Card>
                    <CardBody>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MessageSquareDot className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                                <span className="text-base font-medium text-gray-900 dark:text-white">Latest Review</span>
                            </div>
                            <PeriodSelect
                                variant="heroui"
                                selectedPeriod={reviewsPeriod}
                                onPeriodChange={setReviewsPeriod}
                            />
                        </CardHeader>
                        <div className="flex flex-col gap-3 items-center justify-center p-3 w-full">
                            {latestReviews?.map((review) => (
                                <div key={review.id} className="border border-gray-200 dark:border-gray-600 rounded-2xl p-4 w-full hover:bg-gray-50 transition-colors dark:hover:bg-gray-700">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900 dark:text-gray-100 mb-3 leading-relaxed line-clamp-2">
                                                {review.text}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {review.tags.length > 0 ? (
                                                    review.tags.map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No tags</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            <Flame className={`w-4 h-4 ${review.sentiment === 'NEGATIVE' ? 'text-red-500' : review.sentiment === 'POSITIVE' ? 'text-green-500' : 'text-gray-400'}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!latestReviews || latestReviews.length === 0) && (
                                <div className="text-center text-gray-500 py-8">
                                    No reviews yet
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* "Silent Issue" Forecast Card */}
                {/* Only show if we have data (and it's not the old array format) */}
                {categoricalData && !Array.isArray(categoricalData) && categoricalData.silentForecast && categoricalData.silentForecast.length > 0 && (
                    <div className="col-span-1 lg:col-span-2">
                        <Card>
                            <CardBody>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                            <Flame className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-medium text-gray-900 dark:text-white">The "Silent Issue" Forecast</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Predicted crisis based on rising neutral sentiment</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categoricalData.silentForecast.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl p-4 flex items-start gap-3">
                                            <div className="mt-1">
                                                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                    Early Warning: {item.category}
                                                </h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    Masalah <strong>{item.category}</strong> mulai banyak dimention oleh user netral (+{Math.round(item.growth)}%). Segera ambil tindakan sebelum menjadi pain point kritis.
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}