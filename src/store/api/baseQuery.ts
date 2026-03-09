import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { tokenStorage } from '../../utils/tokenStorage';
import { clearAuth, setAccessToken } from '../authSlice';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: async (headers) => {
    const token = await tokenStorage.getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = await tokenStorage.getRefreshToken();

    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const { accessToken } = refreshResult.data as { accessToken: string };
        await tokenStorage.saveTokens(accessToken, refreshToken);
        api.dispatch(setAccessToken(accessToken));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        await tokenStorage.clearTokens();
        api.dispatch(clearAuth());
      }
    } else {
      await tokenStorage.clearTokens();
      api.dispatch(clearAuth());
    }
  }

  return result;
};
