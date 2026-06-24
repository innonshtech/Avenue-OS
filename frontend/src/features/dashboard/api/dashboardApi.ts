import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useSprintHealth = (sprintId?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'sprint-health', sprintId],
    queryFn: async () => {
      const url = sprintId ? `/dashboard/sprint-health?sprintId=${sprintId}` : '/dashboard/sprint-health';
      const response = await api.get(url);
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useTeamWorkload = (sprintId?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'team-workload', sprintId],
    queryFn: async () => {
      const url = sprintId ? `/dashboard/team-workload?sprintId=${sprintId}` : '/dashboard/team-workload';
      const response = await api.get(url);
      return response.data;
    },
    refetchInterval: 60000,
  });
};

export const useBoardSnapshot = (sprintId?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'board-snapshot', sprintId],
    queryFn: async () => {
      const url = sprintId ? `/dashboard/board-snapshot?sprintId=${sprintId}` : '/dashboard/board-snapshot';
      const response = await api.get(url);
      return response.data;
    },
    refetchInterval: 60000,
  });
};

export const useStandupMonitoring = (sprintId?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'standup-monitoring', sprintId],
    queryFn: async () => {
      const url = sprintId ? `/dashboard/standup-monitoring?sprintId=${sprintId}` : '/dashboard/standup-monitoring';
      const response = await api.get(url);
      return response.data;
    },
    refetchInterval: 60000,
  });
};

export const usePMSummary = (sprintId?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'pm-summary', sprintId],
    queryFn: async () => {
      const url = sprintId ? `/dashboard/pm-summary?sprintId=${sprintId}` : '/dashboard/pm-summary';
      const response = await api.get(url);
      return response.data;
    },
    refetchInterval: 60000,
  });
};
