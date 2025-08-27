import express from 'express';
import {
  createRobot,
  getRobots,
  getRobotById,
  updateRobot,
  deleteRobot,
} from '../controllers/robotController.js';
import { adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getRobots).post(adminProtect, createRobot);
router
  .route('/:id')
  .get(getRobotById)
  .put(adminProtect, updateRobot)
  .delete(adminProtect, deleteRobot);

export default router;