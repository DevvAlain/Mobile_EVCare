import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../constants/axiosConfig";
import {
  TECHNICIAN_SCHEDULES_BY_TECHNICIAN_ENDPOINT,
  TECHNICIAN_CHECK_IN_ENDPOINT,
  TECHNICIAN_CHECK_OUT_ENDPOINT,
} from "../constants/apiConfig";
import {
  TECHNICIAN_SCHEDULE_CREATE_ENDPOINT,
  TECHNICIAN_SCHEDULE_CREATE_DEFAULT_ENDPOINT,
  TECHNICIAN_SCHEDULE_LIST_ENDPOINT,
  TECHNICIAN_SCHEDULE_BY_CENTER_ENDPOINT,
  TECHNICIAN_SCHEDULE_UPDATE_ENDPOINT,
  TECHNICIAN_SCHEDULE_DELETE_ENDPOINT,
  TECHNICIAN_SCHEDULE_ADD_APPOINTMENT_ENDPOINT,
  TECHNICIAN_STAFF_BY_CENTER_ENDPOINT,
  AVAILABLE_TECHNICIANS_ENDPOINT,
} from "../constants/apiConfig";
import { RootState } from "../store";

type TechnicianSchedule = any; // lightweight typing for mobile; can be refined later

interface TechnicianState {
  schedules: TechnicianSchedule[];
  fetchSchedulesLoading: boolean;
  checkInLoading: boolean;
  checkOutLoading: boolean;
  error: string | null;
}

const initialState: TechnicianState = {
  schedules: [],
  fetchSchedulesLoading: false,
  checkInLoading: false,
  checkOutLoading: false,
  error: null,
};

export const fetchTechnicianSchedulesById = createAsyncThunk<
  { data: TechnicianSchedule[] },
  { technicianId: string; startDate?: string; endDate?: string },
  { rejectValue: string }
>(
  "technician/fetchTechnicianSchedulesById",
  async (params, { rejectWithValue }) => {
    try {
      const { technicianId, startDate, endDate } = params;
      const response = await axiosInstance.get(
        TECHNICIAN_SCHEDULES_BY_TECHNICIAN_ENDPOINT(technicianId),
        { params: { startDate, endDate } }
      );
      return response.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to fetch schedules"
      );
    }
  }
);

export const createSingleSchedule = createAsyncThunk<
  { data: TechnicianSchedule },
  any,
  { rejectValue: string }
>("technician/createSingleSchedule", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(
      TECHNICIAN_SCHEDULE_CREATE_ENDPOINT,
      payload
    );
    return res.data;
  } catch (err: unknown) {
    const e = err as any;
    return rejectWithValue(
      e?.response?.data?.message || "Failed to create schedule"
    );
  }
});

export const createDefaultSchedules = createAsyncThunk<
  { data: TechnicianSchedule[] },
  any,
  { rejectValue: string }
>("technician/createDefaultSchedules", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(
      TECHNICIAN_SCHEDULE_CREATE_DEFAULT_ENDPOINT,
      payload
    );
    return res.data;
  } catch (err: unknown) {
    const e = err as any;
    return rejectWithValue(
      e?.response?.data?.message || "Failed to create default schedules"
    );
  }
});

export const fetchTechnicianSchedules = createAsyncThunk<
  {
    data:
      | TechnicianSchedule[]
      | { schedules: TechnicianSchedule[]; pagination?: any };
  },
  Record<string, any>,
  { rejectValue: string }
>(
  "technician/fetchTechnicianSchedules",
  async (params, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(TECHNICIAN_SCHEDULE_LIST_ENDPOINT, {
        params,
      });
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to fetch technician schedules"
      );
    }
  }
);

export const fetchTechnicianSchedulesByCenter = createAsyncThunk<
  { data: TechnicianSchedule[] },
  { centerId: string; workDate?: string },
  { rejectValue: string }
>(
  "technician/fetchTechnicianSchedulesByCenter",
  async (params, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        TECHNICIAN_SCHEDULE_BY_CENTER_ENDPOINT,
        { params }
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to fetch schedules by center"
      );
    }
  }
);

export const fetchTechnicianStaff = createAsyncThunk<
  { data: any[] },
  string,
  { rejectValue: string }
>("technician/fetchTechnicianStaff", async (centerId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(
      TECHNICIAN_STAFF_BY_CENTER_ENDPOINT(centerId)
    );
    return res.data;
  } catch (err: unknown) {
    const e = err as any;
    return rejectWithValue(
      e?.response?.data?.message || "Failed to fetch technician staff"
    );
  }
});

export const fetchAvailableTechnicians = createAsyncThunk<
  { data: any[] },
  { centerId: string; date: string; timeSlot: string },
  { rejectValue: string }
