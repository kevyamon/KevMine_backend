import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route protégée pour les admins
router.route('/stats').get(protect, adminProtect, getDashboardStats);

export default router;