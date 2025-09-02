import asyncHandler from 'express-async-handler';
import Warning from '../models/warningModel.js';

// @desc    Get active warnings for the logged-in user
// @route   GET /api/warnings
// @access  Private
const getActiveWarnings = asyncHandler(async (req, res) => {
  const warnings = await Warning.find({
    user: req.user._id,
    isActive: true,
  }).sort({ createdAt: -1 });

  res.status(200).json(warnings);
});

// @desc    Dismiss a warning
// @route   PUT /api/warnings/:id/dismiss
// @access  Private
const dismissWarning = asyncHandler(async (req, res) => {
  const warning = await Warning.findById(req.params.id);

  // Vérifier si l'avertissement existe et appartient bien à l'utilisateur qui fait la requête
  if (!warning || warning.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Avertissement non trouvé.');
  }

  warning.isActive = false;
  await warning.save();

  res.status(200).json({ message: 'Avertissement acquitté.' });
});

export { getActiveWarnings, dismissWarning };