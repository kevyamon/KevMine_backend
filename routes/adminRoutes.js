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

const router = express.Router();

router.use(adminProtect);

router.route('/').get(getUsers);
router.route('/locked-users').get(getLockedUsers);
router.route('/:id/unlock').put(unlockUser); // New route for unlocking user
router
  .route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/status').put(superAdminProtect, updateUserStatus);

export default router;