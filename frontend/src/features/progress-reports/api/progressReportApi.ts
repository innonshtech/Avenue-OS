import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ProgressReport } from '@/types/core';

export const useProgressReports = (filters?: { targetId?: string; userId?: string }) => {
  return useQuery<ProgressReport[]>({
    queryKey: ['progress-reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.targetId) params.append('targetId', filters.targetId);
      if (filters?.userId) params.append('userId', filters.userId);
      
      const url = `/progress-reports${params.toString() ? `?${params.toString()}` : ''}`;
      const { data } = await api.get(url);
      return data;
    },
  });
};

export const useMyProgressReports = (targetId?: string, options?: { enabled?: boolean }) => {
  return useQuery<ProgressReport[]>({
    queryKey: ['my-progress-reports', targetId],
    queryFn: async () => {
      const url = targetId ? `/progress-reports/me?targetId=${targetId}` : `/progress-reports/me`;
      const { data } = await api.get(url);
      return data;
    },
    enabled: options?.enabled !== false,
  });
};

export const useCreateProgressReport = (isPM?: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newReport: any) => {
      const { data } = await api.post('/progress-reports', newReport);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-progress-reports'] });
      if (isPM) {
        queryClient.invalidateQueries({ queryKey: ['team-progress-reports'] });
      }
    },
  });
};

export const useTeamProgressReports = (targetId?: string, options?: { enabled?: boolean }) => {
  return useQuery<ProgressReport[]>({
    queryKey: ['team-progress-reports', targetId],
    queryFn: async () => {
      const url = targetId ? `/progress-reports/team?targetId=${targetId}` : `/progress-reports/team`;
      const { data } = await api.get(url);
      return data;
    },
    enabled: options?.enabled,
  });
};
