import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import {
  Bounty,
  BountyRegistration,
  DispatchedBounty,
  Submission,
  CreateBountyBody,
  CreateBountyResp,
  SelectWinnerResp,
  ClaimRefundResp,
  ConfirmBountyResp,
} from '../../types/api';

export const bountiesApi = createApi({
  reducerPath: 'bountiesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Bounty', 'Submissions', 'MyRegistrations'],
  endpoints: (builder) => ({

    createBounty: builder.mutation<CreateBountyResp, CreateBountyBody>({
      query: (body) => ({ url: '/bounties', method: 'POST', body }),
      // Don't invalidate yet — bounty isn't active until confirmed
    }),

    confirmBounty: builder.mutation<ConfirmBountyResp, { bountyId: string; signature: string }>({
      query: ({ bountyId, signature }) => ({
        url: `/bounties/${bountyId}/confirm`,
        method: 'POST',
        body: { signature },
      }),
      invalidatesTags: (_, __, { bountyId }) => ['Bounty', { type: 'Bounty', id: bountyId }],
    }),

    browseBounties: builder.query<Bounty[], { category?: string; state?: string; sort?: string }>({
      query: (params) => ({ url: '/bounties', params }),
      providesTags: ['Bounty'],
      keepUnusedDataFor: 300,
    }),

    getBounty: builder.query<Bounty, string>({
      query: (id) => `/bounties/${id}`,
      providesTags: (_, __, id) => [{ type: 'Bounty', id }],
    }),

    getDispatchedBounties: builder.query<DispatchedBounty[], void>({
      query: () => '/bounties/dispatched',
      providesTags: ['MyRegistrations'],
    }),

    getMyRegistration: builder.query<BountyRegistration | null, string>({
      query: (bountyId) => `/bounties/${bountyId}/my-registration`,
      providesTags: (_, __, bountyId) => [{ type: 'MyRegistrations', id: bountyId }],
    }),

    registerAgentForBounty: builder.mutation<BountyRegistration, { bountyId: string; agentId: string }>({
      query: ({ bountyId, agentId }) => ({
        url: `/bounties/${bountyId}/register`,
        method: 'POST',
        body: { agentId },
      }),
      invalidatesTags: (_, __, { bountyId }) => [
        { type: 'Bounty', id: bountyId },
        { type: 'MyRegistrations', id: bountyId },
      ],
    }),

    deregisterAgent: builder.mutation<void, { bountyId: string; agentId: string }>({
      query: ({ bountyId, agentId }) => ({
        url: `/bounties/${bountyId}/register/${agentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, { bountyId }) => [
        { type: 'Bounty', id: bountyId },
        { type: 'MyRegistrations', id: bountyId },
      ],
    }),

    retryDispatch: builder.mutation<{ queued: boolean }, { bountyId: string; registrationId: string }>({
      query: ({ bountyId, registrationId }) => ({
        url: `/bounties/${bountyId}/retry-dispatch/${registrationId}`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, { bountyId }) => [{ type: 'MyRegistrations', id: bountyId }],
    }),

    getSubmissions: builder.query<Submission[], string>({
      query: (bountyId) => `/bounties/${bountyId}/submissions`,
      providesTags: (_, __, bountyId) => [{ type: 'Submissions', id: bountyId }],
    }),

    selectWinner: builder.mutation<SelectWinnerResp, { bountyId: string; winnerAgentId: string }>({
      query: ({ bountyId, winnerAgentId }) => ({
        url: `/bounties/${bountyId}/winner`,
        method: 'POST',
        body: { winnerAgentId },
      }),
    }),

    claimRefund: builder.mutation<ClaimRefundResp, string>({
      query: (bountyId) => ({ url: `/bounties/${bountyId}/claim-refund`, method: 'POST' }),
    }),

  }),
});

export const {
  useCreateBountyMutation,
  useConfirmBountyMutation,
  useBrowseBountiesQuery,
  useGetBountyQuery,
  useLazyGetBountyQuery,
  useGetDispatchedBountiesQuery,
  useGetMyRegistrationQuery,
  useRegisterAgentForBountyMutation,
  useDeregisterAgentMutation,
  useRetryDispatchMutation,
  useGetSubmissionsQuery,
  useSelectWinnerMutation,
  useClaimRefundMutation,
} = bountiesApi;
