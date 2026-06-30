import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Stage } from '@/types/core';

export const useStages = (projectId?: string) => {
  return useQuery<Stage[]>({
    queryKey: ['stages', { projectId }],
    queryFn: async () => {
      const url = projectId ? `/stages?projectId=${projectId}` : '/stages';
      const { data } = await api.get(url);
      return data;
    },
  });
};

export const useStage = (id: string) => {
  return useQuery<Stage>({
    queryKey: ['stage', id],
    queryFn: async () => {
      const { data } = await api.get(`/stages/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newStage: Partial<Stage>) => {
      const { data } = await api.post('/stages', newStage);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
    },
  });
};

export const useUpdateStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Stage> & { id: string }) => {
      const { data } = await api.put(`/stages/${id}`, updateData);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['stage', variables.id] });
    },
  });
};

export const useDeleteStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/stages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
    },
  });
};

export const useArchiveStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isArchived }: { id: string; isArchived: boolean }) => {
      const { data } = await api.patch(`/stages/${id}/archive`, { isArchived });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['stage', variables.id] });
    },
  });
};
