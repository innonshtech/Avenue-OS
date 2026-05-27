import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ActivityLog {
  id: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  metadata?: any;
  createdAt: string;
  user: {
    name: string;
    avatar: string | null;
    email: string;
    role: string;
  };
}

export const useActivities = (filters?: { actionType?: string; memberId?: string; entityType?: string }) => {
  return useQuery<ActivityLog[]>({
    queryKey: ['activities', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.actionType) params.append('actionType', filters.actionType);
      if (filters?.memberId) params.append('memberId', filters.memberId);
      if (filters?.entityType) params.append('entityType', filters.entityType);
      
      const url = `/activities${params.toString() ? `?${params.toString()}` : ''}`;
      const { data } = await api.get(url);
      return data;
    },
  });
};
