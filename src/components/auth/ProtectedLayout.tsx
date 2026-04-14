'use client';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p style={{ textAlign: 'center' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/login');
  }

  return <>{children}</>;
}
