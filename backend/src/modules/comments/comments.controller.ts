import { Request, Response, NextFunction } from 'express';
import { commentsService } from './comments.service';

export class CommentsController {
  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const comments = await commentsService.getCommentsForTask(taskId);
      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: 'Comment content cannot be empty' });
      }

      const comment = await commentsService.createComment(
        taskId,
        userId,
        content,
        parentCommentId
      );

      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: 'Comment content cannot be empty' });
      }

      const updated = await commentsService.updateComment(
        id,
        user.id,
        user.role,
        content
      );

      res.status(200).json(updated);
    } catch (error: any) {
      if (error.message === 'Forbidden') {
        res.status(403).json({ error: 'Forbidden' });
      } else if (error.message === 'Comment not found') {
        res.status(404).json({ error: 'Comment not found' });
      } else {
        next(error);
      }
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await commentsService.deleteComment(id, user.id, user.role);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Forbidden') {
        res.status(403).json({ error: 'Forbidden' });
      } else if (error.message === 'Comment not found') {
        res.status(404).json({ error: 'Comment not found' });
      } else {
        next(error);
      }
    }
  }

  async toggleReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // Comment ID
      const { emoji } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!emoji || typeof emoji !== 'string') {
        return res.status(400).json({ error: 'Emoji is required' });
      }

      const reactions = await commentsService.toggleReaction(id, userId, emoji);
      res.status(200).json(reactions);
    } catch (error: any) {
      if (error.message === 'Comment not found') {
        res.status(404).json({ error: 'Comment not found' });
      } else {
        next(error);
      }
    }
  }
}

export const commentsController = new CommentsController();
