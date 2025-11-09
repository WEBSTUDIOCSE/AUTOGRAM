import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { Suspense } from 'react';
import PaymentForm from '@/components/payment/PaymentForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your secure payment',
};

interface CheckoutPageProps {
  searchParams: Promise<{
    product?: string;
    amount?: string;
    allowCustomAmount?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  // Server-side auth check
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/checkout&message=Please sign in to make a payment');
  }

  // Get search params
  const params = await searchParams;
  const productInfo = params.product ? decodeURIComponent(params.product) : '';
  const amount = params.amount ? parseFloat(params.amount) : 0;
  const allowCustomAmount = params.allowCustomAmount !== 'false';

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading payment form...</p>
            </div>
          }>
            <PaymentForm
              productInfo={productInfo}
              amount={amount}
              allowCustomAmount={allowCustomAmount}
              className="w-full"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
