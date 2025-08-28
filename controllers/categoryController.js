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


// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (category) {
    // Optional: Check if any robot is using this category before deleting
    const robotsInCategory = await Robot.countDocuments({ category: req.params.id });
    if (robotsInCategory > 0) {
      res.status(400);
      throw new Error('Impossible de supprimer, des robots utilisent cette catégorie.');
    }
    
    await Category.deleteOne({ _id: category._id });
    res.json({ message: 'Catégorie supprimée' });
  } else {
    res.status(404);
    throw new Error('Catégorie non trouvée');
  }
});

export { getCategories, createCategory, updateCategory, deleteCategory };