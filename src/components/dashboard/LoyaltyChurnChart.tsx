'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface LoyaltyChurnChartProps {
    promoters?: number;
    passives?: number;
    detractors?: number;
    nps?: number;
    total?: number;
}

export function LoyaltyChurnChart({ promoters = 62, passives = 32, detractors = 12, nps = -17, total = 106 }: LoyaltyChurnChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    const promoterPct = total > 0 ? Math.round((promoters / total) * 100) : 0;
    const passivePct = total > 0 ? Math.round((passives / total) * 100) : 0;
    const detractorPct = total > 0 ? Math.round((detractors / total) * 100) : 0;

    useEffect(() => {
        if (!chartRef.current) return;

        chartInstance.current = echarts.init(chartRef.current);

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)', // Value and Percent
            },
            legend: {
                show: false,
            },
            series: [
                {
                    name: 'Loyalty Score',
                    type: 'pie',
                    radius: ['45%', '70%'],
                    center: ['50%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 0,
                        borderColor: '#fff',
                        borderWidth: 2,
                    },
                    label: { show: false },
                    emphasis: { label: { show: false } },
                    labelLine: { show: false },
                    data: [
                        {
                            value: promoters,
                            name: 'Promoters',
                            itemStyle: { color: '#22C55E' } // Green
                        },
                        {
                            value: passives,
                            name: 'Passives',
                            itemStyle: { color: '#EAB308' } // Yellow
                        },
                        {
                            value: detractors,
                            name: 'Detractors',
                            itemStyle: { color: '#EF4444' } // Red
                        },
                    ],
                },
            ],
            graphic: [
                {
                    type: 'text',
                    left: 'center',
                    top: '42%',
                    style: {
                        text: 'Score',
                        fontSize: 12,
                        fontWeight: 'normal',
                        fill: '#6B7280',
                    },
                },
                {
                    type: 'text',
                    left: 'center',
                    top: '52%',
                    style: {
                        text: `${nps}`,
                        fontSize: 28,
                        fontWeight: 'bold',
                        fill: '#1F2937',
                    },
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
    }, [promoters, passives, detractors, nps]);

    return (
        <div className="flex flex-row gap-3 items-center">

            {/* Legend */}
            <div className="space-y-2">
                <div className="flex gap-2 items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Promoters</span>
                    </div>
                    <span className="font-medium text-gray-900">{promoterPct}%</span>
                </div>
                <div className="flex gap-2 items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-gray-700">Passives</span>
                    </div>
                    <span className="font-medium text-gray-900">{passivePct}%</span>
                </div>
                <div className="flex gap-2 items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-gray-700">Detractors</span>
                    </div>
                    <span className="font-medium text-gray-900">{detractorPct}%</span>
                </div>
            </div> <div
                ref={chartRef}
                className="w-full h-48"
                style={{ minHeight: '172px' }}
            />
        </div>
    );
}