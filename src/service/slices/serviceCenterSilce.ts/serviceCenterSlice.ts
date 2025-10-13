import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { message } from "antd";
import { axiosInstance } from "../../constants/axiosConfig";
import {
  SERVICE_CENTERS_ENDPOINT,
  SERVICE_CENTER_DETAIL_ENDPOINT,
  SERVICE_CENTER_NEARBY_ENDPOINT,
  GET_RATING_BY_SERVICE_CENTER_ID_ENDPOINT,
} from "../../constants/apiConfig";
import {
  ServiceCenterState,
  ServiceCentersResponse,
  ServiceCenter,
  ServiceCenterCreatePayload,
  
} from "../../../types/serviceCenter";

// Initial state
const initialState: ServiceCenterState = {
  serviceCenters: [],
  pagination: null,
  loading: false,
  error: null,
  selectedServiceCenter: null,
};

// get rating by service center id
export const getRatingByServiceCenterId = createAsyncThunk<
  any,
  { centerId: string },
  { rejectValue: { message: string } }
>("adminService/getRatingByServiceCenterId", async ({ centerId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(GET_RATING_BY_SERVICE_CENTER_ID_ENDPOINT(centerId));
      return response.data;
    } catch (err: unknown) {
      const anyErr = err as any;
      const msg =
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        "Lấy đánh giá thất bại";
      return rejectWithValue({ message: msg });
    }
  });

// Async thunks
export const fetchServiceCenters = createAsyncThunk<
  ServiceCentersResponse,
  { page?: number; limit?: number; search?: string },
  { rejectValue: { message: string } }
>(
  "serviceCenter/fetchServiceCenters",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);

      const url = queryParams.toString()
        ? `${SERVICE_CENTERS_ENDPOINT}?${queryParams.toString()}`
        : SERVICE_CENTERS_ENDPOINT;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error.response?.data?.message ||
        error.message ||
        "Lấy danh sách trung tâm dịch vụ thất bại";
      return rejectWithValue({ message });
    }
  }
);

export const createServiceCenter = createAsyncThunk<
  ServiceCenter,
  ServiceCenterCreatePayload,
  { rejectValue: { message: string } }
>("serviceCenter/createServiceCenter", async (serviceCenter, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(SERVICE_CENTERS_ENDPOINT, serviceCenter);
    return response.data.data;
  } catch (err: unknown) {
    const error = err as any;
    const message = error.response?.data?.message || error.message || "Tạo trung tâm dịch vụ thất bại";
    return rejectWithValue({ message });
  }
});





export const fetchNearbyServiceCenters = createAsyncThunk<
  ServiceCentersResponse,
  { lat: number; lng: number; radius?: number },
  { rejectValue: { message: string } }
>(
  "serviceCenter/fetchNearbyServiceCenters",
  async (params, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("lat", params.lat.toString());
      queryParams.append("lng", params.lng.toString());
      if (params.radius) queryParams.append("radius", params.radius.toString());

      // Use fetch for nearby search to avoid CORS issues
      const response = await fetch(
        `${SERVICE_CENTER_NEARBY_ENDPOINT}?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // API nearby search returns array directly, not wrapped in data object
      const serviceCenters = Array.isArray(data) ? data : data.data || [];

      return {
        success: true,
        message: "Lấy danh sách trung tâm gần đây thành công",
        data: {
          serviceCenters: serviceCenters,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: serviceCenters.length,
            itemsPerPage: serviceCenters.length,
          },
        },
      };
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch nearby service centers";
      return rejectWithValue({ message });
    }
  }
);

// Service Center slice
const serviceCenterSlice = createSlice({
  name: "serviceCenter",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedServiceCenter: (state, action) => {
      state.selectedServiceCenter = action.payload;
    },
    clearSelectedServiceCenter: (state) => {
      state.selectedServiceCenter = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch service centers cases
    builder
      .addCase(fetchServiceCenters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceCenters.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceCenters = action.payload.data.serviceCenters;
        state.pagination = action.payload.data.pagination;
        state.error = null;
        // Không hiển thị toast success cho fetch danh sách
      })
      .addCase(fetchServiceCenters.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Lấy danh sách trung tâm dịch vụ thất bại";
        message.error(state.error);
      })
      // Fetch nearby service centers cases
      .addCase(fetchNearbyServiceCenters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyServiceCenters.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceCenters = action.payload.data.serviceCenters;
        state.pagination = action.payload.data.pagination;
        state.error = null;
        // Không hiển thị toast success cho fetch nearby
      })
      .addCase(fetchNearbyServiceCenters.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Lấy danh sách trung tâm gần đây thất bại";
        message.error(state.error);
      })
      // Create service center cases
      .addCase(createServiceCenter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createServiceCenter.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceCenters.push(action.payload);
        state.error = null;
      })
      .addCase(createServiceCenter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Tạo trung tâm dịch vụ thất bại";
        message.error(state.error);
      })
      // Update service center cases
      
        // Safe access 
  },
});

export const {
  clearError,
  setSelectedServiceCenter,
  clearSelectedServiceCenter,
} = serviceCenterSlice.actions;
export default serviceCenterSlice.reducer;
