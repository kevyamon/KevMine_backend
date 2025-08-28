import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Robot from '../models/robotModel.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. Compter le nombre total de joueurs (non-admins)
  const totalPlayers = await User.countDocuments({ isAdmin: false });

  // 2. Compter le nombre total de robots possédés par des joueurs
  const robotsInCirculation = await Robot.countDocuments({ owner: { $ne: null } });

  // 3. Calculer le Kevium total dans l'économie
  const totalKeviumResult = await User.aggregate([
    {
      $group: {
        _id: null,
        totalBalance: { $sum: '$keviumBalance' },
        totalUnclaimed: { $sum: '$unclaimedKevium' },
      },
    },
  ]);

  const totalKevium =
    totalKeviumResult.length > 0
      ? totalKeviumResult[0].totalBalance + totalKeviumResult[0].totalUnclaimed
      : 0;
      
  // 4. Nombre de robots en vente sur le marché des joueurs
  const playerSaleRobots = await Robot.countDocuments({ isPlayerSale: true });

  res.json({
    totalPlayers,
    robotsInCirculation,
    totalKevium,
    playerSaleRobots
  });
});

export { getDashboardStats };