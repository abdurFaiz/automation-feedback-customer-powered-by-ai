'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface TimelineData {
    date: string;
    score: string | number;
}

interface SentimentTimelineChartProps {
    data?: TimelineData[];
}

export function SentimentTimelineChart({ data }: SentimentTimelineChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        chartInstance.current = echarts.init(chartRef.current);

        const safeData = data || [];
        const dates = safeData.map(d => d.date);
        // Convert 0-1 score to 0-5 stars for display
        const scores = safeData.map(d => (Number(d.score) * 5).toFixed(1));

        const option = {
            grid: {
                left: 40,
                right: 40,
                top: 20,
                bottom: 60,
                containLabel: false,
            },
            xAxis: {
                type: 'category',
                data: dates.length > 0 ? dates : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    fontSize: 10,
                    color: '#9CA3AF',
                    margin: 12,
                },
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 5,
                interval: 1,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    fontSize: 11,
                    color: '#9CA3AF',
                    formatter: '{value}',
                },
                splitLine: {
                    lineStyle: {
                        color: '#F3F4F6',
                        width: 1,
                    },
                },
            },
            series: [
                {
                    name: 'Sentiment Rating',
                    type: 'line',
                    data: scores.length > 0 ? scores : [3, 3, 3, 3, 3, 3, 3], // fallback
                    lineStyle: {
                        color: '#3B82F6',
                        width: 3,
                    },
                    itemStyle: {
                        color: '#3B82F6',
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                    smooth: true,
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0.0)' }
                        ])
                    }
                }
            ],
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'transparent',
                textStyle: {
                    color: '#fff',
                    fontSize: 12,
                },
                formatter: (params: any) => {
                    const date = params[0].name;
                    const value = params[0].value;
                    return `${date}<br/>Rating: ${value} / 5.0`;
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