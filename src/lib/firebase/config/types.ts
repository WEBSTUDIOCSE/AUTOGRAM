/**
 * Firebase configuration interface
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
  vapidKey: string; // Add VAPID key for push notifications
}

/**
 * Environment names
 */
export type Environment = 'UAT' | 'PROD';

/**
 * Gemini AI configuration interface
 */
export interface GeminiConfig {
  apiKey: string;
  model: string;
}

/**
 * Instagram Graph API configuration interface
 */
export interface InstagramConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  accountId: string;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  name: Environment;
  config: FirebaseConfig;
  gemini: GeminiConfig;
  instagram: InstagramConfig;
} 