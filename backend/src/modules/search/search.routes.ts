import { Router } from 'express';
import { searchController } from './search.controller';

const router = Router();

// Global search query
router.get('/global', searchController.search);

// Search suggestions autocomplete
router.get('/suggestions', searchController.getSuggestions);

export default router;
