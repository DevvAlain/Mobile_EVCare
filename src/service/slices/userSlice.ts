import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  users: [],
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(
        (user) => user.id === action.payload.id
      );
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.currentUser?.id === action.payload.id) {
        state.currentUser = action.payload;
      }
    },
    removeUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
      if (state.currentUser?.id === action.payload) {
        state.currentUser = null;
        state.isAuthenticated = false;
      }
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCurrentUser, addUser, updateUser, removeUser, logout } =
  userSlice.actions;
export default userSlice.reducer;
