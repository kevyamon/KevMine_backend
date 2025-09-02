import express from 'express';
import {
  getAchievementsForUser,
  getAllAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from '../controllers/achievementController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Route pour les joueurs ---
router.route('/').get(protect, getAchievementsForUser);

// --- Routes pour l'administration ---
router.route('/admin/all').get(protect, adminProtect, getAllAchievements);
router.route('/admin').post(protect, adminProtect, createAchievement);
router
  .route('/admin/:id')
  .put(protect, adminProtect, updateAchievement)
  .delete(protect, adminProtect, deleteAchievement);

export default router;