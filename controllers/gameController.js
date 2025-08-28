import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// @desc    Update user's unclaimed Kevium based on mining power and time
// @route   GET /api/game/status
// @access  Private
const getUserGameStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('inventory');

  if (!user) {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }

  const now = new Date();
  const lastUpdate = new Date(user.lastKvmUpdate);
  const diffInSeconds = (now - lastUpdate) / 1000;

  // Si moins de 10 secondes se sont écoulées, on ne fait rien pour éviter les abus
  if (diffInSeconds < 10) {
    return res.json({
      keviumBalance: user.keviumBalance,
      unclaimedKevium: user.unclaimedKevium,
    });
  }
  
  const totalMiningPower = user.inventory.reduce(
    (acc, robot) => acc + robot.miningPower,
    0
  );

  // Calculer les gains par seconde (1h = 3600s)
  const kvmPerSecond = totalMiningPower / 3600;
  const newlyMinedKevium = diffInSeconds * kvmPerSecond;
  
  user.unclaimedKevium += newlyMinedKevium;
  user.lastKvmUpdate = now;

  await user.save();

  res.json({
    keviumBalance: user.keviumBalance,
    unclaimedKevium: user.unclaimedKevium,
  });
});

// @desc    Claim mined Kevium and add it to the main balance
// @route   POST /api/game/claim
// @access  Private
const claimKevium = asyncHandler(async (req, res) => {
  // On recalcule une dernière fois avant de réclamer
  const user = await User.findById(req.user._id).populate('inventory');
  
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }

  const now = new Date();
  const lastUpdate = new Date(user.lastKvmUpdate);
  const diffInSeconds = (now - lastUpdate) / 1000;
  
  if (diffInSeconds > 0) {
      const totalMiningPower = user.inventory.reduce(
        (acc, robot) => acc + robot.miningPower,
        0
      );
      const kvmPerSecond = totalMiningPower / 3600;
      const newlyMinedKevium = diffInSeconds * kvmPerSecond;
      user.unclaimedKevium += newlyMinedKevium;
  }
  
  if (user.unclaimedKevium <= 0) {
    res.status(400);
    throw new Error('Aucun Kevium à réclamer.');
  }

  const amountToClaim = user.unclaimedKevium;
  user.keviumBalance += amountToClaim;
  user.unclaimedKevium = 0;
  user.lastKvmUpdate = now;

  const updatedUser = await user.save();

  res.json({
    message: `${amountToClaim.toFixed(2)} KVM réclamés avec succès !`,
    keviumBalance: updatedUser.keviumBalance,
    unclaimedKevium: updatedUser.unclaimedKevium,
  });
});

export { getUserGameStatus, claimKevium };