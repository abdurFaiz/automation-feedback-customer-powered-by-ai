'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface AvgRatingChartProps {
    rating?: number;
}

export function AvgRatingChart({ rating = 4.5 }: AvgRatingChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        chartInstance.current = echarts.init(chartRef.current);

        const option = {
            series: [
                {
                    type: 'gauge',
                    // ... other configs
                    center: ['50%', '60%'],
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 5,
                    splitNumber: 5,
                    itemStyle: {
                        color: '#FBBF24', // Yellow-400
                    },
                    progress: {
                        show: true,
                        width: 12,
                    },
                    pointer: {
                        show: false,
                    },
                    axisLine: {
                        lineStyle: {
                            width: 12,
                            color: [
                                [0.2, '#EF4444'], // Red
                                [0.4, '#F97316'], // Orange
                                [0.6, '#EAB308'], // Yellow
                                [0.8, '#84CC16'], // Lime
                                [1, '#22C55E'], // Green
                            ],
                        },
                    },
                    axisTick: {
                        distance: -25,
                        splitNumber: 5,
                        lineStyle: {
                            width: 2,
                            color: '#999',
                        },
                    },
                    splitLine: {
                        distance: -30,
                        length: 14,
                        lineStyle: {
                            width: 3,
                            color: '#999',
                        },
                    },
                    axisLabel: {
                        distance: -20,
                        color: '#999',
                        fontSize: 10,
                    },
                    anchor: {
                        show: false,
                    },
                    title: {
                        show: false,
                    },
                    detail: {
                        valueAnimation: true,
                        width: '60%',
                        lineHeight: 40,
                        borderRadius: 8,
                        offsetCenter: [0, '-15%'],
                        fontSize: 32,
                        fontWeight: 'bold',
                        formatter: '{value}/5',
                        color: '#1F2937',
                    },
                    data: [
                        {
                            value: Number(rating.toFixed(1)),
                        },
                    ],
                },
                // Background circle
                {
                    type: 'gauge',
                    center: ['50%', '60%'],
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 5,
                    splitNumber: 5,
                    axisLine: {
                        lineStyle: {
                            width: 12,
                            color: [[1, '#E5E7EB']], // Gray-200
                        },
                    },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    pointer: { show: false },
                    detail: { show: false },
                    data: [{ value: 0 }],
                    z: 1,
                },
            ],
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
    }, [rating]);

    return (
        <div
            ref={chartRef}
            className="w-full h-48"
            style={{ minHeight: '180px' }}
        />
    );
}