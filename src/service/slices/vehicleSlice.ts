import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../utils/api";
import { axiosInstance } from "../constants/axiosConfig";
import { Vehicle, CreateVehicleData } from "../../types/vehicle";

// Async thunks for API calls
export const fetchVehicles = createAsyncThunk<Vehicle[]>(
  "vehicle/fetchVehicles",
  async () => {
    try {
      const res = await axiosInstance.get("/vehicles");
      // Backend typically returns { data: [...] }
      return res.data?.data ?? res.data ?? [];
    } catch (err) {
      const e: any = err;
      console.error(
        "[vehicleSlice] fetchVehicles error:",
        e?.response?.status,
        e?.response?.data,
        e?.config?.url
      );
      throw err;
    }
  }
);

// Create vehicle expects CreateVehicleData payload (same as FE)
export const createVehicle = createAsyncThunk<Vehicle, CreateVehicleData>(
  "vehicle/createVehicle",
  async (payload) => {
    try {
      const res = await axiosInstance.post("/vehicles", payload);
      return res.data?.data ?? res.data;
    } catch (err) {
      const e: any = err;
      console.error(
        "[vehicleSlice] createVehicle error:",
        e?.response?.status,
        e?.response?.data,
        e?.config?.url
      );
      throw err;
    }
  }
);

// Update vehicle expects { vehicleId, updateData } to match FE usage
export const updateVehicle = createAsyncThunk<
  Vehicle,
  { vehicleId: string; updateData: any }
>("vehicle/updateVehicle", async ({ vehicleId, updateData }) => {
  try {
    const res = await axiosInstance.put(`/vehicles/${vehicleId}`, updateData);
    return res.data?.data ?? res.data;
  } catch (err) {
    const e: any = err;
    console.error(
      "[vehicleSlice] updateVehicle error:",
      e?.response?.status,
      e?.response?.data,
      e?.config?.url
    );
    throw err;
  }
});

export const deleteVehicle = createAsyncThunk<string, string>(
  "vehicle/deleteVehicle",
  async (id) => {
    try {
      await axiosInstance.delete(`/vehicles/${id}`);
      return id;
    } catch (err) {
      const e: any = err;
      console.error(
        "[vehicleSlice] deleteVehicle error:",
        e?.response?.status,
        e?.response?.data,
        e?.config?.url
      );
      throw err;
    }
  }
);

interface VehicleState {
  vehicles: Vehicle[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: VehicleState = {
  vehicles: [],
  status: "idle",
  error: null,
};

const vehicleSlice = createSlice({
  name: "vehicle",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.vehicles = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
      })
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.vehicles.push(action.payload);
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const index = state.vehicles.findIndex(
          (v) => v._id === action.payload._id
        );
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.vehicles = state.vehicles.filter((v) => v._id !== action.payload);
      });
  },
});

export default vehicleSlice.reducer;
