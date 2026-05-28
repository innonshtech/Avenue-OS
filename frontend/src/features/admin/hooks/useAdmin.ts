import { useQuery } from '@tanstack/react-query';
import * as adminApi from '../api/adminApi';

export const useAdminOverview = () => {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: adminApi.getOverview,
  });
};

export const useAdminProjects = () => {
  return useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: adminApi.getProjects,
  });
};

export const useAdminSprints = () => {
  return useQuery({
    queryKey: ['admin', 'sprints'],
    queryFn: adminApi.getSprints,
  });
};

export const useTeamPerformance = () => {
  return useQuery({
    queryKey: ['admin', 'teamPerformance'],
    queryFn: adminApi.getTeamPerformance,
  });
};

export const useWorkload = () => {
  return useQuery({
    queryKey: ['admin', 'workload'],
    queryFn: adminApi.getWorkload,
  });
};

export const useAdminBlockers = () => {
  return useQuery({
    queryKey: ['admin', 'blockers'],
    queryFn: adminApi.getBlockers,
  });
};

export const useActivityFeed = () => {
  return useQuery({
    queryKey: ['admin', 'activityFeed'],
    queryFn: adminApi.getActivityFeed,
  });
};

export const useAuditLogs = () => {
  return useQuery({
    queryKey: ['admin', 'auditLogs'],
    queryFn: adminApi.getAuditLogs,
  });
};

export const useIntelligence = () => {
  return useQuery({
    queryKey: ['admin', 'intelligence'],
    queryFn: adminApi.getIntelligence,
  });
};

export const useSecurityMetrics = () => {
  return useQuery({
    queryKey: ['admin', 'securityMetrics'],
    queryFn: adminApi.getSecurityMetrics,
  });
};
