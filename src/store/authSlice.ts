import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types/api';

interface AuthState {
  pubkey: string | null;
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  pubkey: null,
  accessToken: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ pubkey: string; accessToken: string; user: User }>) {
      state.pubkey = action.payload.pubkey;
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.pubkey = null;
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAuth, setAccessToken, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
