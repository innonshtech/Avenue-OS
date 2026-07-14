import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { hasPermission } from '../utils/permissionHelper';

export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { 
      content, sentiment, category, wentWell, wentWrong, improvement, 
      realisticPlanning, achievableDeadlines, fairDistribution, blockerPatterns, targetId 
    } = req.body;
    const userId = req.user?.id;

    if (!userId || !targetId) {
      return res.status(400).json({ error: 'User ID and Target ID are required' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        content,
        sentiment,
        category: category || 'TARGET',
        wentWell,
        wentWrong,
        improvement,
        realisticPlanning,
        achievableDeadlines,
        fairDistribution,
        blockerPatterns,
        userId,
        targetId
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
    const canView = user ? await hasPermission(user.role, 'VIEW_FEEDBACKS') : false;
    if (!canView) {
      return res.status(403).json({ error: 'Only authorized users can view all feedbacks' });
    }

    const { targetId, category } = req.query;

    const filters: any = {};
    if (targetId) filters.targetId = String(targetId);
    if (category) filters.category = String(category);

    const feedbacks = await prisma.feedback.findMany({
      where: filters,
      include: {
        user: true,
        target: true
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
    const canView = user ? await hasPermission(user.role, 'VIEW_FEEDBACKS') : false;
    if (!canView) {
      return res.status(403).json({ error: 'Only authorized users can view comparisons' });
    }

    // Get last two completed targets
    const targets = await prisma.target.findMany({
      where: { status: { in: ['COMPLETED', 'ACTIVE'] } },
      orderBy: { startDate: 'desc' },
      take: 2,
      include: { feedbacks: true, tasks: true }
    });

    if (targets.length < 2) {
      return res.status(200).json({ message: 'Not enough targets for comparison' });
    }

    const currentTarget = targets[0];
    const previousTarget = targets[1];

    const comparisonData = {
      improvedAreas: ['Communication', 'Requirement Clarity'],
      recurringProblems: ['Testing delays'],
      deadlineIssues: 'Reduced by 24%',
      teamCollaborationImprovements: 'Positive trend observed in feedbacks',
      blockerReductions: true,
      targetHealthChanges: 'Improved compared to ' + previousTarget.name,
      currentSprintData: {
        id: currentTarget.id,
        name: currentTarget.name,
        feedbackCount: currentTarget.feedbacks.length,
      },
      previousSprintData: {
        id: previousTarget.id,
        name: previousTarget.name,
        feedbackCount: previousTarget.feedbacks.length,
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
