import type { FirebaseConfig, EnvironmentConfig, GeminiConfig, KieAIConfig, InstagramConfig } from './types';

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
    apiKey: process.env.NEXT_PUBLIC_UAT || "",
    imageModel: "gemini-2.5-flash-image",
    textModel: "gemini-2.0-flash-exp"
};

/**
 * UAT Kie.ai Configuration
 */
const UAT_KIEAI: KieAIConfig = {
    apiKey: process.env.NEXT_PUBLIC_KIEAI_API_KEY || "",
    baseUrl: "https://api.kie.ai/api/v1",
    defaultModel: "bytedance/seedream",
    editModel: "bytedance/seedream-v4-edit",
    enabled: true
};

/**
 * UAT Instagram Configuration
 * 
 * To add more accounts:
 * 1. Get Page Access Token from Facebook Graph API
 * 2. Get Instagram Business Account ID
 * 3. Add new account object below with unique id
 * 4. Username will be fetched automatically from Instagram Graph API
 */
const UAT_INSTAGRAM: InstagramConfig = {
    accounts: [
        {
            id: "account_17841478413044591",
            name: "Instagram Account 1",
            username: "", // Will be fetched from Instagram API
            accessToken: "EAAUBCTXkEMkBQHx7ZBdvVRWOVIKXPfitd3k210BeZAS7NqWM2ikKULCWzago8QoZAN7FX1ZCRZB1KmZAyHSyun8I4QHMwJFi9u9HreMcZAwAxg4mwZAlDJsMLyUyt3Y0kWdnYOiVONwnI9eZCOp18bzEM1HyIzBlnLBzGnZC1xmtOChzgFSDkgyUVWhe9kGzRZBppcy",
            accountId: "17841478413044591",
            appId: "1408513954025673",
            appSecret: "1beb014e5c9b74c73f1bb38ba1a1e325",
            isActive: true
        },
        {
            id: "account_17841473226055306",
            name: "Instagram Account 2",
            username: "", // Will be fetched from Instagram API
            accessToken: "EAAUBCTXkEMkBQHt3O5Um2YKGYriXb0oU6oUHEEKLtHEsP7NM32JjoqJloWZBd0BrZCsifWKqGZA83wTPcmvWRRP0OiNfsQ0vNeS4vgnMhVZB6ckxMz5oJ9FsZAvorLHG3K91yXDpwq28tfPc56EB2EbC1C1GQgRdIGGBNbnVlT9fON4w5cHlpkPMhgypC",
            accountId: "17841473226055306",
            appId: "735416536241722",
            appSecret: "fc930595adbf59bdb747f9c93c44dc23",
            isActive: true
        }
        // Add more accounts here following the same pattern
        // {
        //     id: "account_YOUR_INSTAGRAM_ID",
        //     name: "Instagram Account 3",
        //     username: "",
        //     accessToken: "YOUR_PAGE_ACCESS_TOKEN",
        //     accountId: "YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID",
        //     isActive: true
        // }
    ]
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
 * PROD Kie.ai Configuration
 */
const PROD_KIEAI: KieAIConfig = {
    apiKey: process.env.NEXT_PUBLIC_KIEAI_API_KEY_PROD || "",
    baseUrl: "https://api.kie.ai/api/v1",
    defaultModel: "bytedance/seedream",
    editModel: "bytedance/seedream-v4-edit",
    enabled: true
};

/**
 * PROD Instagram Configuration
 */
const PROD_INSTAGRAM: InstagramConfig = {
    accounts: [
        {
            id: "account1",
            name: "Production Account 1",
            username: process.env.INSTAGRAM_USERNAME_1_PROD || "",
            accessToken: process.env.INSTAGRAM_ACCESS_TOKEN_1_PROD || "",
            accountId: process.env.INSTAGRAM_ACCOUNT_ID_1_PROD || "",
            appId: process.env.INSTAGRAM_APP_ID_1_PROD || "",
            appSecret: process.env.INSTAGRAM_APP_SECRET_1_PROD || "",
            isActive: true
        }
        // Add more production accounts via environment variables
    ]
};

/**
 * Environment configurations map
 */
export const ENVIRONMENTS: Record<'UAT' | 'PROD', EnvironmentConfig> = {
  UAT: {
    name: 'UAT',
    config: UAT_CONFIG,
    gemini: UAT_GEMINI,
    kieai: UAT_KIEAI,
    instagram: UAT_INSTAGRAM
  },
  PROD: {
    name: 'PROD',
    config: PROD_CONFIG,
    gemini: PROD_GEMINI,
    kieai: PROD_KIEAI,
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
 * Get current Kie.ai config
 */
export const getKieAIConfig = (): KieAIConfig => {
  return getCurrentEnvironment().kieai;
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