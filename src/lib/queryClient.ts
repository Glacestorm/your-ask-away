import { QueryClient, QueryFunction, QueryKey } from '@tanstack/react-query';

// Optimized query function with request deduplication
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  // This is a fallback - most queries will have their own queryFn
  throw new Error(`Missing queryFn for key: ${JSON.stringify(queryKey)}`);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache retention (formerly cacheTime)
      refetchOnWindowFocus: false, // Disable auto-refetch on focus
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnReconnect: true, // Refetch when connection restored
      refetchOnMount: 'always', // Always check freshness on mount
      networkMode: 'offlineFirst', // Better offline support
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

// Query key factories for consistent cache management
export const queryKeys = {
  companies: {
    all: ['companies'] as const,
    list: (filters: Record<string, unknown>) => ['companies', 'list', filters] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
    photos: (id: string) => ['companies', 'photos', id] as const,
  },
  visits: {
    all: ['visits'] as const,
    list: (filters: Record<string, unknown>) => ['visits', 'list', filters] as const,
    detail: (id: string) => ['visits', 'detail', id] as const,
    byCompany: (companyId: string) => ['visits', 'company', companyId] as const,
  },
  visitSheets: {
    all: ['visit-sheets'] as const,
    list: (filters: Record<string, unknown>) => ['visit-sheets', 'list', filters] as const,
    detail: (id: string) => ['visit-sheets', 'detail', id] as const,
    byCompany: (companyId: string) => ['visit-sheets', 'company', companyId] as const,
  },
  goals: {
    all: ['goals'] as const,
    list: (filters: Record<string, unknown>) => ['goals', 'list', filters] as const,
    detail: (id: string) => ['goals', 'detail', id] as const,
    byUser: (userId: string) => ['goals', 'user', userId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unread: (userId: string) => ['notifications', 'unread', userId] as const,
  },
  profiles: {
    all: ['profiles'] as const,
    detail: (id: string) => ['profiles', 'detail', id] as const,
    gestores: (office?: string) => ['profiles', 'gestores', office] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    active: ['alerts', 'active'] as const,
  },
  accounting: {
    all: ['accounting'] as const,
    statements: (companyId: string) => ['accounting', 'statements', companyId] as const,
    balance: (statementId: string) => ['accounting', 'balance', statementId] as const,
  },
  stressTests: {
    all: ['stress-tests'] as const,
    simulations: ['stress-tests', 'simulations'] as const,
    executions: (simulationId: string) => ['stress-tests', 'executions', simulationId] as const,
  },
} as const;

// Invalidation helpers
export const invalidateRelatedQueries = {
  onVisitChange: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
  },
  onVisitSheetChange: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.visitSheets.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
  },
  onCompanyChange: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
  },
  onGoalChange: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
  },
  onNotificationChange: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  },
  onAccountingChange: (companyId?: string) => {
    if (companyId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.statements(companyId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.all });
    }
  },
  onStressTestChange: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stressTests.all });
  },
};

// Prefetch helpers for improved perceived performance
export const prefetchQueries = {
  // Prefetch critical data on app load
  prefetchDashboardData: async (userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.notifications.unread(userId),
        staleTime: 2 * 60 * 1000, // 2 minutes for notifications
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.goals.byUser(userId),
        staleTime: 5 * 60 * 1000,
      }),
    ]);
  },
  
  // Prefetch company details on hover
  prefetchCompanyDetails: async (companyId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.companies.detail(companyId),
      staleTime: 10 * 60 * 1000, // 10 minutes for company details
    });
  },
};

// Optimistic update helpers
export const optimisticUpdates = {
  // Optimistic update for visit creation
  addVisitOptimistically: <T extends { id: string }>(
    queryKey: QueryKey,
    newItem: T
  ) => {
    queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
      return old ? [...old, newItem] : [newItem];
    });
  },
  
  // Rollback helper
  rollbackOptimisticUpdate: <T>(queryKey: QueryKey, previousData: T) => {
    queryClient.setQueryData(queryKey, previousData);
  },
};
