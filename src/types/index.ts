// Supported roles in mobile: customer, technician
export type UserRole = "customer" | "technician";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  avatar?: string;
  username?: string;
  // Optional fields for compatibility
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  isVerify?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
  needVerification: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface VerifyEmailData {
  email: string;
  verificationCode: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ResetPasswordWithTokenData {
  password: string;
}

export interface UpdatePasswordData {
  email: string;
  resetCode: string;
  newPassword: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileData {
  username?: string;
  fullName?: string;
  phone?: string;
  address?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  loginAttempts: number;
  lastFailedAttempt: string | null;
  needVerification: boolean;
}

// Common types for the application
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export type RootStackParamList = {
  // top-level containers
  Main: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  ServiceCenters: undefined;
  ServiceCenterDetail: { id: string };
  Booking: undefined;
  BookingHistory: undefined;
  ManageVehicles: undefined;
  PaymentHistory: undefined;
  ChangePassword: undefined;
  // Technician routes
  TechnicianHome: undefined;
  TechnicianSchedule: undefined;
  TechnicianProfile: undefined;
  TechnicianWorkProgress: undefined;
  TechnicianChat: undefined;
  TechnicianHistory: undefined;
  TechnicianSettings: undefined;
};

export interface AppState {
  user: User | null;
  isLoading: boolean;
}
