/**
 * Firebase Services APIBook
 * Central export point for Firebase services
 */

// Import auth service
export { AuthService } from './auth.service';

// Import payment service
export { PaymentService } from './payment.service';

// Import AI service
export { AIService } from '@/lib/services/ai.service';

// Import types
export type { AppUser } from './auth.service';
export type { PaymentRecord } from './payment.service';
export type { GeneratedImage } from '@/lib/services/ai.service';
export type { ApiResponse } from '../handler';

// Re-export for convenience
import { AuthService } from './auth.service';
import { PaymentService } from './payment.service';
import { AIService } from '@/lib/services/ai.service';

/**
 * Centralized APIBook for Firebase services
 * 
 * Usage:
 * import { APIBook } from '@/lib/firebase/services';
 * const result = await APIBook.auth.loginWithEmail(email, password);
 * const payment = await APIBook.payment.createPayment(paymentData);
 * const image = await APIBook.ai.generateImage(prompt);
 */
export const APIBook = {
  auth: AuthService,
  payment: PaymentService,
  ai: AIService,
} as const;

/**
 * Default export for direct service access
 */
export default APIBook;
