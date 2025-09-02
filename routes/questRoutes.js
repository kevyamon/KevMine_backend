import express from 'express';
import {
  getQuestsForUser,
  claimQuestReward,
  createQuest,
  updateQuest,
  deleteQuest,
  getAllQuests, // 1. Importer la nouvelle fonction
} from '../controllers/questController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Routes pour les joueurs connectés ---
router.route('/').get(protect, getQuestsForUser);
router.route('/:id/claim').post(protect, claimQuestReward);

// --- Routes pour l'administration (protégées) ---
router.route('/admin/all').get(protect, adminProtect, getAllQuests); // 2. Ajouter la nouvelle route
router.route('/admin').post(protect, adminProtect, createQuest);
router
  .route('/admin/:id')
  .put(protect, adminProtect, updateQuest)
  .delete(protect, adminProtect, deleteQuest);

export default router;