import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserGameStatus,
  claimKevium,
  getLeaderboard,
  getPlayerRank, // 1. Importer la nouvelle fonction
} from '../controllers/gameController.js';

const router = express.Router();

// ---- ROUTES PUBLIQUES ----
// Le classement général est visible par tous
router.get('/leaderboard', getLeaderboard);

// ---- ROUTES PRIVÉES ----
// Il faut être connecté pour accéder à ces infos
router.get('/rank/:userId', protect, getPlayerRank); // 2. Nouvelle route pour le rang du joueur
router.post('/claim', protect, claimKevium);
router.get('/status', protect, getUserGameStatus);


export default router;