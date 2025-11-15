import type { FirebaseConfig, EnvironmentConfig, GeminiConfig, InstagramConfig } from './types';

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
    apiKey:  "AIzaSyCtZnsy6OLF39beST3YtTexJZOP6lACuj8",
    imageModel: "gemini-2.5-flash-image",
    textModel: "gemini-2.0-flash-exp"
};

/**
 * UAT Instagram Configuration
 */
const UAT_INSTAGRAM: InstagramConfig = {
    appId: "1408513954025673",
    appSecret: "1beb014e5c9b74c73f1bb38ba1a1e325",
    accessToken: "EAAUBCTXkEMkBP4SaPeh5op1SCfZApZBNvj7ybjJZB8AV9qsa3qzSLkpF786isLxmrZBwxfzweSORGP2XZCuGdO34SxgEVY5C9BhmONK4LO5r19j8vfYogeE1kpe8ITKk9Cj5t76C3nnHpbQC8HCSVVEGr2PGrvLlFq2QZBiFWddFptVLHfXfw5ZBFvNP0pc",
    accountId: "17841478413044591"
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
    imageModel: "gemini-2.5-flash-image",
    textModel: "gemini-2.0-flash-exp"
};

/**
 * PROD Instagram Configuration
 */
const PROD_INSTAGRAM: InstagramConfig = {
    appId: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID_PROD || "",
    appSecret: process.env.INSTAGRAM_APP_SECRET_PROD || "",
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN_PROD || "",
    accountId: process.env.INSTAGRAM_ACCOUNT_ID_PROD || ""
};

/**
 * Environment configurations map
 */
export const ENVIRONMENTS: Record<'UAT' | 'PROD', EnvironmentConfig> = {
  UAT: {
    name: 'UAT',
    config: UAT_CONFIG,
    gemini: UAT_GEMINI,
    instagram: UAT_INSTAGRAM
  },
  PROD: {
    name: 'PROD',
    config: PROD_CONFIG,
    gemini: PROD_GEMINI,
    instagram: PROD_INSTAGRAM
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
 * Get current Instagram config
 */
export const getInstagramConfig = (): InstagramConfig => {
  return getCurrentEnvironment().instagram;
};


/**
 * Verify and log current environment configuration
 */
export const verifyEnvironmentConfiguration = (): void => {
  const environment = getCurrentEnvironment();
  const config = getCurrentFirebaseConfig();
  
  // Environment verification removed for production
}; 