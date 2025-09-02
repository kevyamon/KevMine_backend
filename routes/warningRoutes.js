import express from 'express';
import {
  getActiveWarnings,
  dismissWarning,
} from '../controllers/warningController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// L'utilisateur doit être connecté pour voir ses avertissements ou les rejeter
router.route('/').get(protect, getActiveWarnings);
router.route('/:id/dismiss').put(protect, dismissWarning);

export default router;