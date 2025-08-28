import express from 'express';
import {
  createRobot,
  getRobots,
  getRobotById,
  updateRobot,
  deleteRobot,
  purchaseRobot,
  upgradeRobot,
  sellRobot, // 1. Importer la nouvelle fonction de vente
} from '../controllers/robotController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getRobots).post(protect, adminProtect, createRobot);

router.route('/:id/purchase').post(protect, purchaseRobot);
router.route('/:id/upgrade').put(protect, upgradeRobot);
router.route('/:id/sell').post(protect, sellRobot); // 2. Ajouter la nouvelle route pour la vente

router
  .route('/:id')
  .get(getRobotById)
  .put(protect, adminProtect, updateRobot)
  .delete(protect, adminProtect, deleteRobot);

export default router;