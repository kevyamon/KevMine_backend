import express from 'express';
import {
  createRobot,
  getRobots,
  getRobotById,
  updateRobot,
  deleteRobot,
  purchaseRobot, // 1. Importer la nouvelle fonction
} from '../controllers/robotController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js'; // 2. Importer 'protect'

const router = express.Router();

// 3. J'ai aussi ajouté 'protect' aux routes admin pour plus de sécurité
router.route('/').get(getRobots).post(protect, adminProtect, createRobot);

// 4. Ajout de la nouvelle route pour l'achat
router.route('/:id/purchase').post(protect, purchaseRobot);

router
  .route('/:id')
  .get(getRobotById)
  .put(protect, adminProtect, updateRobot)
  .delete(protect, adminProtect, deleteRobot);

export default router;