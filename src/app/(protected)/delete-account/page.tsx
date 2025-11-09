import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import DeleteAccountForm from '@/components/auth/DeleteAccountForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Account',
  description: 'Permanently delete your account and all associated data',
};

export default async function DeleteAccountPage() {
  // Server-side auth check - no loading state needed!
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/delete-account&message=Please sign in to access account deletion');
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <p className="text-muted-foreground mt-2">
            Permanently remove your account and all associated data
          </p>
        </div>
        
        <DeleteAccountForm />
      </div>
    </div>
  );
}
