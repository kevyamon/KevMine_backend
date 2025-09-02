import asyncHandler from 'express-async-handler';
import Achievement from '../models/achievementModel.js';
import UserAchievement from '../models/userAchievementModel.js';

// @desc    Get all achievements for a user (with their progress)
// @route   GET /api/achievements
// @access  Private
const getAchievementsForUser = asyncHandler(async (req, res) => {
  const userAchievements = await UserAchievement.find({ user: req.user._id }).populate('achievement');
  res.json(userAchievements);
});

// --- ADMIN ROUTES ---

// @desc    Get all achievements (for admin panel)
// @route   GET /api/achievements/admin/all
// @access  Private/Admin
const getAllAchievements = asyncHandler(async (req, res) => {
  const achievements = await Achievement.find({});
  res.json(achievements);
});

// @desc    Create a new achievement
// @route   POST /api/achievements/admin
// @access  Private/Admin
const createAchievement = asyncHandler(async (req, res) => {
  const { title, description, icon, achievementType, target, reward, isEnabled } = req.body;

  const achievement = new Achievement({
    title,
    description,
    icon,
    achievementType,
    target,
    reward,
    isEnabled,
  });

  const createdAchievement = await achievement.save();
  // TODO: Potentiellement initialiser ce nouveau succès pour tous les utilisateurs existants.
  res.status(201).json(createdAchievement);
});

// @desc    Update an achievement
// @route   PUT /api/achievements/admin/:id
// @access  Private/Admin
const updateAchievement = asyncHandler(async (req, res) => {
  const { title, description, icon, achievementType, target, reward, isEnabled } = req.body;
  const achievement = await Achievement.findById(req.params.id);

  if (achievement) {
    achievement.title = title;
    achievement.description = description;
    achievement.icon = icon;
    achievement.achievementType = achievementType;
    achievement.target = target;
    achievement.reward = reward;
    achievement.isEnabled = isEnabled;

    const updatedAchievement = await achievement.save();
    res.json(updatedAchievement);
  } else {
    res.status(404);
    throw new Error('Succès non trouvé');
  }
});

// @desc    Delete an achievement
// @route   DELETE /api/achievements/admin/:id
// @access  Private/Admin
const deleteAchievement = asyncHandler(async (req, res) => {
  const achievement = await Achievement.findById(req.params.id);

  if (achievement) {
    // On supprime aussi les progressions associées chez les utilisateurs
    await UserAchievement.deleteMany({ achievement: achievement._id });
    await Achievement.deleteOne({ _id: achievement._id });
    res.json({ message: 'Succès supprimé' });
  } else {
    res.status(404);
    throw new Error('Succès non trouvé');
  }
});

export {
  getAchievementsForUser,
  getAllAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
};