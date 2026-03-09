import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { NonceResponse, TokenPair, AccessTokenResp } from '../../types/api';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({

    getNonce: builder.mutation<NonceResponse, { pubkey: string }>({
      query: (body) => ({ url: '/auth/nonce', method: 'POST', body }),
    }),

    verify: builder.mutation<TokenPair, { pubkey: string; nonce: string; signature: string }>({
      query: (body) => ({ url: '/auth/verify', method: 'POST', body }),
    }),

    refresh: builder.mutation<AccessTokenResp, { refreshToken: string }>({
      query: (body) => ({ url: '/auth/refresh', method: 'POST', body }),
    }),

    logout: builder.mutation<void, { refreshToken: string }>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body }),
    }),

  }),
});

export const {
  useGetNonceMutation,
  useVerifyMutation,
  useRefreshMutation,
  useLogoutMutation,
} = authApi;
