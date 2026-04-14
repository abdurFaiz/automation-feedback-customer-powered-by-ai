import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default async function RegisterPage() {
    const session = await auth();

    if (session) {
        redirect('/business-profile');
    }

    return <RegisterForm />;
}