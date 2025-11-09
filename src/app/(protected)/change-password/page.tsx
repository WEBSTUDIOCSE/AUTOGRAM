import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change Password',
  description: 'Update your account password',
};

export default async function ChangePasswordPage() {
  // Server-side auth check
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/change-password&message=Please sign in to change password');
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="flex justify-center max-w-2xl mx-auto w-full">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
