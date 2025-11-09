import type { FirebaseConfig, EnvironmentConfig, GeminiConfig } from './types';

/**
 * UAT Environment Configuration
 */
const UAT_CONFIG: FirebaseConfig = {
    apiKey: "AIzaSyDr2GEwj5O4AMQF6JCAu0nhNhlezsgxHS8",
    authDomain: "env-uat-cd3c5.firebaseapp.com",
    projectId: "env-uat-cd3c5",
    storageBucket: "env-uat-cd3c5.firebasestorage.app",
    messagingSenderId: "614576728087",
    appId: "1:614576728087:web:6337d07f43cb3674001452",
    measurementId: "G-RMHPEET5ZY",
    vapidKey: "BPdx9XtofjSoMHlUewHoxrV2IcWwz3jsJY7Rl0byzte4EDYOnMfxtJogdOXlCKRAL5tYSsHc-7iuWkxWjnwo1TA"
};

/**
 * UAT Gemini Configuration
 */
const UAT_GEMINI: GeminiConfig = {
    apiKey:  "AIzaSyAOcGqPpVVborGiFPLz02DORVFVdgmgpw4",
    model: "gemini-2.5-flash-image"
};

/**
 * PROD Environment Configuration
 */
const PROD_CONFIG: FirebaseConfig = {
 apiKey: "AIzaSyDP7goPvbKrk1utbKISF2tJU-SwyuJdm2E",
  authDomain: "breathe-free-c1566.firebaseapp.com",
  projectId: "breathe-free-c1566",
  storageBucket: "breathe-free-c1566.firebasestorage.app",
  messagingSenderId: "169689352647",
  appId: "1:169689352647:web:00fafecc859873d4eb31e2",
  measurementId: "G-DTQR8G46W0",
  vapidKey: "BMSqnRUaslFNE6JtlzBem_04MMSmaYVAGF3IkC2xFnqJ5MMcshy3GOTbnF4TIJzURpXJ1uYzatIktOavO2ka2NE"
};

/**
 * PROD Gemini Configuration
 */
const PROD_GEMINI: GeminiConfig = {
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY_PROD || "",
    model: "gemini-2.5-flash-image"
};

/**
 * Environment configurations map
 */
export const ENVIRONMENTS: Record<'UAT' | 'PROD', EnvironmentConfig> = {
  UAT: {
    name: 'UAT',
    config: UAT_CONFIG,
    gemini: UAT_GEMINI
  },
  PROD: {
    name: 'PROD',
    config: PROD_CONFIG,
    gemini: PROD_GEMINI
  }
};

/**
 * Boolean environment switcher
 * Set to true for PROD, false for UAT
 */
export const IS_PRODUCTION = false;

/**
 * Get current environment configuration
 */
export const getCurrentEnvironment = (): EnvironmentConfig => {
  return IS_PRODUCTION ? ENVIRONMENTS.PROD : ENVIRONMENTS.UAT;
};

/**
 * Get current Firebase config
 */
export const getCurrentFirebaseConfig = (): FirebaseConfig => {
  return getCurrentEnvironment().config;
};

/**
 * Get current Gemini AI config
 */
export const getGeminiConfig = (): GeminiConfig => {
  return getCurrentEnvironment().gemini;
};


/**
 * Verify and log current environment configuration
 */
export const verifyEnvironmentConfiguration = (): void => {
  const environment = getCurrentEnvironment();
  const config = getCurrentFirebaseConfig();
  
  // Environment verification removed for production
}; 