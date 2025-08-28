import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getUserGameStatus, claimKevium } from '../controllers/gameController.js';

const router = express.Router();

// Toutes les routes de jeu nécessitent que l'utilisateur soit connecté
router.use(protect);

router.get('/status', getUserGameStatus);
router.post('/claim', claimKevium);

export default router;