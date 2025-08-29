import asyncHandler from 'express-async-handler';
import Category from '../models/categoryModel.js';
import Robot from '../models/robotModel.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({});
  res.json(categories);
});

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error('Une catégorie avec ce nom existe déjà');
  }

  const category = await Category.create({
    name,
    description,
  });

  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
        category.name = name || category.name;
        category.description = description || category.description;
        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Catégorie non trouvée');
    }
});


// @desc    Delete a category AND all its robots
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const { confirmationCode } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Catégorie non trouvée');
  }

  // 1. Vérifier le code de confirmation
  if (confirmationCode !== process.env.CATEGORIE_DELETE_CODE) {
    res.status(401);
    throw new Error('Code de confirmation invalide.');
  }

  // 2. Supprimer tous les robots de cette catégorie
  await Robot.deleteMany({ category: req.params.id });

  // 3. Supprimer la catégorie elle-même
  await Category.deleteOne({ _id: category._id });
  
  // 4. Émettre des événements pour mettre à jour les clients en temps réel
  if (req.io) {
    req.io.emit('robots_updated'); // Rafraîchit le store
  }

  res.json({ message: 'Catégorie et tous les robots associés ont été supprimés.' });
});

export { getCategories, createCategory, updateCategory, deleteCategory };