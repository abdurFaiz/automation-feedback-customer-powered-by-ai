'use client';

import { signOut, useSession } from 'next-auth/react';

export function UserMenu() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <div className="user-menu">
      <span className="user-email">{session.user?.email}</span>
      <button onClick={() => signOut({ callbackUrl: '/auth/login' })} className="logout-btn">
        Logout
      </button>
    </div>
  );
}
