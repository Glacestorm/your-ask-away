import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache retention
      refetchOnWindowFocus: false, // Disable auto-refetch on focus
      retry: 2, // Retry failed requests twice
      refetchOnReconnect: true, // Refetch when connection restored
    },
    mutations: {
      retry: 1,
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
};
