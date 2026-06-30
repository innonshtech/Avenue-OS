import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export const getSprintHealth = async (req: Request, res: Response) => {
  try {
    const stageId = req.query.stageId as string || req.query.sprintId as string;
    const data = await dashboardService.getStageHealth(stageId);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getTeamWorkload = async (req: Request, res: Response) => {
  try {
    const stageId = req.query.stageId as string || req.query.sprintId as string;
    const data = await dashboardService.getTeamWorkload(stageId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching team workload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBoardSnapshot = async (req: Request, res: Response) => {
  try {
    const stageId = req.query.stageId as string || req.query.sprintId as string;
    const data = await dashboardService.getBoardSnapshot(stageId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching board snapshot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStandupMonitoring = async (req: Request, res: Response) => {
  try {
    const stageId = req.query.stageId as string || req.query.sprintId as string;
    const data = await dashboardService.getProgressReportMonitoring(stageId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching progress report monitoring:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPMSummary = async (req: Request, res: Response) => {
  try {
    const stageId = req.query.stageId as string || req.query.sprintId as string;
    const data = await dashboardService.getPMSummary(stageId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching PM summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
