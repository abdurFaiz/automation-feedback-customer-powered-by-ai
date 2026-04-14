import { Suspense } from 'react';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';

function VerifyEmailContent({ email }: { email?: string | null }) {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="verify-icon">✓</div>
                    <h1>Cek Email Anda</h1>
                </div>

                <div className="verify-content">
                    {email && (
                        <p>
                            Kami telah mengirimkan link login ke <strong>{email}</strong>
                        </p>
                    )}

                    <div className="verify-steps">
                        <ol>
                            <li>Buka aplikasi email Anda</li>
                            <li>Cari email dari kami dengan subjek &quot;Login&quot;</li>
                            <li>Klik tombol &quot;Login&quot; di dalam email</li>
                            <li>Anda akan diarahkan ke dashboard</li>
                        </ol>
                    </div>

                    <div className="verify-info">
                        <p>💡 <strong>Tips:</strong></p>
                        <ul>
                            <li>Link login berlaku selama 24 jam</li>
                            <li>Cek folder spam jika tidak menemukan email</li>
                            <li>Jangan bagikan link login ke orang lain</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-footer">
                    <p>
                        <a href="/auth/login">Kembali ke halaman login</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ email?: string }>;
}) {
    const { email } = await searchParams;
    const session = await auth();

    // Jika sudah login, redirect ke dashboard
    if (session) {
        redirect('/dashboard');
    }

    return (
        <Suspense fallback={<div className="auth-container">Loading...</div>}>
            <VerifyEmailContent email={email} />
        </Suspense>
    );
}
