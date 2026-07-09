import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createFeedback = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { targetId, category, content, wentWell, wentWrong, improvement, realisticPlanning, achievableDeadlines, blockerPatterns } = req.body;

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        targetId,
        category: category || 'TARGET',
        content,
        wentWell,
        wentWrong,
        improvement,
        realisticPlanning: realisticPlanning ?? true,
        achievableDeadlines: achievableDeadlines ?? true,
        blockerPatterns,
      },
      include: {
        target: true,
        user: true,
      }
    });

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

export const getMyFeedbacks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const feedbacks = await prisma.feedback.findMany({
      where: { userId },
      include: {
        target: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your feedbacks' });
  }
};

export const updateFeedback = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { content, category } = req.body;

    const existing = await prisma.feedback.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: { content, category },
      include: {
        target: true,
        user: true,
      }
    });

    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    const existing = await prisma.feedback.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.feedback.delete({ where: { id } });

    res.status(200).json({ message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};
