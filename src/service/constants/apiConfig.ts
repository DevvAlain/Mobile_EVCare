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
export const GET_RATING_BY_SERVICE_CENTER_ID_ENDPOINT = (centerId: string) =>
  `${API_BASE_URL}/service-centers/${centerId}/ratings`;

// Booking endpoints
export const MY_BOOKINGS_ENDPOINT = `${API_BASE_URL}/booking/my-bookings`;
export const BOOKINGS_ENDPOINT = "/bookings";
export const BOOKING_DETAIL_ENDPOINT = (id: string) => `/bookings/${id}`;
export const BOOKING_DETAILS_ENDPOINT = (bookingId: string) =>
  `${API_BASE_URL}/booking/${bookingId}`;
export const BOOKING_TIME_SLOTS_ENDPOINT = (
  serviceCenterId: string,
  date: string
) =>
  `${API_BASE_URL}/booking/service-centers/${serviceCenterId}/slots?date=${date}`;
export const APPOINTMENT_PROGRESS_ENDPOINT = (appointmentId: string) =>
  `${API_BASE_URL}/appointments/${appointmentId}/progress`;
export const TECHNICIAN_PROGRESS_QUOTE_RESPONSE_ENDPOINT = (
  progressId: string
) => `${API_BASE_URL}/work-progress/${progressId}/quote-response`;

// Vehicle endpoints
export const VEHICLES_ENDPOINT = "/vehicles";
export const CREATE_VEHICLE_ENDPOINT = `${API_BASE_URL}/vehicles`;

export const POPULAR_SERVICE_TYPES_ENDPOINT = `${API_BASE_URL}/service-types/popular/list`;

export const COMPATIBLE_SERVICES_ENDPOINT = (vehicleId: string) =>
  `${API_BASE_URL}/booking/vehicles/${vehicleId}/services`;

export const COMPATIBLE_PACKAGES_ENDPOINT = (vehicleId: string) =>
  `${API_BASE_URL}/service-packages/vehicle/${vehicleId}/compatible`;

export const CREATE_BOOKING_ENDPOINT = `${API_BASE_URL}/booking`;

export const BOOKING_SERVICE_CENTERS_ENDPOINT = `${API_BASE_URL}/booking/service-centers`;

export const SERVICE_CENTER_NEARBY_ENDPOINT = `${API_BASE_URL}/service-centers/nearby/search`;

export const BOOKING_RESCHEDULE_ENDPOINT = (bookingId: string) =>
  `${API_BASE_URL}/booking/${bookingId}/reschedule`;

export const BOOKING_CANCEL_ENDPOINT = (bookingId: string) =>
  `${API_BASE_URL}/booking/${bookingId}/cancel`;

export const BOOKING_AWAITING_CONFIRMATION_ENDPOINT = `${API_BASE_URL}/booking/awaiting-confirmation`;

export const BOOKING_CONFIRM_ENDPOINT = (bookingId: string) =>
  `${API_BASE_URL}/booking/${bookingId}/confirm`;

export const BOOKINGS_CONFIRMED_ENDPOINT = `${API_BASE_URL}/bookings/confirmed`;

export const BOOKINGS_PENDING_OFFLINE_PAYMENT_ENDPOINT = `${API_BASE_URL}/bookings/pending-offline-payment`;

export const SUBMIT_CUSTOMER_FEEDBACK_ENDPOINT = (appointmentId: string) =>
  `${API_BASE_URL}/appointments/${appointmentId}/feedback`;

export const GET_CUSTOMER_FEEDBACK_ENDPOINT = (appointmentId: string) =>
  `${API_BASE_URL}/appointments/${appointmentId}/feedback`;

// Technician endpoints
export const TECHNICIAN_SCHEDULES_BY_TECHNICIAN_ENDPOINT = (
  technicianId: string
) => `${API_BASE_URL}/technicians/${technicianId}/schedules`;
export const TECHNICIAN_SCHEDULE_CREATE_ENDPOINT = `${API_BASE_URL}/technician-schedules`;
export const TECHNICIAN_SCHEDULE_CREATE_DEFAULT_ENDPOINT = `${API_BASE_URL}/technician-schedules/default`;
export const TECHNICIAN_SCHEDULE_LIST_ENDPOINT = `${API_BASE_URL}/technician-schedules`;
export const TECHNICIAN_SCHEDULE_BY_CENTER_ENDPOINT = `${API_BASE_URL}/technician-schedules`;
export const TECHNICIAN_SCHEDULE_UPDATE_ENDPOINT = (id: string) =>
  `${API_BASE_URL}/technician-schedules/${id}`;
