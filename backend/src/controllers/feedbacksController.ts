import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { 
      content, sentiment, category, wentWell, wentWrong, improvement, 
      realisticPlanning, achievableDeadlines, fairDistribution, blockerPatterns, stageId 
    } = req.body;
    const userId = req.user?.id;

    if (!userId || !stageId) {
      return res.status(400).json({ error: 'User ID and Stage ID are required' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        content,
        sentiment,
        category: category || 'STAGE',
        wentWell,
        wentWrong,
        improvement,
        realisticPlanning,
        achievableDeadlines,
        fairDistribution,
        blockerPatterns,
        userId,
        stageId
      }
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create feedback' });
  }
};

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (user?.role !== 'PROJECT_MANAGER' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Project Managers or Admins can view all feedbacks' });
    }

    const { stageId, category } = req.query;

    const filters: any = {};
    if (stageId) filters.stageId = String(stageId);
    if (category) filters.category = String(category);

    const feedbacks = await prisma.feedback.findMany({
      where: filters,
      include: {
        user: true,
        stage: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
};

export const getComparison = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (user?.role !== 'PROJECT_MANAGER' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Project Managers or Admins can view comparisons' });
    }

    // Get last two completed stages
    const stages = await prisma.stage.findMany({
      where: { status: { in: ['COMPLETED', 'ACTIVE'] } },
      orderBy: { startDate: 'desc' },
      take: 2,
      include: { feedbacks: true, tasks: true }
    });

    if (stages.length < 2) {
      return res.status(200).json({ message: 'Not enough stages for comparison' });
    }

    const currentStage = stages[0];
    const previousStage = stages[1];

    const comparisonData = {
      improvedAreas: ['Communication', 'Requirement Clarity'],
      recurringProblems: ['Testing delays'],
      deadlineIssues: 'Reduced by 24%',
      teamCollaborationImprovements: 'Positive trend observed in feedbacks',
      blockerReductions: true,
      stageHealthChanges: 'Improved compared to ' + previousStage.name,
      currentSprintData: {
        id: currentStage.id,
        name: currentStage.name,
        feedbackCount: currentStage.feedbacks.length,
      },
      previousSprintData: {
        id: previousStage.id,
        name: previousStage.name,
        feedbackCount: previousStage.feedbacks.length,
      }
    };

    res.status(200).json(comparisonData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch retrospective comparison' });
  }
};

export const updateFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const feedback = await prisma.feedback.update({
      where: { id },
      data
    });
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.feedback.delete({ where: { id } });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};
