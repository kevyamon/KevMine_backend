import asyncHandler from 'express-async-handler';

// @desc    Upload an image for a robot
// @route   POST /api/uploads/robot
// @access  Private/Admin
const uploadRobotImage = asyncHandler(async (req, res) => {
  if (req.file) {
    res.status(200).json({
      message: 'Image téléversée avec succès',
      image: req.file.path,
    });
  } else {
    res.status(400);
    throw new Error('Aucun fichier image trouvé');
  }
});

export { uploadRobotImage };