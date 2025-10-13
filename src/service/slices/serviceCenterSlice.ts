import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../constants/axiosConfig";
import {
  SERVICE_CENTERS_ENDPOINT,
  SERVICE_CENTER_DETAIL_ENDPOINT,
  SERVICE_CENTER_NEARBY_ENDPOINT,
  GET_RATING_BY_SERVICE_CENTER_ID_ENDPOINT,
} from "../constants/apiConfig";
import { ServiceCenter } from "../../types/serviceCenter";

interface ServiceCenterState {
  serviceCenters: ServiceCenter[];
  nearbyServiceCenters: ServiceCenter[];
  selectedServiceCenter: ServiceCenter | null;
  loading: boolean;
  error: string | null;
  ratings: { [key: string]: any[] };
}

const initialState: ServiceCenterState = {
  serviceCenters: [],
  nearbyServiceCenters: [],
  selectedServiceCenter: null,
  loading: false,
  error: null,
  ratings: {},
};

export const fetchServiceCenters = createAsyncThunk<
  ServiceCenter[],
  void,
  { rejectValue: string }
>(
  "serviceCenter/fetchServiceCenters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(SERVICE_CENTERS_ENDPOINT);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch service centers");
    }
  }
);

export const fetchNearbyServiceCenters = createAsyncThunk<
  ServiceCenter[],
  { latitude: number; longitude: number; radius?: number },
  { rejectValue: string }
>(
  "serviceCenter/fetchNearbyServiceCenters",
  async ({ latitude, longitude, radius = 10 }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `${SERVICE_CENTER_NEARBY_ENDPOINT}?lat=${latitude}&lng=${longitude}&radius=${radius}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch nearby service centers");
    }
  }
);

export const fetchServiceCenterDetail = createAsyncThunk<
  ServiceCenter,
  string,
  { rejectValue: string }
>(
  "serviceCenter/fetchServiceCenterDetail",
  async (serviceCenterId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`${SERVICE_CENTER_DETAIL_ENDPOINT}/${serviceCenterId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch service center details");
    }
  }
);

export const fetchServiceCenterRatings = createAsyncThunk<
  any[],
  string,
  { rejectValue: string }
>(
  "serviceCenter/fetchServiceCenterRatings",
  async (serviceCenterId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`${GET_RATING_BY_SERVICE_CENTER_ID_ENDPOINT}/${serviceCenterId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch service center ratings");
    }
  }
);

const serviceCenterSlice = createSlice({
  name: "serviceCenter",
  initialState,
  reducers: {
    setSelectedServiceCenter: (state, action) => {
      state.selectedServiceCenter = action.payload;
    },
    clearServiceCenters: (state) => {
      state.serviceCenters = [];
      state.nearbyServiceCenters = [];
      state.selectedServiceCenter = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch service centers
      .addCase(fetchServiceCenters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceCenters.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceCenters = action.payload;
      })
      .addCase(fetchServiceCenters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch service centers";
      })
      // Fetch nearby service centers
      .addCase(fetchNearbyServiceCenters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyServiceCenters.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyServiceCenters = action.payload;
      })
      .addCase(fetchNearbyServiceCenters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch nearby service centers";
      })
      // Fetch service center detail
      .addCase(fetchServiceCenterDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceCenterDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedServiceCenter = action.payload;
      })
      .addCase(fetchServiceCenterDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch service center details";
      })
      // Fetch service center ratings
      .addCase(fetchServiceCenterRatings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceCenterRatings.fulfilled, (state, action) => {
        state.loading = false;
        state.ratings[action.meta.arg] = action.payload;
      })
      .addCase(fetchServiceCenterRatings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch service center ratings";
      });
  },
});

export const { setSelectedServiceCenter, clearServiceCenters, clearError } = serviceCenterSlice.actions;
export default serviceCenterSlice.reducer;
