'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Avatar, Spinner, addToast } from '@heroui/react';
import { Mail, Lock, Eye, EyeOff, Upload } from 'lucide-react';
import { api } from '@/trpc/react';

export default function AccountDetails() {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        image: '',
    });

    // Fetch user profile data
    const { data: userProfile, isLoading, error } = api.user.getProfile.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Check if user has password (for OAuth users)
    const { data: passwordCheck } = api.user.checkPassword.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const hasPassword = passwordCheck?.hasPassword ?? true;

    // Mutations
    const utils = api.useUtils();
    const updateProfileMutation = api.user.updateProfile.useMutation({
        onSuccess: () => {
            addToast({
                title: 'Success',
                description: 'Profile updated successfully!',
                color: 'success',
            });
            utils.user.getProfile.invalidate();
            setHasChanges(false);
            // Update original data
            setOriginalData({
                firstName,
                lastName,
                email,
                image: profileImage,
            });
        },
        onError: (error) => {
            addToast({
                title: 'Error',
                description: error.message || 'Failed to update profile',
                color: 'danger',
            });
        },
    });

    const changePasswordMutation = api.user.changePassword.useMutation({
        onSuccess: () => {
            addToast({
                title: 'Success',
                description: 'Password changed successfully!',
                color: 'success',
            });
            setCurrentPassword('');
            setNewPassword('');
        },
        onError: (error) => {
            addToast({
                title: 'Error',
                description: error.message || 'Failed to change password',
                color: 'danger',
            });
        },
    });

    const uploadImageMutation = api.user.uploadProfileImage.useMutation({
        onSuccess: (data) => {
            addToast({
                title: 'Success',
                description: 'Profile image updated!',
                color: 'success',
            });
            setProfileImage(data.image || '');
            utils.user.getProfile.invalidate();
        },
        onError: (error) => {
            addToast({
                title: 'Error',
                description: 'Failed to upload image',
                color: 'danger',
            });
        },
    });

    // Load user data when available
    useEffect(() => {
        if (userProfile) {
            const data = {
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                email: userProfile.email || '',
                image: userProfile.image || '',
            };

            setFirstName(data.firstName);
            setLastName(data.lastName);
            setEmail(data.email);
            setProfileImage(data.image);
            setOriginalData(data);
        }
    }, [userProfile]);

    // Check for changes
    useEffect(() => {
        const currentData = {
            firstName,
            lastName,
            email,
            image: profileImage,
        };

        const hasDataChanged = JSON.stringify(currentData) !== JSON.stringify(originalData);
        setHasChanges(hasDataChanged);
    }, [firstName, lastName, email, profileImage, originalData]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file size (max 15MB)
            if (file.size > 15 * 1024 * 1024) {
                addToast({
                    title: 'Error',
                    description: 'File size must be less than 15MB',
                    color: 'danger',
                });
                return;
            }

            // Validate file type
            if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
                addToast({
                    title: 'Error',
                    description: 'Only PNG and JPEG images are allowed',
                    color: 'danger',
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result as string;
                setProfileImage(base64Data);

                // Upload image immediately
                uploadImageMutation.mutate({
                    imageData: base64Data,
                    fileName: file.name,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            addToast({
                title: 'Validation Error',
                description: 'Please fill in all required fields',
                color: 'warning',
            });
            return;
        }

        updateProfileMutation.mutate({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            image: profileImage,
        });
    };

    const handleChangePassword = () => {
        // Check if user has password before attempting to change
        if (!hasPassword) {
            addToast({
                title: 'Not Available',
                description: 'Password changes are not available for social login accounts',
                color: 'warning',
            });
            return;
        }

        if (!currentPassword || !newPassword) {
            addToast({
                title: 'Validation Error',
                description: 'Please fill in both password fields',
                color: 'warning',
            });
            return;
        }

        if (newPassword.length < 8) {
            addToast({
                title: 'Validation Error',
                description: 'New password must be at least 8 characters long',
                color: 'warning',
            });
            return;
        }

        changePasswordMutation.mutate({
            currentPassword,
            newPassword,
        });
    };

    const handleCancel = () => {
        if (userProfile) {
            setFirstName(userProfile.firstName || '');
            setLastName(userProfile.lastName || '');
            setEmail(userProfile.email || '');
            setProfileImage(userProfile.image || '');
        }
        setCurrentPassword('');
        setNewPassword('');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner size="lg" color="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 mb-4">Error loading profile data</p>
                <Button
                    onClick={() => window.location.reload()}
                    color="primary"
                >
                    Retry
                </Button>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">No profile data found</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Account Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">Manage your profile and account preferences</p>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-[#161616] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
                {/* Profile Section */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Avatar
                                src={profileImage || '/images/avatar-placeholder.jpg'}
                                alt="Profile"
                                className="w-20 h-20"
                            />
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploadImageMutation.isPending}
                                />
                                <Upload className="w-5 h-5 text-white" />
                            </label>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">Profile Picture</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors duration-300">PNG or JPEG, max 15MB</p>
                        </div>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploadImageMutation.isPending}
                            />
                            <Button
                                as="span"
                                variant="bordered"
                                size="sm"
                                isLoading={uploadImageMutation.isPending}
                                isDisabled={uploadImageMutation.isPending}
                            >
                                {uploadImageMutation.isPending ? 'Uploading...' : 'Change'}
                            </Button>
                        </label>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 transition-colors duration-300">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Personal Information</h3>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                variant="bordered"
                                labelPlacement="outside"
                                placeholder="Enter first name"
                                classNames={{
                                    label: "text-xs font-medium text-gray-700 dark:text-gray-300",
                                    input: "text-sm dark:text-white",
                                    inputWrapper: "h-10 dark:bg-zinc-800 dark:border-zinc-700"
                                }}
                                isRequired
                            />
                            <Input
                                label="Last name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                variant="bordered"
                                labelPlacement="outside"
                                placeholder="Enter last name"
                                classNames={{
                                    label: "text-xs font-medium text-gray-700",
                                    input: "text-sm",
                                    inputWrapper: "h-10"
                                }}
                                isRequired
                            />
                        </div>
                        <Input
                            label="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            variant="bordered"
                            labelPlacement="outside"
                            placeholder="Enter email"
                            startContent={<Mail className="w-4 h-4 text-gray-400" />}
                            classNames={{
                                label: "text-xs font-medium text-gray-700",
                                input: "text-sm",
                                inputWrapper: "h-10"
                            }}
                            isRequired
                        />
                    </div>
                </div>

                {/* Security */}
                <div className="p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Security</h3>

                    {!hasPassword ? (
                        /* OAuth User - No Password Set */
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-300">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 transition-colors duration-300">
                                    <svg fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 transition-colors duration-300">Social Login Account</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 transition-colors duration-300">
                                        Your account was created using social login (Google, etc.).
                                        Password changes are not available for social login accounts.
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 transition-colors duration-300">
                                        To set up a password, please contact support.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Regular User - Password Change Available */
                        <div className="flex flex-col gap-4">
                            <Input
                                label="Current password"
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                variant="bordered"
                                labelPlacement="outside"
                                startContent={<Lock className="w-4 h-4 text-gray-400" />}
                                endContent={
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="focus:outline-none"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                }
                                classNames={{
                                    label: "text-xs font-medium text-gray-700",
                                    input: "text-sm",
                                    inputWrapper: "h-10"
                                }}
                            />
                            <div className="flex flex-col gap-2">
                                <Input
                                    label="New password"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    variant="bordered"
                                    labelPlacement="outside"
                                    startContent={<Lock className="w-4 h-4 text-gray-400" />}
                                    endContent={
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="focus:outline-none"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <Eye className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                    }
                                    classNames={{
                                        label: "text-xs font-medium text-gray-700",
                                        input: "text-sm",
                                        inputWrapper: "h-10"
                                    }}
                                />
                                <p className="text-xs text-gray-500">
                                    Password must be at least 8 characters long
                                </p>
                            </div>

                            {/* Change Password Button */}
                            {(currentPassword || newPassword) && (
                                <div className="pt-2">
                                    <Button
                                        color="primary"
                                        size="sm"
                                        onPress={handleChangePassword}
                                        isLoading={changePasswordMutation.isPending}
                                        isDisabled={changePasswordMutation.isPending || !currentPassword || !newPassword}
                                        className="bg-primary text-white"
                                    >
                                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-[#1F1F1F] border-t border-gray-200 dark:border-white/5 flex justify-end gap-3 transition-colors duration-300">
                    <Button
                        variant="light"
                        size="sm"
                        onPress={handleCancel}
                        isDisabled={updateProfileMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        size="sm"
                        className="bg-primary text-white"
                        onPress={handleSaveProfile}
                        isLoading={updateProfileMutation.isPending}
                        isDisabled={updateProfileMutation.isPending || !hasChanges}
                    >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
}