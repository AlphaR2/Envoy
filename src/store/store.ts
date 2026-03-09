import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import walletReducer from './walletSlice';
import { authApi } from './api/authApi';
import { usersApi } from './api/usersApi';
import { agentsApi } from './api/agentsApi';
import { bountiesApi } from './api/bountiesApi';
import { reputationApi } from './api/reputationApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [agentsApi.reducerPath]: agentsApi.reducer,
    [bountiesApi.reducerPath]: bountiesApi.reducer,
    [reputationApi.reducerPath]: reputationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      usersApi.middleware,
      agentsApi.middleware,
      bountiesApi.middleware,
      reputationApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