>(
  "technician/fetchAvailableTechnicians",
  async (params, { rejectWithValue }) => {
    try {
      const { centerId, date, timeSlot } = params;
      const res = await axiosInstance.get(
        AVAILABLE_TECHNICIANS_ENDPOINT(centerId),
        { params: { date, timeSlot } }
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to fetch available technicians"
      );
    }
  }
);

export const updateSchedule = createAsyncThunk<
  { data: TechnicianSchedule },
  any,
  { rejectValue: string }
>("technician/updateSchedule", async (payload, { rejectWithValue }) => {
  try {
    const { _id, ...updateData } = payload;
    const res = await axiosInstance.put(
      TECHNICIAN_SCHEDULE_UPDATE_ENDPOINT(_id),
      updateData
    );
    return res.data;
  } catch (err: unknown) {
    const e = err as any;
    return rejectWithValue(
      e?.response?.data?.message || "Failed to update schedule"
    );
  }
});

export const deleteSchedule = createAsyncThunk<
  { data: any },
  string,
  { rejectValue: string }
>("technician/deleteSchedule", async (scheduleId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.delete(
      TECHNICIAN_SCHEDULE_DELETE_ENDPOINT(scheduleId)
    );
    return res.data;
  } catch (err: unknown) {
    const e = err as any;
    return rejectWithValue(
      e?.response?.data?.message || "Failed to delete schedule"
    );
  }
});

export const addAppointmentToSchedule = createAsyncThunk<
  { data: TechnicianSchedule },
  { scheduleId: string; appointmentId: string },
  { rejectValue: string }
>(
  "technician/addAppointmentToSchedule",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        TECHNICIAN_SCHEDULE_ADD_APPOINTMENT_ENDPOINT(payload.scheduleId),
        { appointmentId: payload.appointmentId }
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      return rejectWithValue(
        e?.response?.data?.message || "Failed to assign appointment to schedule"
      );
    }
  }
);

export const checkInTechnician = createAsyncThunk<
  { data: TechnicianSchedule },
  string,
  { rejectValue: string }
>("technician/checkInTechnician", async (scheduleId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      TECHNICIAN_CHECK_IN_ENDPOINT(scheduleId)
    );
    return response.data;
  } catch (err: unknown) {
    const e = err as any;
    return rejectWithValue(e?.response?.data?.message || "Failed to check in");
  }
});

export const checkOutTechnician = createAsyncThunk<
  { data: TechnicianSchedule },
  string,
  { rejectValue: string }
>("technician/checkOutTechnician", async (scheduleId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      TECHNICIAN_CHECK_OUT_ENDPOINT(scheduleId)
    );
    return response.data;
  } catch (err: unknown) {
    const e = err as any;
    return rejectWithValue(e?.response?.data?.message || "Failed to check out");
  }
});

const technicianSlice = createSlice({
  name: "technician",
  initialState,
  reducers: {
    clearTechnicianError: (state) => {
      state.error = null;
    },
    clearSchedules: (state) => {
      state.schedules = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTechnicianSchedulesById.pending, (state) => {
        state.fetchSchedulesLoading = true;
        state.error = null;
      })
      .addCase(fetchTechnicianSchedulesById.fulfilled, (state, action) => {
        state.fetchSchedulesLoading = false;
        state.schedules = Array.isArray(action.payload.data)
          ? action.payload.data
          : [];
      })
      .addCase(fetchTechnicianSchedulesById.rejected, (state, action) => {
        state.fetchSchedulesLoading = false;
        state.error = action.payload || "Failed to fetch schedules";
      })
      .addCase(checkInTechnician.pending, (state) => {
        state.checkInLoading = true;
        state.error = null;
      })
      .addCase(checkInTechnician.fulfilled, (state, action) => {
        state.checkInLoading = false;
        const updated = action.payload.data;
        const idx = state.schedules.findIndex((s) => s._id === updated._id);
        if (idx !== -1) state.schedules[idx] = updated;
      })
      .addCase(checkInTechnician.rejected, (state, action) => {
        state.checkInLoading = false;
        state.error = action.payload || "Check in failed";
      })
      .addCase(checkOutTechnician.pending, (state) => {
        state.checkOutLoading = true;
        state.error = null;
      })
      .addCase(checkOutTechnician.fulfilled, (state, action) => {
        state.checkOutLoading = false;
        const updated = action.payload.data;
        const idx = state.schedules.findIndex((s) => s._id === updated._id);
        if (idx !== -1) state.schedules[idx] = updated;
      })
      .addCase(checkOutTechnician.rejected, (state, action) => {
        state.checkOutLoading = false;
        state.error = action.payload || "Check out failed";
      });
  },
});

export const { clearTechnicianError, clearSchedules } = technicianSlice.actions;
export default technicianSlice.reducer;

// Selector helpers
export const selectTechnicianState = (state: RootState) =>
  state.technician as unknown as TechnicianState;
