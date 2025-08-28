import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route publique pour lister les catégories
router.route('/').get(getCategories);

// Routes protégées pour les admins
router.route('/').post(protect, adminProtect, createCategory);
router
  .route('/:id')
  .put(protect, adminProtect, updateCategory)
  .delete(protect, adminProtect, deleteCategory);

export default router;