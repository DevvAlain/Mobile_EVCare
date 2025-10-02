// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? "http://localhost:3000/api"
    : "https://api.production.com",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: "Mobile App",
  VERSION: "1.0.0",
  SUPPORTED_LANGUAGES: ["en", "vi"],
  DEFAULT_LANGUAGE: "en",
};

// UI Constants
export const COLORS = {
  PRIMARY: "#007AFF",
  SECONDARY: "#5856D6",
  SUCCESS: "#34C759",
  WARNING: "#FF9500",
  ERROR: "#FF3B30",
  BACKGROUND: "#F2F2F7",
  WHITE: "#FFFFFF",
  BLACK: "#000000",
  GRAY: {
    100: "#F2F2F7",
    200: "#E5E5EA",
    300: "#D1D1D6",
    400: "#C7C7CC",
    500: "#AEAEB2",
    600: "#8E8E93",
  },
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
};

// Screen Dimensions
export const SCREEN_CONFIG = {
  HEADER_HEIGHT: 60,
  TAB_BAR_HEIGHT: 80,
  BOTTOM_SAFE_AREA: 34,
};
