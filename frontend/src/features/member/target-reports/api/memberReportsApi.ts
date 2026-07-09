import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useMemberTargetSummary = (targetId?: string) => {
  return useQuery({
    queryKey: ['member-target-summary', targetId],
    queryFn: async () => {
      const url = targetId ? `/member-reports/sprint-summary?targetId=${targetId}` : '/member-reports/sprint-summary';
      const { data } = await api.get(url);
      return data;
    }
  });
};

export const useCompletedTasks = (targetId?: string) => {
  return useQuery({
    queryKey: ['member-completed-tasks', targetId],
    queryFn: async () => {
      const url = targetId ? `/member-reports/completed-tasks?targetId=${targetId}` : '/member-reports/completed-tasks';
      const { data } = await api.get(url);
      return data;
    }
  });
};

export const usePendingTasks = (targetId?: string) => {
  return useQuery({
    queryKey: ['member-pending-tasks', targetId],
    queryFn: async () => {
      const url = targetId ? `/member-reports/pending-tasks?targetId=${targetId}` : '/member-reports/pending-tasks';
      const { data } = await api.get(url);
      return data;
    }
  });
};

export const useMemberBlockers = (targetId?: string) => {
  return useQuery({
    queryKey: ['member-blockers', targetId],
    queryFn: async () => {
      const url = targetId ? `/member-reports/blockers?targetId=${targetId}` : '/member-reports/blockers';
      const { data } = await api.get(url);
      return data;
    }
  });
};

export const useMemberProductivity = (targetId?: string) => {
  return useQuery({
    queryKey: ['member-productivity', targetId],
    queryFn: async () => {
      const url = targetId ? `/member-reports/productivity?targetId=${targetId}` : '/member-reports/productivity';
      const { data } = await api.get(url);
      return data;
    }
  });
};
