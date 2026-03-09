import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { User, UpdateUserBody } from '../../types/api';
import { setAuth, setUser } from '../authSlice';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({

    getMe: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: user } = await queryFulfilled;
          const authState = (getState() as any).auth;
          if (authState.isAuthenticated) {
            dispatch(setUser(user));
          } else if (authState.accessToken) {
            // Rehydration path: token restored but setAuth not yet called
            dispatch(setAuth({ pubkey: user.pubkey, accessToken: authState.accessToken, user }));
          }
        } catch {
          // error handled upstream by baseQueryWithReauth
        }
      },
    }),

    updateMe: builder.mutation<User, UpdateUserBody>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),

  }),
});

export const { useGetMeQuery, useLazyGetMeQuery, useUpdateMeMutation } = usersApi;
