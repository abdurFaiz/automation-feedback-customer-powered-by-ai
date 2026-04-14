'use client';

import { useState } from 'react';
import { Input, Button, Checkbox, Link, Textarea, Select,  SelectItem } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormStep {
    id: number;
    title: string;
    subtitle?: string;
    fields: FormField[];
}

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'tel' | 'textarea' | 'select' | 'timeRange';
    placeholder?: string;
    required?: boolean;
    validation?: (value: string) => string | null;
    options?: Array<{ label: string; value: string }>; // For select fields
    secondaryName?: string; // For paired fields like time ranges
    secondaryLabel?: string;
    secondaryPlaceholder?: string;
    secondaryRequired?: boolean;
    secondaryValidation?: (value: string) => string | null;
}

interface MultiStepFormProps {
    steps: FormStep[];
    onComplete: (data: Record<string, string>) => void;
    showTermsStep?: boolean;
    initialData?: Record<string, string>;
}

export default function MultiStepForm({ steps, onComplete, showTermsStep = false, initialData = {} }: MultiStepFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, string>>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const totalSteps = steps.length;
    const isLastStep = currentStep === totalSteps - 1;
    const currentStepData = steps[currentStep];

    if (!currentStepData) {
        return null;
    }

    const validateField = (
        field: Pick<FormField, 'label' | 'required' | 'validation' | 'type'>,
        value: string,
    ): string | null => {
        if (field.required && !value.trim()) {
            return `${field.label} is required`;
        }

        if (field.validation) {
            return field.validation(value);
        }

        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
        }

        return null;
    };

    const validateCurrentStep = (): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        currentStepData.fields.forEach((field) => {
            if (field.type === 'timeRange' && field.secondaryName) {
                const startValue = formData[field.name] || '';
                const endValue = formData[field.secondaryName] || '';

                const startError = validateField(
                    { label: field.label, required: field.required, validation: field.validation, type: 'text' },
                    startValue,
                );

                const endError = validateField(
                    {
                        label: field.secondaryLabel || 'End time',
                        required: field.secondaryRequired ?? field.required,
                        validation: field.secondaryValidation,
                        type: 'text',
                    },
                    endValue,
                );

                if (startError) {
                    newErrors[field.name] = startError;
                    isValid = false;
                }

                if (endError) {
                    newErrors[field.secondaryName] = endError;
                    isValid = false;
                }

                return;
            }

            const value = formData[field.name] || '';
            const error = validateField(field, value);
            if (error) {
                newErrors[field.name] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            if (isLastStep) {
                if (showTermsStep && !acceptedTerms) {
                    setErrors({ terms: 'Please accept the terms and conditions' });
                    return;
                }
                onComplete(formData);
            } else {
                setCurrentStep((prev) => prev + 1);
                setErrors({});
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
            setErrors({});
        }
    };

    const handleFieldChange = (fieldName: string, value: string) => {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
        if (errors[fieldName]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const getPasswordStrength = (password: string): { level: number; text: string; color: string } => {
        if (!password) return { level: 0, text: '', color: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) return { level: 33, text: 'Weak', color: 'text-dark-red' };
        if (strength <= 3) return { level: 66, text: 'Medium', color: 'text-dark-yellow' };
        return { level: 100, text: 'Strong', color: 'text-light-green' };
    };

    const passwordField = currentStepData.fields.find((f) => f.type === 'password');
    const passwordStrength = passwordField ? getPasswordStrength(formData[passwordField.name] || '') : null;

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Step Indicators */}
            <div className="mb-8">
                <div className="flex items-center justify-center gap-2">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2">
                            {/* Step Circle with Number */}
                            <div className="flex items-center gap-2">
                                <motion.div
                                    className={`
                                        w-6 h-6 rounded-full flex items-center justify-center
                                        transition-all duration-300 text-xs font-semibold
                                        ${index <= currentStep
                                            ? 'bg-primary text-white'
                                            : 'bg-transparent border-2 border-gray-300 text-gray-400'
                                        }
                                    `}
                                    initial={false}
                                    animate={{
                                        scale: index === currentStep ? 1.05 : 1,
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <span>{index + 1}</span>
                                </motion.div>

                                {/* Step Title - First Word Only */}
                                <motion.span
                                    className={`text-sm font-medium whitespace-nowrap transition-colors duration-300 ${index <= currentStep
                                        ? 'text-gray-900'
                                        : 'text-gray-400'
                                        }`}
                                    initial={false}
                                >
                                    {step.title.split(' ')[0]}
                                </motion.span>
                            </div>

                            {/* Arrow Separator */}
                            {index < steps.length - 1 && (
                                <svg
                                    className={`w-4 h-4 transition-colors duration-300 ${index < currentStep ? 'text-gray-900' : 'text-gray-300'
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                >
                    <div className="mb-6 flex flex-col gap-1">
                        <h2 className="text-2xl font-semibold text-title-black">{currentStepData.title}</h2>
                        {currentStepData.subtitle && (
                            <p className="text-sm text-gray-500">{currentStepData.subtitle}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        {currentStepData.fields.map((field) => (
                            <div key={field.name}>
                                {field.type === 'textarea' ? (
                                    <Textarea
                                        isClearable
                                        isRequired={field.required}
                                        labelPlacement="outside"
                                        label={field.label}
                                        placeholder={field.placeholder}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        isInvalid={!!errors[field.name]}
                                        errorMessage={errors[field.name]}
                                        variant="bordered"
                                        size="lg"
                                        minRows={4}
                                        classNames={{
                                            input: 'text-base',
                                            label: 'text-sm text-gray-300',
                                            inputWrapper: errors[field.name]
                                                ? 'border-dark-red'
                                                : 'border-gray-300 focus-within:border-primary',
                                        }}
                                    />
                                ) : field.type === 'select' ? (
                                    <Select
                                        selectionMode="multiple"
                                        labelPlacement="outside"
                                        label={field.label}
                                        placeholder={field.placeholder}
                                        selectedKeys={
                                            formData[field.name]
                                                ? new Set<string>(formData[field.name]!.split(',').filter(Boolean))
                                                : new Set<string>()
                                        }
                                        onSelectionChange={(keys) => {
                                            const values = Array.from(keys).join(',');
                                            handleFieldChange(field.name, values);
                                        }}
                                        isInvalid={!!errors[field.name]}
                                        errorMessage={errors[field.name]}
                                        variant="bordered"
                                        size="lg"
                                        isRequired={field.required}
                                        classNames={{
                                            trigger: errors[field.name]
                                                ? 'border-dark-red'
                                                : 'border-gray-100 hover:border-primary data-[hover=true]:border-primary',
                                            value: 'text-base',
                                            label: 'text-sm text-gray-300',
                                        }}
                                    >
                                        {field.options?.map((option) => (
                                            <SelectItem key={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        )) || []}
                                    </Select>
                                ) : field.type === 'timeRange' && field.secondaryName ? (
                                    (() => {
                                        const secondaryName = field.secondaryName;
                                        return (
                                            <div className="flex flex-col gap-2">
                                                <span className="text-sm font-medium text-gray-700">{field.label}</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <Input
                                                        labelPlacement="outside"
                                                        type="time"
                                                        label={field.placeholder || 'Start'}
                                                        placeholder={field.placeholder}
                                                        value={formData[field.name] || ''}
                                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                        isInvalid={!!errors[field.name]}
                                                        errorMessage={errors[field.name]}
                                                        variant="bordered"
                                                        size="lg"
                                                        isRequired={field.required}
                                                        classNames={{
                                                            input: 'text-base',
                                                            label: 'text-sm text-gray-300',
                                                            inputWrapper: errors[field.name]
                                                                ? 'border-dark-red'
                                                                : 'border-gray-100 hover:border-primary focus-within:border-primary',
                                                        }}
                                                    />
                                                    <Input
                                                        labelPlacement="outside"
                                                        type="time"
                                                        label={field.secondaryLabel || 'Until'}
                                                        placeholder={field.secondaryPlaceholder}
                                                        value={formData[secondaryName] || ''}
                                                        onChange={(e) => handleFieldChange(secondaryName, e.target.value)}
                                                        isInvalid={!!errors[secondaryName]}
                                                        errorMessage={errors[secondaryName]}
                                                        variant="bordered"
                                                        size="lg"
                                                        isRequired={field.secondaryRequired ?? field.required}
                                                        classNames={{
                                                            input: 'text-base',
                                                            label: 'text-sm text-gray-300',
                                                            inputWrapper: errors[secondaryName]
                                                                ? 'border-dark-red'
                                                                : 'border-gray-100 hover:border-primary focus-within:border-primary',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            labelPlacement="outside"
                                            type={field.type}
                                            label={field.label}
                                            placeholder={field.placeholder}
                                            value={formData[field.name] || ''}
                                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                            isInvalid={!!errors[field.name]}
                                            errorMessage={errors[field.name]}
                                            variant="bordered"
                                            size="lg"
                                            classNames={{
                                                input: 'text-base',
                                                label: 'text-sm text-gray-300',
                                                inputWrapper: errors[field.name]
                                                    ? 'border-dark-red'
                                                    : 'border-gray-100 hover:border-primary focus-within:border-primary',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        {passwordStrength && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">Password security level:</span>
                                    <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.text}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full ${passwordStrength.level <= 33
                                            ? 'bg-dark-red'
                                            : passwordStrength.level <= 66
                                                ? 'bg-dark-yellow'
                                                : 'bg-light-green'
                                            }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${passwordStrength.level}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>
                        )}

                        {isLastStep && showTermsStep && (
                            <div className="space-y-4">
                                <Checkbox
                                    isSelected={acceptedTerms}
                                    onValueChange={setAcceptedTerms}
                                    classNames={{
                                        base: 'items-start',
                                        wrapper: 'mt-0.5',
                                    }}
                                >
                                    <span className="text-sm text-gray-700">
                                        I confirm that I have read and accept the Spinotek{' '}
                                        <Link href="#" className="text-primary font-medium" size="sm">
                                            General Conditions
                                        </Link>
                                    </span>
                                </Checkbox>
                                {errors.terms && <p className="text-xs text-dark-red">{errors.terms}</p>}
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-6">
                        {currentStep > 0 && (
                            <Button
                                variant="bordered"
                                size="lg"
                                onPress={handleBack}
                                className="flex-1 border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            color="primary"
                            size="lg"
                            onPress={handleNext}
                            className="flex-1 bg-primary text-white font-medium shadow-lg shadow-primary/30"
                        >
                            {isLastStep ? 'Create an account' : 'Next'}
                            {!isLastStep && (
                                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
