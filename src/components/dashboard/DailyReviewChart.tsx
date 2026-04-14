'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface DailyReviewChartProps {
    data?: { date: string; count: number }[];
}

export function DailyReviewChart({ data = [] }: DailyReviewChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        // Initialize chart
        chartInstance.current = echarts.init(chartRef.current);

        // Process Data
        const dates = data.length > 0 ? data.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }) : ['No Data'];

        const counts = data.length > 0 ? data.map(d => d.count) : [0];

        const option = {
            grid: {
                left: 0,
                right: 0,
                top: 10,
                bottom: 20,
                containLabel: false,
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    fontSize: 10,
                    color: '#6B7280',
                    margin: 4,
                    interval: 'auto'
                },
            },
            yAxis: {
                type: 'value',
                show: false,
            },
            series: [
                {
                    data: counts,
                    type: 'bar',
                    barWidth: '70%',
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                {
                                    offset: 0,
                                    color: '#3B82F6', // Blue-500
                                },
                                {
                                    offset: 1,
                                    color: '#60A5FA', // Blue-400
                                },
                            ],
                        },
                        borderRadius: [4, 4, 0, 0],
                    },
                    emphasis: {
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                y2: 1,
                                colorStops: [
                                    {
                                        offset: 0,
                                        color: '#2563EB', // Blue-600
                                    },
                                    {
                                        offset: 1,
                                        color: '#3B82F6', // Blue-500
                                    },
                                ],
                            },
                        },
                    },
                },
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
                    const data = params[0];
                    return `${data.name}: ${data.value} reviews`;
                },
            },
        };

        chartInstance.current.setOption(option);

        // Handle resize
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
            className="w-full h-32"
            style={{ minHeight: '140px' }}
        />
    );
}