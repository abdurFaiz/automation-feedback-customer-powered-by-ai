'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertTriangle, Calendar, Star, Sparkles, MessageCircle } from 'lucide-react';
import { api } from '@/trpc/react';
import { format } from 'date-fns';

interface UrgentIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;
    period: string;
    count: number;
}

export function UrgentIssueModal({ isOpen, onClose, category, period, count }: UrgentIssueModalProps) {
    const { data, isLoading } = api.analytics.getUrgentIssueDetails.useQuery(
        { category, period },
        { enabled: isOpen }
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            scrollBehavior="inside"
            backdrop="opaque"
            classNames={{
                wrapper: 'flex justify-end items-start h-[100dvh] !w-screen max-w-none m-0',
                base: 'h-[100dvh] max-h-[100dvh] !w-full !max-w-[600px] !m-0 !rounded-none !rounded-l-2xl shadow-2xl border-l border-gray-100 dark:border-white/5 bg-white dark:bg-[#1A1A1A]'
            }}
            motionProps={{
                variants: {
                    enter: {
                        x: 0,
                        opacity: 1,
                        transition: {
                            duration: 0.3,
                            ease: "easeOut",
                        },
                    },
                    exit: {
                        x: "100%",
                        opacity: 0,
                        transition: {
                            duration: 0.2,
                            ease: "easeIn",
                        },
                    },
                }
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] p-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 p-2 bg-red-100 dark:bg-red-500/10 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white pb-1">
                                        {category} Issues
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <span className='font-medium text-red-500'>{count} Negative Reports</span>
                                        <span>•</span>
                                        <span>{period}</span>
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>

                        <ModalBody className="p-6">
                            {/* Suggestion Banner */}
                            {!isLoading && data?.suggestion && (
                                <div className="mb-6">
                                    <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex gap-3">
                                        <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">AI Recommendation</h3>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {data.suggestion}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reviews List */}
                            <div className="flex-1 space-y-4">
                                {isLoading ? (
                                    <div className="flex flex-col gap-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="animate-pulse flex gap-4">
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : data?.reviews && data.reviews.length > 0 ? (
                                    <>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                                            Detailed Feedback ({data.reviews.length})
                                        </h3>
                                        {data?.reviews.map((review) => (
                                            <div
                                                key={review.id}
                                                className="group p-4 rounded-2xl bg-white dark:bg-[#1F1F1F] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${review.type === 'Google Review'
                                                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                                                            : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                                                            }`}>
                                                            {review.type}
                                                        </span>
                                                        <div className="flex items-center text-yellow-500">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <span className="ml-1 text-xs font-medium text-gray-600 dark:text-gray-300">{review.rating}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-gray-400 text-xs">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {format(new Date(review.date), 'MMM d, yyyy')}
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <MessageCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                                        {review.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        No specific comments found for this period.
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter className="border-t border-gray-100 dark:border-white/5 py-4 px-6">
                            <Button color="danger" variant="light" onPress={onClose}>
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
