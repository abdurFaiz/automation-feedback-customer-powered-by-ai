'use client';

import { useState } from 'react';
import { ExternalLink, MapPin, Copy, Check } from 'lucide-react';
import { Button, Tooltip } from '@heroui/react';
import { api } from '@/trpc/react';

export default function GoogleMapsLink() {
    const [copied, setCopied] = useState(false);

    const { data: businessData, isLoading } = api.business.getMyBusiness.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const handleCopyUrl = async () => {
        if (!businessData?.googleMapsUrl) return;

        try {
            await navigator.clipboard.writeText(businessData.googleMapsUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy URL:', error);
        }
    };

    const handleOpenMaps = () => {
        if (!businessData?.googleMapsUrl) return;
        window.open(businessData.googleMapsUrl, '_blank', 'noopener,noreferrer');
    };

    const truncateUrl = (url: string) => {
        if (url.length > 50) {
            return url.substring(0, 50) + '...';
        }
        return url;
    };

    if (isLoading) {
        return (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
            </div>
        );
    }

    if (!businessData?.googleMapsUrl) {
        return (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-5 h-5" />
                    <div>
                        <p className="text-sm font-medium">Google Maps URL</p>
                        <p className="text-xs">Not configured</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">Google Maps URL</p>
                        <Tooltip content={businessData.googleMapsUrl}>
                            <p className="text-xs text-primary truncate cursor-help">
                                {truncateUrl(businessData.googleMapsUrl)}
                            </p>
                        </Tooltip>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <Tooltip content={copied ? "Copied!" : "Copy URL"}>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={handleCopyUrl}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-600" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </Tooltip>

                    <Tooltip content="Open in Google Maps">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={handleOpenMaps}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}