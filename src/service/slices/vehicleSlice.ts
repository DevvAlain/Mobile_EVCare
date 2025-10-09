import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance } from "../constants/axiosConfig";
import { Vehicle, UpdateVehicleData } from "../../types/vehicle";
import { fetchVehicles as fetchVehiclesBooking } from "./bookingSlice";

// Note: fetch/create are handled in bookingSlice to mirror FE. This slice only updates/deletes.

// Update vehicle expects { vehicleId, updateData } to match FE usage
export const updateVehicle = createAsyncThunk<
  Vehicle,
  { vehicleId: string; updateData: UpdateVehicleData }
>(
  "vehicle/updateVehicle",
  async ({ vehicleId, updateData }, { dispatch }) => {
    try {
      // Align with web FE: convert nested fields to dot-path keys the backend expects
      const info =
        ("vehicleInfo" in updateData && (updateData as any).vehicleInfo)
          ? (updateData as any).vehicleInfo
          : (updateData as any);

      const payload: Record<string, string | number> = {};
      if (typeof info?.licensePlate === "string") {
        payload["vehicleInfo.licensePlate"] = info.licensePlate;
      }
      if (typeof info?.color === "string") {
        payload["vehicleInfo.color"] = info.color;
      }
      if (typeof info?.year === "number") {
        payload["vehicleInfo.year"] = info.year;
      }

      const res = await axiosInstance.put(`/vehicles/${vehicleId}`, payload);
      const updated = res.data?.data ?? res.data;
      // Refresh list using booking flow to mirror FE
      dispatch(fetchVehiclesBooking());
      return updated;
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
  }
);

export const deleteVehicle = createAsyncThunk<string, string>(
  "vehicle/deleteVehicle",
  async (id, { dispatch }) => {
    try {
      await axiosInstance.delete(`/vehicles/${id}`);
      // Refresh list after deletion using booking flow
      dispatch(fetchVehiclesBooking());
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
      // Mirror FE: respond to booking fetchVehicles to keep local copy in sync (optional)
      .addCase(fetchVehiclesBooking.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVehiclesBooking.fulfilled, (state, action: PayloadAction<Vehicle[]>) => {
        state.status = "succeeded";
        state.vehicles = action.payload;
      })
      .addCase(fetchVehiclesBooking.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
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
