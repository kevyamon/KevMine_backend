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
  triggerRankUpdate, // 1. Importer la fonction
} from '../controllers/adminController.js';
import {
  getSettings,
  updateSettings,
} from '../controllers/gameSettingsController.js';

const router = express.Router();

// ---- ROUTES PUBLIQUES POUR LES CONNECTÉS ----
router.route('/settings').get(protect, getSettings);

// ---- ROUTES SUPER ADMIN ----
router.route('/settings').put(protect, superAdminProtect, updateSettings);
// 2. Nouvelle route pour déclencher la mise à jour du classement
router.route('/trigger-rank-update').post(protect, superAdminProtect, triggerRankUpdate);


// ---- ROUTES ADMIN ----
router.use(adminProtect);

router.route('/users').get(getUsers); // Renommé pour plus de clarté
router.route('/users/locked').get(getLockedUsers); // Renommé pour plus de clarté
router.route('/users/:id/unlock').put(unlockUser);
router
  .route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.route('/users/:id/status').put(superAdminProtect, updateUserStatus);

export default router;