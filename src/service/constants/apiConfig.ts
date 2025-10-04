import Constants from "expo-constants";
// API Configuration
// Resolution order for API base URL:
// 1. expo config extra.apiUrl (recommended for device testing)
// 2. If running in development (__DEV__), prefer localhost (use emulator host mapping if needed)
// 3. Fallback to production (digitalocean) URL

const prodDefault = "https://dolphin-app-pwai8.ondigitalocean.app";

const expoUrl = Constants.expoConfig?.extra?.apiUrl;

// Prefer explicit expo config value if provided (useful for testing on device).
// Otherwise use the production backend host provided by the project.
const rawBase = expoUrl || prodDefault;

// Remove trailing slash then append /api if not already present
const normalized = rawBase.replace(/\/+$/, "");
export const API_BASE_URL = normalized.endsWith("/api")
  ? normalized
  : `${normalized}/api`;

// Helpful runtime log for debugging 404s due to wrong base URL
/* eslint-disable no-console */
console.log(`[apiConfig] Using API_BASE_URL=${API_BASE_URL}`);
/* eslint-enable no-console */

// Auth endpoints
export const LOGIN_ENDPOINT = "/auth/login";
export const GOOGLE_LOGIN_ENDPOINT = "/auth/google-login";
export const REGISTER_ENDPOINT = "/auth/register";
export const VERIFY_EMAIL_TOKEN_ENDPOINT = (token: string) =>
  `/auth/verify-email/${token}`;
export const RESEND_VERIFICATION_ENDPOINT = "/auth/resend-verification";
export const RESET_PASSWORD_ENDPOINT = "/auth/reset-password";
export const RESET_PASSWORD_WITH_TOKEN_ENDPOINT = (token: string) =>
  `/auth/reset-password/${token}`;
export const UPDATE_PASSWORD_ENDPOINT = "/auth/update-password";
export const CHANGE_PASSWORD_ENDPOINT = "/auth/change-password";
export const VERIFY_RESET_CODE_ENDPOINT = "/auth/verify-reset-code";
export const LOGOUT_ENDPOINT = "/auth/logout";
export const REFRESH_TOKEN_ENDPOINT = "/auth/refresh-token";

// Service Center endpoints
export const SERVICE_CENTERS_ENDPOINT = "/service-centers";
export const SERVICE_CENTER_DETAIL_ENDPOINT = (id: string) =>
  `/service-centers/${id}`;

// Booking endpoints
export const BOOKINGS_ENDPOINT = "/bookings";
export const BOOKING_DETAIL_ENDPOINT = (id: string) => `/bookings/${id}`;

// Vehicle endpoints
export const VEHICLES_ENDPOINT = "/vehicles";

// Payment endpoints
export const PAYMENTS_ENDPOINT = "/payments";
export const PAYMENT_HISTORY_ENDPOINT = "/payments/history";
