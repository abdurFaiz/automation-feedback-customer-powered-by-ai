'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import Link from 'next/link';

const UserIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const LockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

export const EyeSlashFilledIcon = (props: any) => {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            focusable="false"
            height="1em"
            role="presentation"
            viewBox="0 0 24 24"
            width="1em"
            {...props}
        >
            <path
                d="M21.2714 9.17834C20.9814 8.71834 20.6714 8.28834 20.3514 7.88834C19.9814 7.41834 19.2814 7.37834 18.8614 7.79834L15.8614 10.7983C16.0814 11.4583 16.1214 12.2183 15.9214 13.0083C15.5714 14.4183 14.4314 15.5583 13.0214 15.9083C12.2314 16.1083 11.4714 16.0683 10.8114 15.8483C10.8114 15.8483 9.38141 17.2783 8.35141 18.3083C7.85141 18.8083 8.01141 19.6883 8.68141 19.9483C9.75141 20.3583 10.8614 20.5683 12.0014 20.5683C13.7814 20.5683 15.5114 20.0483 17.0914 19.0783C18.7014 18.0783 20.1514 16.6083 21.3214 14.7383C22.2714 13.2283 22.2214 10.6883 21.2714 9.17834Z"
                fill="currentColor"
            />
            <path
                d="M14.0206 9.98062L9.98062 14.0206C9.47062 13.5006 9.14062 12.7806 9.14062 12.0006C9.14062 10.4306 10.4206 9.14062 12.0006 9.14062C12.7806 9.14062 13.5006 9.47062 14.0206 9.98062Z"
                fill="currentColor"
            />
            <path
                d="M18.25 5.74969L14.86 9.13969C14.13 8.39969 13.12 7.95969 12 7.95969C9.76 7.95969 7.96 9.76969 7.96 11.9997C7.96 13.1197 8.41 14.1297 9.14 14.8597L5.76 18.2497H5.75C4.64 17.3497 3.62 16.1997 2.75 14.8397C1.75 13.2697 1.75 10.7197 2.75 9.14969C3.91 7.32969 5.33 5.89969 6.91 4.91969C8.49 3.95969 10.22 3.42969 12 3.42969C14.23 3.42969 16.39 4.24969 18.25 5.74969Z"
                fill="currentColor"
            />
            <path
                d="M14.8581 11.9981C14.8581 13.5681 13.5781 14.8581 11.9981 14.8581C11.9381 14.8581 11.8881 14.8581 11.8281 14.8381L14.8381 11.8281C14.8581 11.8881 14.8581 11.9381 14.8581 11.9981Z"
                fill="currentColor"
            />
            <path
                d="M21.7689 2.22891C21.4689 1.92891 20.9789 1.92891 20.6789 2.22891L2.22891 20.6889C1.92891 20.9889 1.92891 21.4789 2.22891 21.7789C2.37891 21.9189 2.56891 21.9989 2.76891 21.9989C2.96891 21.9989 3.15891 21.9189 3.30891 21.7689L21.7689 3.30891C22.0789 3.00891 22.0789 2.52891 21.7689 2.22891Z"
                fill="currentColor"
            />
        </svg>
    );
};

export const EyeFilledIcon = (props: any) => {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            focusable="false"
            height="1em"
            role="presentation"
            viewBox="0 0 24 24"
            width="1em"
            {...props}
        >
            <path
                d="M21.25 9.14969C18.94 5.51969 15.56 3.42969 12 3.42969C10.22 3.42969 8.49 3.94969 6.91 4.91969C5.33 5.89969 3.91 7.32969 2.75 9.14969C1.75 10.7197 1.75 13.2697 2.75 14.8397C5.06 18.4797 8.44 20.5597 12 20.5597C13.78 20.5597 15.51 20.0397 17.09 19.0697C18.67 18.0897 20.09 16.6597 21.25 14.8397C22.25 13.2797 22.25 10.7197 21.25 9.14969ZM12 16.0397C9.76 16.0397 7.96 14.2297 7.96 11.9997C7.96 9.76969 9.76 7.95969 12 7.95969C14.24 7.95969 16.04 9.76969 16.04 11.9997C16.04 14.2297 14.24 16.0397 12 16.0397Z"
                fill="currentColor"
            />
            <path
                d="M11.9984 9.14062C10.4284 9.14062 9.14844 10.4206 9.14844 12.0006C9.14844 13.5706 10.4284 14.8506 11.9984 14.8506C13.5684 14.8506 14.8584 13.5706 14.8584 12.0006C14.8584 10.4306 13.5684 9.14062 11.9984 9.14062Z"
                fill="currentColor"
            />
        </svg>
    );
};

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();

    const toggleVisibility = () => setIsVisible(!isVisible);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } else {
                console.log('SignIn result:', result);
                setError(result?.error ?? 'Invalid email or password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signIn('google', { callbackUrl: '/dashboard' });
        } catch (err) {
            setError('Google sign in failed. Please try again.');
            console.error(err);
        }
    };

    if (success) {
        return (
            <div className="flex-1 max-w-lg py-12 px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">✓</div>
                    <p className="text-2xl font-semibold text-gray-900">Login successful!</p>
                    <p className="text-gray-500 mt-2">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">Welcome Back</h1>
                <p className="text-gray-500 dark:text-gray-400">Please login to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col gap-10">
                    <div className='flex flex-col gap-4'>
                        <Input
                            labelPlacement="outside"
                            label="Email Address"
                            isRequired
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            size='lg'
                            startContent={<UserIcon />}
                            classNames={{
                                label: "dark:text-gray-300",
                                input: "text-base dark:text-white",
                                inputWrapper: "bg-gray-50 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                            }}
                        />
                        <Input
                            labelPlacement="outside"
                            label="Password"
                            isRequired
                            type={isVisible ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            size='lg'
                            startContent={<LockIcon />}
                            endContent={
                                <button
                                    aria-label="toggle password visibility"
                                    className="focus:outline-none"
                                    type="button"
                                    onClick={toggleVisibility}
                                >
                                    {isVisible ? (
                                        <EyeSlashFilledIcon className="text-xl text-gray-400" />
                                    ) : (
                                        <EyeFilledIcon className="text-xl text-gray-400" />
                                    )}
                                </button>
                            }
                            classNames={{
                                label: "dark:text-gray-300",
                                input: "text-base dark:text-white",
                                inputWrapper: "bg-gray-50 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                            }}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                            {error}
                        </div>
                    )}
                    <div className="flex flex-col items-center justify-center gap-3 w-full">
                        <Button
                            size='lg'
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full h-14 bg-linear-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold text-base rounded-2xl shadow-md transition-all duration-200"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                        <div className="flex flex-row gap-3 items-center justify-center w-full">
                            <div className=" h-px w-36 bg-linear-to-l from-gray-200 to-gray-50 dark:from-gray-700 dark:to-gray-800"></div>
                            <span className='text-center text-gray-500 text-sm dark:text-gray-400'>Or</span>
                            <div className=" h-px w-36 bg-linear-to-r from-gray-200 to-gray-50 dark:from-gray-700 dark:to-gray-800"></div>
                        </div>
                        <Button
                            size='lg'
                            onClick={handleGoogleSignIn}
                            type="button"
                            startContent={
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            }
                            className="w-full h-14 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-base rounded-2xl shadow-md transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-200"
                        >
                            {loading ? 'Logging in...' : 'Continue with Google'}
                        </Button>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
}