import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance } from "../constants/axiosConfig";
import { User, UpdateProfileData } from "../../types";

interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("user/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get("/user/profile");
    return response.data.user as User;
  } catch (err: unknown) {
    const error = err as any;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Lấy thông tin người dùng thất bại";
    return rejectWithValue(message);
  }
});

export const updateUserProfile = createAsyncThunk<
  User,
  UpdateProfileData,
  { rejectValue: string }
>("user/updateProfile", async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put("/user/profile", data);
    return response.data.user as User;
  } catch (err: unknown) {
    const error = err as any;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Cập nhật thông tin thất bại";
    return rejectWithValue(message);
  }
});

export const uploadAvatar = createAsyncThunk<
  User,
  { uri: string; name?: string; type?: string },
  { rejectValue: string }
>("user/uploadAvatar", async (fileData, { rejectWithValue }) => {
  try {
    const form = new FormData();
    // @ts-ignore
    form.append("avatar", {
      uri: fileData.uri,
      name: fileData.name || "avatar.jpg",
      type: fileData.type || "image/jpeg",
    });

    const response = await axiosInstance.post("/user/upload-avatar", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.user as User;
  } catch (err: unknown) {
    const error = err as any;
    const message =
      error.response?.data?.message || error.message || "Tải ảnh thất bại";
    return rejectWithValue(message);
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lấy thông tin thất bại";
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Cập nhật thất bại";
      })
      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Tải avatar thất bại";
      });
  },
});

export const { setCurrentUser, clearError } = userSlice.actions;
export default userSlice.reducer;