export const TECHNICIAN_SCHEDULE_DELETE_ENDPOINT = (id: string) =>
  `${API_BASE_URL}/technician-schedules/${id}`;
export const TECHNICIAN_SCHEDULE_ADD_APPOINTMENT_ENDPOINT = (id: string) =>
  `${API_BASE_URL}/technician-schedules/${id}/appointments`;
export const TECHNICIAN_STAFF_BY_CENTER_ENDPOINT = (centerId: string) =>
  `${API_BASE_URL}/service-centers/${centerId}/staff?position=technician`;
export const AVAILABLE_TECHNICIANS_ENDPOINT = (centerId: string) =>
  `${API_BASE_URL}/service-centers/${centerId}/available-technicians`;
export const WORK_PROGRESS_LIST_ENDPOINT = `${API_BASE_URL}/work-progress`;
export const TECHNICIAN_PROGRESS_CREATE_ENDPOINT = `${API_BASE_URL}/work-progress`;
export const WORK_PROGRESS_DETAIL_ENDPOINT = (id: string) =>
  `${API_BASE_URL}/work-progress/${id}`;
export const WORK_PROGRESS_PROCESS_PAYMENT_ENDPOINT = (id: string) =>
  `${API_BASE_URL}/work-progress/${id}/process-payment`;
export const TECHNICIAN_PROGRESS_INSPECTION_QUOTE_ENDPOINT = (
  progressId: string
) => `${API_BASE_URL}/work-progress/${progressId}/inspection-quote`;
export const TECHNICIAN_PROGRESS_START_MAINTENANCE_ENDPOINT = (
  progressId: string
) => `${API_BASE_URL}/work-progress/${progressId}/start-maintenance`;
export const TECHNICIAN_PROGRESS_COMPLETE_MAINTENANCE_ENDPOINT = (
  progressId: string
) => `${API_BASE_URL}/work-progress/${progressId}/complete-maintenance`;
// Technician check in/out endpoints (mirror web frontend)
export const TECHNICIAN_CHECK_IN_ENDPOINT = (scheduleId: string) =>
  `${API_BASE_URL}/technician-schedules/${scheduleId}/check-in`;
export const TECHNICIAN_CHECK_OUT_ENDPOINT = (scheduleId: string) =>
  `${API_BASE_URL}/technician-schedules/${scheduleId}/check-out`;

// Payment endpoints
export const PAYMENTS_ENDPOINT = "/payments";
export const PAYMENT_HISTORY_ENDPOINT = "/payments/history";

export const PAYMENT_CREATE_ENDPOINT = (appointmentId: string) =>
  `${API_BASE_URL}/payment/booking/${appointmentId}`;
export const PAYMENT_STATUS_ENDPOINT = (paymentId: string) =>
  `${API_BASE_URL}/payment/${paymentId}/status`;
export const PAYMENT_SYNC_ENDPOINT = (orderCode: string) =>
  `${API_BASE_URL}/payment/sync/${orderCode}`;
export const PAYMENT_CANCEL_ENDPOINT = (paymentId: string) =>
  `${API_BASE_URL}/payment/${paymentId}/cancel`;
export const MY_PAYMENTS_ENDPOINT = `${API_BASE_URL}/payment/my-payments`;

export const PAYOS_PAYMENT_INFO_ENDPOINT = (orderCode: string) =>
  `${API_BASE_URL}/payment/${orderCode}`;
export const PAYOS_CANCEL_ENDPOINT = (orderCode: string) =>
  `${API_BASE_URL}/payment/${orderCode}/cancel`;

export const VEHICLE_BRANDS_ENDPOINT = `${API_BASE_URL}/vehicle-models/brands/list`;

// Parts endpoints
export const PARTS_ENDPOINT = `${API_BASE_URL}/parts`;
export const PARTS_BY_CATEGORY_ENDPOINT = (category: string) => `${API_BASE_URL}/parts/category/${category}`;