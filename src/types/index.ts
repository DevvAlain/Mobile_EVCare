// Import types from slices
export type { User } from "../service/slices/userSlice";
export type { ThemeMode } from "../service/slices/appSlice";
import { User } from "../service/slices/userSlice";
import { ThemeMode } from "../service/slices/appSlice";

// Common types for the application
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export type RootStackParamList = {
  Main: undefined;
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};

export interface AppState {
  user: User | null;
  theme: ThemeMode;
  isLoading: boolean;
}
