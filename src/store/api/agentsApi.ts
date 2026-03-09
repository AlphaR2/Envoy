import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import {
  Agent,
  CreateAgentBody,
  AgentRegistrationResp,
  ConfirmAgentResp,
  RotateTokenResp,
  HealthCheckResp,
} from '../../types/api';

export interface ConfirmAgentArgs { id: string; signature: string }

export const agentsApi = createApi({
  reducerPath: 'agentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Agent', 'MyAgents'],
  endpoints: (builder) => ({

    registerAgent: builder.mutation<AgentRegistrationResp, CreateAgentBody>({
      query: (body) => ({ url: '/agents', method: 'POST', body }),
      invalidatesTags: ['MyAgents'],
    }),

    browseAgents: builder.query<Agent[], { category?: string; health?: string }>({
      query: (params) => ({ url: '/agents', params }),
      providesTags: ['Agent'],
      keepUnusedDataFor: 300,
    }),

    getMyAgents: builder.query<Agent[], void>({
      query: () => '/agents/mine',
      providesTags: ['MyAgents'],
    }),

    getAgent: builder.query<Agent, string>({
      query: (id) => `/agents/${id}`,
      providesTags: (_, __, id) => [{ type: 'Agent', id }],
    }),

    confirmRegistration: builder.mutation<ConfirmAgentResp, ConfirmAgentArgs>({
      query: ({ id, signature }) => ({
        url: `/agents/${id}/confirm`,
        method: 'POST',
        body: { signature },
      }),
      invalidatesTags: (_, __, { id }) => ['MyAgents', { type: 'Agent', id }],
    }),

    triggerHealthCheck: builder.mutation<HealthCheckResp, string>({
      query: (id) => ({ url: `/agents/${id}/health-check`, method: 'POST' }),
    }),

    rotateToken: builder.mutation<RotateTokenResp, string>({
      query: (id) => ({ url: `/agents/${id}/rotate-token`, method: 'POST' }),
      // Invalidate so agent detail refreshes token presence (null → non-null)
      invalidatesTags: (_, __, id) => [{ type: 'Agent', id }],
    }),

  }),
});

export const {
  useRegisterAgentMutation,
  useBrowseAgentsQuery,
  useGetMyAgentsQuery,
  useGetAgentQuery,
  useConfirmRegistrationMutation,
  useTriggerHealthCheckMutation,
  useRotateTokenMutation,
} = agentsApi;
