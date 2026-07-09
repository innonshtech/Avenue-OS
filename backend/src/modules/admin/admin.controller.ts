import { Request, Response } from 'express';
import { adminService } from './admin.service';

export const getOverview = async (req: Request, res: Response) => {
  try {
    const overview = await adminService.getOverview();
    res.json(overview);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to fetch admin overview' });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await adminService.getProjects();
    res.json(projects);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to fetch admin projects' });
  }
};

export const getSprints = async (req: Request, res: Response) => {
  try {
    const targets = await adminService.getTargets();
    res.json(targets);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to fetch admin targets' });
  }
};

export const getTeamPerformance = async (req: Request, res: Response) => {
  try {
    const performance = await adminService.getTeamPerformance();
    res.json(performance);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to fetch team performance' });
  }
};

export const getWorkload = async (req: Request, res: Response) => {
  try {
    const workload = await adminService.getWorkload();
    res.json(workload);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team workload' });
  }
};

export const getBlockers = async (req: Request, res: Response) => {
  try {
    const rfis = await adminService.getRFIs();
    res.json(rfis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin RFIs' });
  }
};

export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const activities = await adminService.getActivityFeed();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await adminService.getAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getIntelligence = async (req: Request, res: Response) => {
  try {
    const insights = await adminService.getIntelligenceInsights();
    res.json(insights);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to fetch intelligence insights' });
  }
};

export const getSecurityMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await adminService.getSecurityMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to fetch security metrics' });
  }
};
