import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import appReducer from "../slices/appSlice";
import userReducer from "../slices/userSlice";
import bookingReducer from "../slices/bookingSlice";
import paymentReducer from "../slices/paymentSlice.ts/paymentSlice";
import vehicleReducer from "../slices/vehicleSlice";
import serviceCenterReducer from "../slices/serviceCenterSilce.ts/serviceCenterSlice";
import technicianReducer from "../technician/technicianSlice";
import workProgressReducer from "../technician/workProgressSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["user"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  app: appReducer,
  user: userReducer,
  booking: bookingReducer,
  payment: paymentReducer, // Added payment slice
  vehicle: vehicleReducer, // Added vehicle slice
  serviceCenter: serviceCenterReducer, // Added serviceCenter slice
  technician: technicianReducer,
  workProgress: workProgressReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
