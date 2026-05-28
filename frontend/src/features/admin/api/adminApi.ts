import api from '../../../lib/api';

export const getOverview = async () => (await api.get('/admin/overview')).data;
export const getProjects = async () => (await api.get('/admin/projects')).data;
export const getSprints = async () => (await api.get('/admin/sprints')).data;
export const getTeamPerformance = async () => (await api.get('/admin/team-performance')).data;
export const getWorkload = async () => (await api.get('/admin/workload')).data;
export const getBlockers = async () => (await api.get('/admin/blockers')).data;
export const getActivityFeed = async () => (await api.get('/admin/activity-feed')).data;
export const getAuditLogs = async () => (await api.get('/admin/audit-logs')).data;
export const getIntelligence = async () => (await api.get('/admin/intelligence')).data;
export const getSecurityMetrics = async () => (await api.get('/admin/security-metrics')).data;
