import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../constants/axiosConfig";
import { PARTS_ENDPOINT, PARTS_BY_CATEGORY_ENDPOINT } from "../constants/apiConfig";

interface Part {
  _id: string;
  partName: string;
  partNumber: string;
  category?: string;
  unitPrice?: number;
  [key: string]: any;
}

interface PartsState {
  parts: Part[];
  loading: boolean;
  error: string | null;
}

const initialState: PartsState = {
  parts: [],
  loading: false,
  error: null,
};

export const fetchParts = createAsyncThunk(
  "parts/fetchParts",
  async (category: string | undefined, { rejectWithValue }) => {
    try {
      const endpoint = category ? PARTS_BY_CATEGORY_ENDPOINT(category) : PARTS_ENDPOINT;
      const response = await axiosInstance.get(endpoint);
      return response.data?.data || response.data || [];
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch parts"
      );
    }
  }
);

const partsSlice = createSlice({
  name: "parts",
  initialState,
  reducers: {
    resetPartsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParts.fulfilled, (state, action) => {
        state.loading = false;
        state.parts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchParts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetPartsError } = partsSlice.actions;
export default partsSlice.reducer;

