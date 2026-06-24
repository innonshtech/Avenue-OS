import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export const getSprintHealth = async (req: Request, res: Response) => {
  try {
    const sprintId = req.query.sprintId as string;
    const data = await dashboardService.getSprintHealth(sprintId);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getTeamWorkload = async (req: Request, res: Response) => {
  try {
    const sprintId = req.query.sprintId as string;
    const data = await dashboardService.getTeamWorkload(sprintId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching team workload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBoardSnapshot = async (req: Request, res: Response) => {
  try {
    const sprintId = req.query.sprintId as string;
    const data = await dashboardService.getBoardSnapshot(sprintId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching board snapshot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStandupMonitoring = async (req: Request, res: Response) => {
  try {
    const sprintId = req.query.sprintId as string;
    const data = await dashboardService.getStandupMonitoring(sprintId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching standup monitoring:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPMSummary = async (req: Request, res: Response) => {
  try {
    const sprintId = req.query.sprintId as string;
    const data = await dashboardService.getPMSummary(sprintId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching PM summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
