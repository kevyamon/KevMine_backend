import express from 'express';
import {
  getNotifications,
  getArchivedNotifications,
  markAllAsRead,
  toggleArchiveNotification,
  markOneAsRead, // 1. Importer la nouvelle fonction
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getNotifications);
router.route('/archived').get(protect, getArchivedNotifications);
router.route('/mark-read').put(protect, markAllAsRead);

// 2. Ajouter les routes spécifiques à une notification par son ID
router.route('/:id/archive').put(protect, toggleArchiveNotification);
router.route('/:id/mark-read').put(protect, markOneAsRead); // Nouvelle route

export default router;