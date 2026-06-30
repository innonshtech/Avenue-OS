import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ProgressReport } from '@/types/core';

export const useProgressReports = (filters?: { stageId?: string; userId?: string }) => {
  return useQuery<ProgressReport[]>({
    queryKey: ['progress-reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.stageId) params.append('stageId', filters.stageId);
      if (filters?.userId) params.append('userId', filters.userId);
      
      const url = `/progress-reports${params.toString() ? `?${params.toString()}` : ''}`;
      const { data } = await api.get(url);
      return data;
    },
  });
};

export const useMyProgressReports = (stageId?: string, options?: { enabled?: boolean }) => {
  return useQuery<ProgressReport[]>({
    queryKey: ['my-progress-reports', stageId],
    queryFn: async () => {
      const url = stageId ? `/progress-reports/me?stageId=${stageId}` : `/progress-reports/me`;
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

export const useTeamProgressReports = (stageId?: string, options?: { enabled?: boolean }) => {
  return useQuery<ProgressReport[]>({
    queryKey: ['team-progress-reports', stageId],
    queryFn: async () => {
      const url = stageId ? `/progress-reports/team?stageId=${stageId}` : `/progress-reports/team`;
      const { data } = await api.get(url);
      return data;
    },
    enabled: options?.enabled,
  });
};
