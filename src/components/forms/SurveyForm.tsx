'use client';

import { useState } from 'react';
import { ChevronRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioGroup, Radio, Textarea, CheckboxGroup, Checkbox, Input, Button } from '@heroui/react';
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

interface Question {
    id: string;
    type: string;
    question: string;
    options: string[];
    required: boolean;
    placeholder?: string;
}

export default function SurveyForm({ surveyId }: { surveyId: string }) {
    const { data: survey, isLoading, error } = api.survey.getPublic.useQuery({ id: surveyId });
    const submitMutation = api.survey.submitResponse.useMutation();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, string | string[]>>({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !survey) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black transition-colors duration-300">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Survey Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">This survey may have been deleted or is inactive.</p>
                </div>
            </div>
        );
    }

    const surveyQuestions = survey.questions.map(q => ({
        ...q,
        type: q.type === 'freetext' ? 'textarea' : q.type, // Map backend type to frontend
        placeholder: q.type === 'freetext' ? 'Please type your answer here...' : undefined
    }));

    const currentQuestion = surveyQuestions[currentQuestionIndex];

    const scrollToQuestion = (index: number) => {
        // Implementation simplified as we render one at a time mostly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleResponse = (questionId: string, value: string | string[]) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleNext = async (currentIndex: number) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < surveyQuestions.length) {
            setCurrentQuestionIndex(nextIndex);
            scrollToQuestion(nextIndex);
        } else {
            // Submit
            setIsSubmitting(true);
            try {
                await submitMutation.mutateAsync({
                    surveyId: survey.id,
                    answers: responses
                });
                setIsCompleted(true);
            } catch (err) {
                console.error("Failed to submit", err);
                alert("Failed to submit survey. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            scrollToQuestion(currentQuestionIndex - 1);
        }
    };

    const canProceed = (question: any) => { // Using any loosely for mapped question
        const currentResponse = responses[question.id];
        if (!question.required) return true;

        if (question.type === 'checkbox' || question.type === 'multiple') {
            return Array.isArray(currentResponse) && currentResponse.length > 0;
        }

        return currentResponse && currentResponse.toString().trim() !== '';
    };

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
                <div className="w-full max-w-2xl bg-white dark:bg-[#161616] rounded-[2rem] p-12 text-center transform transition-all hover:scale-[1.01] border border-gray-100 dark:border-white/10">
                    <div className="mb-8">
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 drop-shadow-lg" />
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Thank You!</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-xl font-light">
                            Your responses have been submitted successfully.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-gray-100 dark:from-black dark:to-[#161616] pt-10 transition-colors duration-300">
            {/* Persistent Progress Bar */}
            <div className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/10 py-6 px-6 transition-all duration-300">
                <div className="mx-auto w-full">
                    <div className="flex gap-2 w-full">
                        {surveyQuestions.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${idx <= currentQuestionIndex
                                    ? 'bg-primary shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-800'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-10">
                <AnimatePresence mode="wait" initial={false}>
                    {currentQuestion && (
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="min-h-[60vh] flex flex-col justify-start"
                        >
                            <div className="py-8">
                                <div className="flex items-start gap-3 mb-6">
                                    <div className={`shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-colors px-2 py-1 ${canProceed(currentQuestion) ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'bg-transparent text-gray-400 dark:text-gray-600'
                                        }`}>
                                        {currentQuestionIndex + 1}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2 transition-colors duration-300">
                                            {currentQuestion.question}
                                        </h2>
                                        {currentQuestion.required && (
                                            <span className="text-red-500 text-sm">Required</span>
                                        )}
                                    </div>
                                </div>

                                <div className="pl-15 flex flex-col gap-4">
                                    {(currentQuestion.type === 'radio' || currentQuestion.type === 'single') && currentQuestion.options && (
                                        <RadioGroup
                                            value={responses[currentQuestion.id] as string || ''}
                                            onValueChange={(value) => handleResponse(currentQuestion.id, value)}
                                            classNames={{
                                                wrapper: "flex flex-col gap-7"
                                            }}
                                        >
                                            {currentQuestion.options.map((option, optIndex) => (
                                                <Radio
                                                    key={optIndex}
                                                    value={option}
                                                    classNames={{
                                                        base: cn(
                                                            "group inline-flex items-center justify-between hover:bg-content2 flex-row-reverse",
                                                            "max-w-full cursor-pointer rounded-xl gap-4 p-4 border-2 border-gray-100 dark:border-white/10",
                                                            "data-[selected=true]:border-primary hover:dark:border-primary",
                                                            "dark:hover:bg-white/5 transition-colors duration-300"
                                                        ),
                                                        label: "text-gray-900 dark:text-gray-100"
                                                    }}
                                                >
                                                    {option}
                                                </Radio>
                                            ))}
                                        </RadioGroup>
                                    )}

                                    {(currentQuestion.type === 'checkbox' || currentQuestion.type === 'multiple') && currentQuestion.options && (
                                        <CheckboxGroup
                                            value={(responses[currentQuestion.id] as string[]) || []}
                                            onValueChange={(value) => handleResponse(currentQuestion.id, value)}
                                            classNames={{
                                                wrapper: "flex flex-col gap-7"
                                            }}
                                        >
                                            {currentQuestion.options.map((option, optIndex) => (
                                                <Checkbox
                                                    key={optIndex}
                                                    value={option}
                                                    classNames={{
                                                        base: cn(
                                                            "inline-flex max-w-full w-full bg-content1",
                                                            "hover:bg-content2 items-center justify-start",
                                                            "cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent hover:border-primary",
                                                            "data-[selected=true]:border-primary",
                                                            "dark:hover:bg-white/5 transition-colors duration-300"
                                                        ),
                                                        label: "w-full text-gray-900 dark:text-gray-100"
                                                    }}
                                                >
                                                    {option}
                                                </Checkbox>
                                            ))}
                                        </CheckboxGroup>
                                    )}

                                    {(currentQuestion.type === 'text' || currentQuestion.type === 'textarea') && (
                                        <div className="w-full">
                                            {currentQuestion.type === 'text' ? (
                                                <Input
                                                    type="text"
                                                    value={(responses[currentQuestion.id] as string) || ''}
                                                    onValueChange={(value) => handleResponse(currentQuestion.id, value)}
                                                    placeholder={currentQuestion.placeholder}
                                                    size="lg"
                                                    variant="faded"
                                                    classNames={{
                                                        input: "text-xl dark:text-white",
                                                        inputWrapper: "p-6 dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                                                    }}
                                                />
                                            ) : (
                                                <Textarea
                                                    value={(responses[currentQuestion.id] as string) || ''}
                                                    onValueChange={(value) => handleResponse(currentQuestion.id, value)}
                                                    placeholder={currentQuestion.placeholder}
                                                    minRows={4}
                                                    size="lg"
                                                    variant="faded"
                                                    classNames={{
                                                        input: "text-xl dark:text-white",
                                                        inputWrapper: "p-6 dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500 transition-colors duration-300"
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pl-15 flex items-center justify-between">
                                    {currentQuestionIndex > 0 && (
                                        <Button
                                            variant="bordered"
                                            onClick={handlePrevious}
                                            className={`px-6 py-6 rounded-xl font-bold text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-300 transition-colors`}
                                        >
                                            Back
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => handleNext(currentQuestionIndex)}
                                        disabled={!canProceed(currentQuestion) || isSubmitting}
                                        isLoading={isSubmitting}
                                        className={`flex items-center space-x-1 px-6 py-6 rounded-xl font-bold text-lg transition-all transform hover:-translate-y-1 ${canProceed(currentQuestion)
                                            ? 'bg-gray-900 text-white shadow-xl hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-zinc-800 dark:text-gray-600'
                                            }`}
                                    >
                                        <span>{currentQuestionIndex === surveyQuestions.length - 1 ? 'Submit' : 'Next'}</span>
                                        {!isSubmitting && <ChevronRight className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}