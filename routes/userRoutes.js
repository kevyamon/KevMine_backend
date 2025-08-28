import express from 'express';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import {
  validate,
  userRegisterSchema,
  userLoginSchema,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/login', loginLimiter, validate(userLoginSchema), authUser);
router.post('/register', validate(userRegisterSchema), registerUser);
router.post('/logout', protect, logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/refresh-token', refreshAccessToken);
router.put('/reset-password/:resetToken', resetPassword);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;