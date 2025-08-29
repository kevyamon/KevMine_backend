import express from 'express';
import {
  protect,
  adminProtect,
  superAdminProtect,
} from '../middleware/authMiddleware.js';
import {
  getUsers,
  getLockedUsers,
  deleteUser,
  getUserById,
  updateUser,
  updateUserStatus,
  unlockUser,
  triggerRankUpdate,
} from '../controllers/adminController.js';
import {
  getSettings,
  updateSettings,
} from '../controllers/gameSettingsController.js';

const router = express.Router();

// --- CORRECTION : Routes réorganisées pour une meilleure lisibilité et sécurité ---

// Route accessible à tout utilisateur connecté
router.route('/settings').get(protect, getSettings);

// Routes nécessitant les droits de Super Administrateur
router.route('/settings').put(protect, superAdminProtect, updateSettings);
router.route('/trigger-rank-update').post(protect, superAdminProtect, triggerRankUpdate);
router.route('/users/:id/status').put(protect, superAdminProtect, updateUserStatus);

// Routes nécessitant les droits d'Administrateur
// On applique ici la double protection : d'abord identifier (protect), puis autoriser (adminProtect)
router.route('/users').get(protect, adminProtect, getUsers);
router.route('/users/locked').get(protect, adminProtect, getLockedUsers);
router.route('/users/:id/unlock').put(protect, adminProtect, unlockUser);
router
  .route('/users/:id')
  .get(protect, adminProtect, getUserById)
  .put(protect, adminProtect, updateUser)
  .delete(protect, adminProtect, deleteUser);

export default router;