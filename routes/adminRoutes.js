import express from 'express';
import {
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
} from '../controllers/adminController.js';
import {
  getSettings,
  updateSettings,
} from '../controllers/gameSettingsController.js'; // 1. Importer les nouvelles fonctions

const router = express.Router();

router.use(adminProtect); // Protection de base pour toutes les routes admin

// ---- ROUTES POUR LES PARAMÈTRES DU JEU ----
router
  .route('/settings')
  .get(getSettings) // Les admins peuvent voir les paramètres
  .put(superAdminProtect, updateSettings); // Seul le SuperAdmin peut les modifier

// ---- ROUTES POUR LES UTILISATEURS ----
router.route('/').get(getUsers);
router.route('/locked-users').get(getLockedUsers);
router.route('/:id/unlock').put(unlockUser);
router
  .route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/status').put(superAdminProtect, updateUserStatus);

export default router;