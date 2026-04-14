'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface SentimentData {
    category: string;
    positive: number;
    negative: number;
    neutral: number;
    firstNegativeAt?: string | null;
}

interface PainPointMatrixProps {
    data?: {
        data: SentimentData[];
        silentForecast?: any[];
    } | SentimentData[]; // Handle both old array and new object format
}

export function PainPointMatrix({ data = [] }: PainPointMatrixProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    // Normalize data input
    const matrixData = Array.isArray(data) ? data : (data as any).data || [];

    useEffect(() => {
        if (!chartRef.current) return;

        chartInstance.current = echarts.init(chartRef.current);

        // Process Data
        const processedData = matrixData.map((d: SentimentData) => {
            const total = d.positive + d.neutral + d.negative;
            const negRatio = total > 0 ? d.negative / total : 0;

            // Calculate Age (Days since first negative)
            let ageDays = 0;
            if (d.firstNegativeAt) {
                const firstDate = new Date(d.firstNegativeAt);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - firstDate.getTime());
                ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return {
                ...d,
                total,
                negRatio,
                ageDays
            };
        });

        const maxTotal = Math.max(...processedData.map((d: any) => d.total), 1);

        const seriesData = processedData.map((d: any) => {
            // X: Frequency (0-10)
            const x = (d.total / maxTotal) * 10;
            // Y: Negative Impact (0-10)
            const y = Math.min(d.negRatio * 20, 10);

            // Bubble Size: Base 15 + Age Bonus
            // If Age > 30 days, it gets noticeably larger.
            const size = Math.min(15 + (d.ageDays * 0.5), 50);

            // Determine Color
            let color = '#84CC16';
            if (x > 5 && y > 5) color = '#EF4444'; // Red
            else if (x <= 5 && y > 5) color = '#F97316'; // Orange
            else if (x > 5 && y <= 5) color = '#22C55E'; // Green
            else color = '#3B82F6'; // Blue / Monitor

            return [
                Number(x.toFixed(1)),
                Number(y.toFixed(1)),
                d.category,
                color,
                size,
                d.ageDays
            ];
        });


        const option = {
            // ... (keep grid, xAxis, yAxis configs)
            grid: {
                left: 60,
                right: 20,
                top: 20,
                bottom: 60,
                containLabel: true,
            },
            xAxis: {
                // ...
                type: 'value',
                name: 'Frequency →',
                nameLocation: 'middle',
                nameGap: 30,
                nameTextStyle: {
                    fontSize: 12,
                    color: '#374151',
                    fontWeight: 500,
                },
                min: 0,
                max: 10,
                interval: 5,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#D1D5DB',
                        width: 1,
                    },
                },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#E5E7EB',
                        width: 2,
                        type: 'dashed',
                    },
                },
            },
            yAxis: {
                type: 'value',
                name: 'Negative % →',
                nameLocation: 'middle',
                nameGap: 40,
                nameTextStyle: {
                    fontSize: 12,
                    color: '#374151',
                    fontWeight: 500,
                    rotate: 90,
                },
                min: 0,
                max: 10,
                interval: 5,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#D1D5DB',
                        width: 1,
                    },
                },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#E5E7EB',
                        width: 2,
                        type: 'dashed',
                    },
                },
            },
            series: [
                // Background areas using markArea (Keep exact same structure)
                {
                    type: 'scatter',
                    data: [],
                    markArea: {
                        silent: true,
                        itemStyle: {
                            color: 'rgba(59, 130, 246, 0.1)', // Bottom Left - Low/Low
                        },
                        data: [[{ coord: [0, 0] }, { coord: [5, 5] }]]
                    }
                },
                {
                    type: 'scatter',
                    data: [],
                    markArea: {
                        silent: true,
                        itemStyle: {
                            color: 'rgba(34, 197, 94, 0.1)', // Bottom Right - High Freq, Low Neg
                        },
                        data: [[{ coord: [5, 0] }, { coord: [10, 5] }]]
                    }
                },
                {
                    type: 'scatter',
                    data: [],
                    markArea: {
                        silent: true,
                        itemStyle: {
                            color: 'rgba(249, 115, 22, 0.1)', // Top Left - Low Freq, High Neg
                        },
                        data: [[{ coord: [0, 5] }, { coord: [5, 10] }]]
                    }
                },
                {
                    type: 'scatter',
                    data: [],
                    markArea: {
                        silent: true,
                        itemStyle: {
                            color: 'rgba(239, 68, 68, 0.1)', // Top Right - High Freq, High Neg
                        },
                        data: [[{ coord: [5, 5] }, { coord: [10, 10] }]]
                    }
                },
                // Main data points
                {
                    type: 'scatter',
                    symbolSize: 16,
                    data: seriesData,
                    itemStyle: {
                        color: (params: any) => params.data[3],
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    },
                },
            ],
            tooltip: {
                trigger: 'item',
                confine: true,
                enterable: true,
                formatter: (params: any) => {
                    const data = params.data;
                    if (!Array.isArray(data) || data.length < 3) return '';

                    const x = data[0];
                    const y = data[1];
                    const catName = data[2];

                    const category = x > 5 && y > 5 ? 'High priority' :
                        x > 5 && y <= 5 ? 'Keep it up' :
                            x <= 5 && y > 5 ? 'Need to check' :
                                'Monitor';
                    const ageDays = data[5] || 0;
                    return `<strong>${catName}</strong><br/>Category: ${category}<br/>Frequency Score: ${x}/10<br/>Pain Score: ${y}/10<br/>Issue Age: ${ageDays} days`;
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'transparent',
                textStyle: {
                    color: '#ffffff',
                    fontSize: 12,
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
            className="w-full h-[380px] bg-white dark:bg-[#161616] rounded-lg"
            style={{ minHeight: '400px' }}
        />
    );
}