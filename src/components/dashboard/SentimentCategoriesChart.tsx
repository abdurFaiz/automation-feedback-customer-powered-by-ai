'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface SentimentData {
    category: string;
    positive: number;
    negative: number;
    neutral: number;
}

interface SentimentCategoriesChartProps {
    data?: SentimentData[];
}

export function SentimentCategoriesChart({ data }: SentimentCategoriesChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        // If no data, use empty or default? 
        // Let's use validated data or empty arrays
        const safeData = data || [];

        // Transform data for chart (calculate percentages)
        const categories = safeData.map(d => d.category);
        const positiveData = safeData.map(d => {
            const total = d.positive + d.negative + d.neutral;
            return total > 0 ? Number(((d.positive / total) * 100).toFixed(1)) : 0;
        });
        const negativeData = safeData.map(d => {
            const total = d.positive + d.negative + d.neutral;
            return total > 0 ? Number(((d.negative / total) * 100).toFixed(1)) : 0;
        });
        // Start chart init
        chartInstance.current = echarts.init(chartRef.current);

        const option = {
            grid: {
                left: 60,
                right: 40,
                top: 20,
                bottom: 40,
                containLabel: false,
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: 100,
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    fontSize: 10,
                    color: '#9CA3AF',
                },
                splitLine: {
                    lineStyle: {
                        color: '#F3F4F6',
                        width: 1,
                    },
                },
            },
            yAxis: {
                type: 'category',
                data: categories,
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    fontSize: 12,
                    color: '#374151',
                    margin: 8,
                },
            },
            series: [
                {
                    name: 'Positive',
                    type: 'bar',
                    stack: 'sentiment',
                    data: positiveData,
                    itemStyle: {
                        color: '#22C55E',
                        borderRadius: 0,
                    },
                    barWidth: 20,
                },
                {
                    name: 'Negative',
                    type: 'bar',
                    stack: 'sentiment',
                    data: negativeData,
                    itemStyle: {
                        color: '#EF4444',
                        borderRadius: 0,
                    },
                    barWidth: 20,
                },
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'transparent',
                textStyle: {
                    color: '#fff',
                    fontSize: 12,
                },
                formatter: (params: any) => {
                    const categoryName = params[0].name;
                    const positive = params[0].value;
                    const negative = params[1].value;
                    return `${categoryName}<br/>Positive: ${positive}%<br/>Negative: ${negative}%`;
                },
            },
        };

        chartInstance.current.setOption(option);

        const handleResize = () => {
            chartInstance.current?.resize();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chartInstance.current?.dispose();
        };
    }, [data]);

    return (
        <div
            ref={chartRef}
            className="w-full h-64"
            style={{ minHeight: '256px' }}
        />
    );
}