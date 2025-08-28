import express from 'express';
import {
  createRobot,
  getRobots,
  getRobotById,
  updateRobot,
  deleteRobot,
  purchaseRobot,
  upgradeRobot, // 1. Importer la nouvelle fonction
} from '../controllers/robotController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getRobots).post(protect, adminProtect, createRobot);

router.route('/:id/purchase').post(protect, purchaseRobot);

// 2. AJOUT DE LA NOUVELLE ROUTE POUR L'AMÉLIORATION
router.route('/:id/upgrade').put(protect, upgradeRobot);

router
  .route('/:id')
  .get(getRobotById)
  .put(protect, adminProtect, updateRobot)
  .delete(protect, adminProtect, deleteRobot);

export default router;