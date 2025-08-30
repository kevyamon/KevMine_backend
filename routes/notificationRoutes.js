import express from 'express';
import {
  getNotifications,
  getArchivedNotifications, // 1. Importer la nouvelle fonction
  markAllAsRead,
  toggleArchiveNotification, // 2. Importer la nouvelle fonction
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getNotifications);
router.route('/archived').get(protect, getArchivedNotifications); // 3. Ajouter la route pour les archives
router.route('/mark-read').put(protect, markAllAsRead);
router.route('/:id/archive').put(protect, toggleArchiveNotification); // 4. Ajouter la route pour archiver/désarchiver

export default router;