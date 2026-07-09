import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Target } from '@/types/core';

export const useTargets = (projectId?: string) => {
  return useQuery<Target[]>({
    queryKey: ['targets', { projectId }],
    queryFn: async () => {
      const url = projectId ? `/targets?projectId=${projectId}` : '/targets';
      const { data } = await api.get(url);
      return data;
    },
  });
};

export const useTarget = (id: string) => {
  return useQuery<Target>({
    queryKey: ['target', id],
    queryFn: async () => {
      const { data } = await api.get(`/targets/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateTarget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTarget: Partial<Target>) => {
      const { data } = await api.post('/targets', newTarget);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });
};

export const useUpdateTarget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Target> & { id: string }) => {
      const { data } = await api.put(`/targets/${id}`, updateData);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['target', variables.id] });
    },
  });
};

export const useDeleteTarget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/targets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });
};

export const useArchiveTarget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isArchived }: { id: string; isArchived: boolean }) => {
      const { data } = await api.patch(`/targets/${id}/archive`, { isArchived });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['target', variables.id] });
    },
  });
};
