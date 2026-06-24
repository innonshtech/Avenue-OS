import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useMemberOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'member-overview'],
    queryFn: async () => {
      const response = await api.get('/dashboard/member-overview');
      return response.data;
    },
    refetchInterval: 60000,
  });
};

export const useMemberSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'member-summary'],
    queryFn: async () => {
      const response = await api.get('/dashboard/member-summary');
      return response.data;
    },
    refetchInterval: 60000,
  });
};

export const useTodayFocus = () => {
  return useQuery({
    queryKey: ['dashboard', 'focus'],
    queryFn: async () => {
      const response = await api.get('/focus');
      return response.data;
    },
  });
};

export const useUpdateTodayFocus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, content }: { id?: string; content: string }) => {
      if (id) {
        const response = await api.put(`/focus/${id}`, { content });
        return response.data;
      } else {
        const response = await api.post('/focus', { content });
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'focus'] });
    },
  });
};

export const useMyTasks = () => {
  return useQuery({
    queryKey: ['tasks', 'my-tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/my-tasks');
      return response.data;
    },
    refetchInterval: 60000,
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.put(`/tasks/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'member-overview'] });
    },
  });
};

export const useAddBlocker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.post(`/tasks/${id}/blocker`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'member-overview'] });
    },
  });
};

export const useAddQuickUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updateText }: { id: string; updateText: string }) => {
      const response = await api.post(`/tasks/${id}/update`, { updateText });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useMyLatestStandup = () => {
  return useQuery({
    queryKey: ['standups', 'my-latest'],
    queryFn: async () => {
      const response = await api.get('/standups/my-latest');
      return response.data;
    },
  });
};

export const useSubmitQuickStandup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/standups', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standups', 'my-latest'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'standup-monitoring'] }); // Also invalidate PM's view
    },
  });
};
