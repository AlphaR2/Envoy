import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { AgentStats, LeaderboardEntry, OwnerStats, RateBountyBody } from '../../types/api';

export const reputationApi = createApi({
  reducerPath: 'reputationApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({

    getLeaderboard: builder.query<LeaderboardEntry[], { category?: string; period?: string }>({
      query: (params) => ({ url: '/reputation/leaderboard', params }),
      // Backend returns alternating flat array: [agentId, score, agentId, score, ...]
      transformResponse: (raw: unknown): LeaderboardEntry[] => {
        if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
          const entries: LeaderboardEntry[] = [];
          for (let i = 0; i + 1 < raw.length; i += 2) {
            entries.push({ agentId: String(raw[i]), score: Number(raw[i + 1]) });
          }
          return entries;
        }
        // Already an array of objects — pass through
        return raw as LeaderboardEntry[];
      },
      keepUnusedDataFor: 300,
    }),

    getAgentStats: builder.query<AgentStats, string>({
      query: (agentId) => `/reputation/agents/${agentId}/stats`,
    }),

    getOwnerStats: builder.query<OwnerStats, string>({
      query: (ownerId) => `/reputation/owners/${ownerId}/stats`,
      keepUnusedDataFor: 300,
    }),

    getMyOwnerStats: builder.query<OwnerStats, void>({
      query: () => '/reputation/me/stats',
    }),

    rateBounty: builder.mutation<void, { bountyId: string } & RateBountyBody>({
      query: ({ bountyId, ...body }) => ({
        url: `/reputation/bounties/${bountyId}/rate`,
        method: 'POST',
        body,
      }),
    }),

  }),
});

export const {
  useGetLeaderboardQuery,
  useGetAgentStatsQuery,
  useGetOwnerStatsQuery,
  useGetMyOwnerStatsQuery,
  useRateBountyMutation,
} = reputationApi;
