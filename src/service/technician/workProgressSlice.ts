import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../constants/axiosConfig";
import {
  TECHNICIAN_PROGRESS_CREATE_ENDPOINT,
  WORK_PROGRESS_LIST_ENDPOINT,
  WORK_PROGRESS_DETAIL_ENDPOINT,
  WORK_PROGRESS_PROCESS_PAYMENT_ENDPOINT,
  APPOINTMENT_PROGRESS_ENDPOINT,
  TECHNICIAN_PROGRESS_INSPECTION_QUOTE_ENDPOINT,
  TECHNICIAN_PROGRESS_START_MAINTENANCE_ENDPOINT,
  TECHNICIAN_PROGRESS_COMPLETE_MAINTENANCE_ENDPOINT,
} from "../constants/apiConfig";

type WorkProgress = any;

interface WorkProgressState {
  byAppointment: Record<string, WorkProgress | undefined>;
  workProgressList: WorkProgress[];
  selectedWorkProgress: WorkProgress | null;
  listLoading: boolean;
  detailLoading: boolean;
  processPaymentLoading: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: WorkProgressState = {
  byAppointment: {},
  workProgressList: [],
  selectedWorkProgress: null,
  listLoading: false,
  detailLoading: false,
  processPaymentLoading: false,
  loading: false,
  error: null,
};

export const fetchWorkProgressList = createAsyncThunk(
  "workProgress/fetchList",
  async (
    params: { currentStatus?: string; serviceDate?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.currentStatus)
        queryParams.append("currentStatus", params.currentStatus);
      if (params.serviceDate)
        queryParams.append("serviceDate", params.serviceDate);
      const url = queryParams.toString()
        ? `${WORK_PROGRESS_LIST_ENDPOINT}?${queryParams.toString()}`
        : WORK_PROGRESS_LIST_ENDPOINT;
      const res = await axiosInstance.get(url);
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to fetch work progress list"
      );
    }
  }
);

export const fetchWorkProgressDetail = createAsyncThunk(
  "workProgress/fetchDetail",
  async (workProgressId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        WORK_PROGRESS_DETAIL_ENDPOINT(workProgressId)
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to fetch work progress detail"
      );
    }
  }
);

export const processPayment = createAsyncThunk(
  "workProgress/processPayment",
  async (
    params: { workProgressId: string; payload: any },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.post(
        WORK_PROGRESS_PROCESS_PAYMENT_ENDPOINT(params.workProgressId),
        params.payload
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to process payment"
      );
    }
  }
);

export const createWorkProgress = createAsyncThunk(
  "workProgress/create",
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        TECHNICIAN_PROGRESS_CREATE_ENDPOINT,
        payload
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to create progress"
      );
    }
  }
);

export const getProgressByAppointment = createAsyncThunk(
  "workProgress/getByAppointment",
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        APPOINTMENT_PROGRESS_ENDPOINT(appointmentId)
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to fetch progress"
      );
    }
  }
);

export const submitInspectionQuote = createAsyncThunk(
  "workProgress/inspectionQuote",
  async (params: { progressId: string; payload: any }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        TECHNICIAN_PROGRESS_INSPECTION_QUOTE_ENDPOINT(params.progressId),
        params.payload
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to submit quote"
      );
    }
  }
);

export const startMaintenance = createAsyncThunk(
  "workProgress/startMaintenance",
  async (progressId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        TECHNICIAN_PROGRESS_START_MAINTENANCE_ENDPOINT(progressId)
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to start maintenance"
      );
    }
  }
);

export const completeMaintenance = createAsyncThunk(
  "workProgress/completeMaintenance",
  async (params: { progressId: string; payload: any }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        TECHNICIAN_PROGRESS_COMPLETE_MAINTENANCE_ENDPOINT(params.progressId),
        params.payload
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to complete maintenance"
      );
    }
  }
);

const workProgressSlice = createSlice({
  name: "workProgress",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkProgressList.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkProgressList.fulfilled, (state, action) => {
        state.listLoading = false;
        if (action.payload?.success)
          state.workProgressList = action.payload.data;
      })
      .addCase(fetchWorkProgressList.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWorkProgressDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkProgressDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        if (action.payload?.success)
          state.selectedWorkProgress = action.payload.data;
      })
      .addCase(fetchWorkProgressDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      })
      .addCase(processPayment.pending, (state) => {
        state.processPaymentLoading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.processPaymentLoading = false;
        if (action.payload?.success) {
          const updated = action.payload.data;
          const idx = state.workProgressList.findIndex(
            (wp) => wp._id === updated._id
          );
          if (idx !== -1) state.workProgressList[idx] = updated;
          const apptId =
            typeof updated.appointmentId === "string"
              ? updated.appointmentId
              : updated.appointmentId?._id;
          if (apptId) state.byAppointment[apptId] = updated;
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.processPaymentLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createWorkProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkProgress.fulfilled, (state, action) => {
        state.loading = false;
        const wp = action.payload?.data;
        const apptId =
          typeof wp?.appointmentId === "string"
            ? wp.appointmentId
            : wp?.appointmentId?._id;
        if (apptId) state.byAppointment[apptId] = wp;
      })
      .addCase(createWorkProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getProgressByAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProgressByAppointment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.success) {
          const wp = action.payload.data;
          const apptId =
            typeof wp?.appointmentId === "string"
              ? wp.appointmentId
              : wp?.appointmentId?._id;
          if (apptId) state.byAppointment[apptId] = wp;
        }
      })
      .addCase(getProgressByAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(submitInspectionQuote.fulfilled, (state, action) => {
        if (action.payload?.success) {
          const wp = action.payload.data;
          const apptId =
            typeof wp?.appointmentId === "string"
              ? wp.appointmentId
              : wp?.appointmentId?._id;
          if (apptId) state.byAppointment[apptId] = wp;
        }
      })
      .addCase(startMaintenance.fulfilled, (state, action) => {
        if (action.payload?.success) {
          const wp = action.payload.data;
          const apptId =
            typeof wp?.appointmentId === "string"
              ? wp.appointmentId
              : wp?.appointmentId?._id;
          if (apptId) state.byAppointment[apptId] = wp;
        }
      })
      .addCase(completeMaintenance.fulfilled, (state, action) => {
        if (action.payload?.success) {
          const wp = action.payload.data;
          const apptId =
            typeof wp?.appointmentId === "string"
              ? wp.appointmentId
              : wp?.appointmentId?._id;
          if (apptId) state.byAppointment[apptId] = wp;
        }
      });
  },
});

export default workProgressSlice.reducer;
