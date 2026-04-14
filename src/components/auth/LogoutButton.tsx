'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
            }}
        >
            Logout
        </button>
    );
}