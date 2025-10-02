import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";

interface AppState {
  theme: ThemeMode;
  isLoading: boolean;
  error: string | null;
  language: string;
}

const initialState: AppState = {
  theme: "light",
  isLoading: false,
  error: null,
  language: "en",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setTheme, setLoading, setError, setLanguage, clearError } =
  appSlice.actions;
export default appSlice.reducer;
