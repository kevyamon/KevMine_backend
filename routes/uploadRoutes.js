import express from 'express';
import { uploadRobotImage } from '../controllers/uploadController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// Le middleware 'upload.single('image')' s'occupe de l'upload vers Cloudinary
// avant que notre contrôleur 'uploadRobotImage' ne soit appelé.
router
  .route('/robot')
  .post(protect, adminProtect, upload.single('image'), uploadRobotImage);

export default router;