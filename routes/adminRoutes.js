import express from 'express';
import {
  protect, // On importe la protection simple
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
} from '../controllers/gameSettingsController.js';

const router = express.Router();

// ---- ROUTE POUR LES PARAMÈTRES DU JEU ----
// Tout utilisateur connecté peut voir les paramètres
router.route('/settings').get(protect, getSettings); 
// Seul le SuperAdmin peut les modifier
router.route('/settings').put(protect, superAdminProtect, updateSettings);


// ---- ROUTES PROTÉGÉES POUR LES ADMINS ----
router.use(adminProtect);

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