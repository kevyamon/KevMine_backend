import express from 'express';
import { getLogs, clearLogs } from '../controllers/logController.js';
// CORRECTION : On importe le middleware `protect` en plus de `adminProtect`
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// CORRECTION : On ajoute `protect` avant `adminProtect` pour s'assurer
// que l'utilisateur est bien identifié AVANT de vérifier ses droits d'admin.
router.route('/').get(protect, adminProtect, getLogs).delete(protect, adminProtect, clearLogs);

export default router;