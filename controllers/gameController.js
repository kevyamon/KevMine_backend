import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// @desc    Update user's unclaimed Kevium based on mining power and time
// @route   GET /api/game/status
// @access  Private
const getUserGameStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('inventory');
  if (!user) { res.status(404); throw new Error('Utilisateur non trouvé'); }
  const now = new Date();
  const lastUpdate = new Date(user.lastKvmUpdate);
  const diffInSeconds = (now - lastUpdate) / 1000;
  if (diffInSeconds < 10) { return res.json({ keviumBalance: user.keviumBalance, unclaimedKevium: user.unclaimedKevium }); }
  const totalMiningPower = user.inventory.reduce((acc, robot) => acc + robot.miningPower, 0);
  const kvmPerSecond = totalMiningPower / 3600;
  const newlyMinedKevium = diffInSeconds * kvmPerSecond;
  user.unclaimedKevium += newlyMinedKevium;
  user.lastKvmUpdate = now;
  await user.save();
  res.json({ keviumBalance: user.keviumBalance, unclaimedKevium: user.unclaimedKevium });
});

// @desc    Claim mined Kevium and add it to the main balance
// @route   POST /api/game/claim
// @access  Private
const claimKevium = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('inventory');
  if (!user) { res.status(404); throw new Error('Utilisateur non trouvé'); }
  const now = new Date();
  const lastUpdate = new Date(user.lastKvmUpdate);
  const diffInSeconds = (now - lastUpdate) / 1000;
  if (diffInSeconds > 0) {
    const totalMiningPower = user.inventory.reduce((acc, robot) => acc + robot.miningPower, 0);
    const kvmPerSecond = totalMiningPower / 3600;
    const newlyMinedKevium = diffInSeconds * kvmPerSecond;
    user.unclaimedKevium += newlyMinedKevium;
  }
  if (user.unclaimedKevium <= 0) { res.status(400); throw new Error('Aucun Kevium à réclamer.'); }
  const amountToClaim = user.unclaimedKevium;
  user.keviumBalance += amountToClaim;
  user.unclaimedKevium = 0;
  user.lastKvmUpdate = now;
  const updatedUser = await user.save();
  res.json({ message: `${amountToClaim.toFixed(2)} KVM réclamés avec succès !`, keviumBalance: updatedUser.keviumBalance, unclaimedKevium: updatedUser.unclaimedKevium });
});

// @desc    Get the players leaderboard with search functionality
// @route   GET /api/game/leaderboard
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const { searchTerm } = req.query;
  let query = { isAdmin: false };

  if (searchTerm) {
    const isNumeric = /^\d+$/.test(searchTerm);
    if (isNumeric) {
      // Recherche par rang
      query.rank = parseInt(searchTerm, 10);
    } else {
      // Recherche par nom (insensible à la casse)
      query.name = { $regex: searchTerm, $options: 'i' };
    }
  }

  const leaderboard = await User.find(query)
    .sort({ rank: 1 }) // Trier par rang
    .limit(100)
    .select('name keviumBalance rank previousRank');

  res.json(leaderboard);
});

// @desc    Get a specific player's rank
// @route   GET /api/game/rank/:userId
// @access  Private
const getPlayerRank = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('name rank previousRank keviumBalance');
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur non trouvé.');
  }
  res.json(user);
});

export { getUserGameStatus, claimKevium, getLeaderboard, getPlayerRank };