import { Request, Response, NextFunction } from 'express';
import { searchService } from './search.service';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!q || q.trim() === '') {
        return res.status(200).json({
          tasks: [],
          projects: [],
          comments: [],
          rfis: [],
          progressReports: []
        });
      }

      const results = await searchService.globalSearch(user.id, user.role, q);
      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!q || q.trim() === '') {
        return res.status(200).json([]);
      }

      const suggestions = await searchService.getSuggestions(user.id, user.role, q);
      res.status(200).json(suggestions);
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
