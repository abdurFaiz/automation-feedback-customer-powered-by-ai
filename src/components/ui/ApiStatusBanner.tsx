'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { api } from '@/trpc/react';

export default function ApiStatusBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const { data: apiStatus, isLoading } = api.gmaps.checkApiStatus.useQuery(undefined, {
        refetchInterval: 60000, // Check every minute
        retry: false,
    });

    // Auto-hide success status after 5 seconds
    useEffect(() => {
        if (apiStatus?.status === 'ok') {
            const timer = setTimeout(() => setIsVisible(false), 5000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(true);
        }
    }, [apiStatus?.status]);

    if (isLoading || !isVisible || !apiStatus) return null;

    const getStatusConfig = () => {
        switch (apiStatus.status) {
            case 'ok':
                return {
                    color: 'bg-green-50 border-green-200',
                    textColor: 'text-green-800',
                    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
                    title: 'SerpApi Status: Active',
                    message: 'Google Maps integration is working normally'
                };
            case 'ok_with_warnings':
                return {
                    color: 'bg-yellow-50 border-yellow-200',
                    textColor: 'text-yellow-800',
                    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
                    title: 'SerpApi Status: Working with Issues',
                    message: apiStatus.message || 'API is functional but may have intermittent issues'
                };
            case 'rate_limited':
                return {
                    color: 'bg-orange-50 border-orange-200',
                    textColor: 'text-orange-800',
                    icon: <Clock className="w-5 h-5 text-orange-600" />,
                    title: 'SerpApi Rate Limited',
                    message: apiStatus.message || 'API quota exceeded. Some features may be temporarily unavailable.'
                };
            case 'rate_limited_anomaly':
                return {
                    color: 'bg-red-50 border-red-200',
                    textColor: 'text-red-800',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
                    title: 'SerpApi Anomaly Detected',
                    message: apiStatus.message || 'API returning errors despite 0 usage - this appears to be an API issue'
                };
            case 'unauthorized':
                return {
                    color: 'bg-red-50 border-red-200',
                    textColor: 'text-red-800',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
                    title: 'SerpApi Authentication Error',
                    message: apiStatus.message || 'API key is invalid or expired'
                };
            case 'network_error':
                return {
                    color: 'bg-yellow-50 border-yellow-200',
                    textColor: 'text-yellow-800',
                    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
                    title: 'Network Connection Issue',
                    message: apiStatus.message || 'Cannot reach SerpApi servers'
                };
            case 'timeout':
                return {
                    color: 'bg-yellow-50 border-yellow-200',
                    textColor: 'text-yellow-800',
                    icon: <Clock className="w-5 h-5 text-yellow-600" />,
                    title: 'Connection Timeout',
                    message: apiStatus.message || 'Connection to SerpApi timed out'
                };
            case 'error':
                return {
                    color: 'bg-red-50 border-red-200',
                    textColor: 'text-red-800',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
                    title: 'SerpApi Error',
                    message: apiStatus.message || 'Google Maps integration is experiencing issues'
                };
            default:
                return null;
        }
    };

    const config = getStatusConfig();
    if (!config) return null;

    return (
        <div className={`${config.color} border rounded-lg p-4 mb-4`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    {config.icon}
                    <div className="flex-1">
                        <h4 className={`font-medium ${config.textColor}`}>{config.title}</h4>
                        <p className={`text-sm ${config.textColor} mt-1`}>{config.message}</p>

                        {(apiStatus.status === 'rate_limited' ||
                            apiStatus.status === 'rate_limited_anomaly' ||
                            apiStatus.status === 'unauthorized' ||
                            apiStatus.status === 'network_error' ||
                            apiStatus.status === 'timeout') && (
                                <div className="mt-2 space-y-2">
                                    <p className="text-xs text-orange-700">
                                        {(apiStatus.status === 'rate_limited' || apiStatus.status === 'rate_limited_anomaly') && (
                                            <>
                                                • Wait a few minutes before trying again<br />
                                                • Check your usage and upgrade if needed<br />
                                                • Verify your API key is valid<br />
                                                • Use "Force Sync" for offline entries<br />
                                                • Cached results will still work normally
                                            </>
                                        )}
                                        {apiStatus.status === 'unauthorized' && (
                                            <>
                                                • Check your SERPAPI_API_KEY environment variable<br />
                                                • Verify the API key is active in your dashboard<br />
                                                • Make sure the key has proper permissions
                                            </>
                                        )}
                                        {(apiStatus.status === 'network_error' || apiStatus.status === 'timeout') && (
                                            <>
                                                • Check your internet connection<br />
                                                • Try again in a few minutes<br />
                                                • Verify DNS resolution is working
                                            </>
                                        )}
                                    </p>
                                    {apiStatus.suggestion && (
                                        <p className="text-xs font-medium text-orange-800">
                                            💡 {apiStatus.suggestion}
                                        </p>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="light"
                                        color="warning"
                                        startContent={<ExternalLink size={14} />}
                                        onPress={() => window.open('https://serpapi.com/dashboard', '_blank')}
                                    >
                                        Check SerpApi Dashboard
                                    </Button>
                                </div>
                            )}

                        {apiStatus.cacheSize !== undefined && (
                            <div className="mt-2">
                                <Chip size="sm" variant="flat">
                                    Cache: {apiStatus.cacheSize} entries
                                </Chip>
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ×
                </Button>
            </div>
        </div>
    );
}