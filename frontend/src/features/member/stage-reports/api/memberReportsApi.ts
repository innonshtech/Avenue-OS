import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useMemberStageSummary = (stageId?: string) => {
  return useQuery({
    queryKey: ['member-stage-summary', stageId],
    queryFn: async () => {
      const url = stageId ? `/member-reports/sprint-summary?stageId=${stageId}` : '/member-reports/sprint-summary';
      const { data } = await api.get(url);
      return data;
    }
  });
};

export const useCompletedTasks = (stageId?: string) => {
  return useQuery({
    queryKey: ['member-completed-tasks', stageId],
    queryFn: async () => {
      const url = stageId ? `/member-reports/completed-tasks?stageId=${stageId}` : '/member-reports/completed-tasks';
      const { data } = await api.get(url);
      return data;
    }
  });
};

export const usePendingTasks = (stageId?: string) => {
  return useQuery({
    queryKey: ['member-pending-tasks', stageId],
    queryFn: async () => {
      const url = stageId ? `/member-reports/pending-tasks?stageId=${stageId}` : '/member-reports/pending-tasks';
      const { data } = await api.get(url);
      return data;
    }
  });
};

export const useMemberBlockers = (stageId?: string) => {
  return useQuery({
    queryKey: ['member-blockers', stageId],
    queryFn: async () => {
      const url = stageId ? `/member-reports/blockers?stageId=${stageId}` : '/member-reports/blockers';
      const { data } = await api.get(url);
      return data;
    }
  });
};

export const useMemberProductivity = (stageId?: string) => {
  return useQuery({
    queryKey: ['member-productivity', stageId],
    queryFn: async () => {
      const url = stageId ? `/member-reports/productivity?stageId=${stageId}` : '/member-reports/productivity';
      const { data } = await api.get(url);
      return data;
    }
  });
};
