'use client';

import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem } from "@heroui/dropdown";
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserDropdownProps {
    name: string;
    email?: string | null;
    image?: string | null;
}

export function UserDropdown({ name, email, image }: UserDropdownProps) {
    const router = useRouter();

    return (
        <Dropdown placement="bottom-end">
            <DropdownTrigger>
                <Avatar
                    as="button"
                    src={image || "https://i.pravatar.cc/150?u=" + email}
                    size="sm"
                    className="cursor-pointer ring-2 ring-transparent hover:ring-orange-500/50 transition-all"
                />
            </DropdownTrigger>
            <DropdownMenu aria-label="User Actions" variant="flat" className="min-w-[200px]">
                <DropdownSection showDivider>
                    <DropdownItem key="user-info" isReadOnly className="cursor-default opacity-100">
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={image || "https://i.pravatar.cc/150?u=" + email}
                                size="md"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{email}</span>
                            </div>
                        </div>
                    </DropdownItem>
                </DropdownSection>
                <DropdownSection showDivider>
                    <DropdownItem
                        key="profile"
                        onPress={() => router.push('/profile')}
                    >
                        Profile
                    </DropdownItem>
                </DropdownSection>
                <DropdownSection>
                    <DropdownItem
                        key="logout"
                        color="danger"
                        onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    >
                        Log Out
                    </DropdownItem>
                </DropdownSection>
            </DropdownMenu>
        </Dropdown>
    );
}
