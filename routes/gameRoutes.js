import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserGameStatus,
  claimKevium,
  getLeaderboard, // 1. Importer la nouvelle fonction
} from '../controllers/gameController.js';

const router = express.Router();

// ---- NOUVELLE ROUTE PUBLIQUE ----
// Tout le monde peut voir le classement, même sans être connecté
router.get('/leaderboard', getLeaderboard);

// ---- ROUTES PRIVÉES ----
// Il faut être connecté pour accéder à son statut de jeu et réclamer des gains
router.post('/claim', protect, claimKevium);
router.get('/status', protect, getUserGameStatus);


export default router;