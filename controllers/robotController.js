import asyncHandler from 'express-async-handler';
import Robot from '../models/robotModel.js';
import User from '../models/userModel.js';
import sendEmail from '../utils/emailService.js';
import { getPurchaseConfirmationTemplate } from '../utils/emailTemplates.js';

// @desc    Get all robots for the store (not owned by anyone)
// @route   GET /api/robots
// @access  Public
const getRobots = asyncHandler(async (req, res) => {
  const robots = await Robot.find({ owner: null });
  res.json(robots);
});

// @desc    Get a single robot by ID
// @route   GET /api/robots/:id
// @access  Public
const getRobotById = asyncHandler(async (req, res) => {
  const robot = await Robot.findById(req.params.id);
  if (robot) {
    res.json(robot);
  } else {
    res.status(404);
    throw new Error('Robot non trouvé');
  }
});

// @desc    Purchase a robot
// @route   POST /api/robots/:id/purchase
// @access  Private
const purchaseRobot = asyncHandler(async (req, res) => {
  const robot = await Robot.findById(req.params.id);
  const user = await User.findById(req.user._id);

  if (!robot) {
    res.status(404);
    throw new Error('Robot non trouvé.');
  }

  if (robot.stock <= 0) {
    res.status(400);
    throw new Error('Ce robot est en rupture de stock.');
  }

  // ---- LOGIQUE SUPERADMIN : Droit d'achat absolu ----
  // Si l'utilisateur n'est PAS SuperAdmin, on vérifie son solde.
  if (!user.isSuperAdmin && user.keviumBalance < robot.price) {
    res.status(400);
    throw new Error('Solde de Kevium insuffisant pour cet achat.');
  }

  // --- Début de la transaction ---
  if (!user.isSuperAdmin) {
    user.keviumBalance -= robot.price; // On ne débite que si ce n'est pas le SuperAdmin
  }
  robot.stock -= 1;

  const userRobot = new Robot({
    ...robot.toObject(),
    _id: undefined,
    owner: user._id,
    stock: 0,
    name: robot.name, // S'assurer que le nom est bien copié
  });

  await userRobot.save();

  user.inventory.push(userRobot._id);
  user.purchaseHistory.push({
    robotId: userRobot._id,
    robotName: robot.name,
    price: user.isSuperAdmin ? 0 : robot.price, // L'achat est gratuit pour le SuperAdmin
    purchaseDate: new Date(),
  });

  await robot.save();
  const updatedUser = await user.save();

  // Envoyer un email de confirmation
  const emailContent = getPurchaseConfirmationTemplate(
    user.name,
    robot.name,
    robot.icon,
    user.isSuperAdmin ? 0 : robot.price,
    updatedUser.keviumBalance
  );
  await sendEmail({
    email: user.email,
    subject: `Confirmation d'achat - ${robot.name}`,
    htmlContent: emailContent,
  });

  res.status(200).json({ message: 'Achat réussi !', user: updatedUser });
});

// @desc    Upgrade a robot owned by the user
// @route   PUT /api/robots/:id/upgrade
// @access  Private
const upgradeRobot = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const robotToUpgrade = await Robot.findById(req.params.id);

  // 1. Vérifier si le robot existe
  if (!robotToUpgrade) {
    res.status(404);
    throw new Error('Robot non trouvé.');
  }

  // 2. Vérifier si l'utilisateur est bien le propriétaire du robot
  if (robotToUpgrade.owner.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error('Action non autorisée. Vous n\'êtes pas le propriétaire de ce robot.');
  }

  // 3. Vérifier si l'utilisateur a assez de Kevium
  if (user.keviumBalance < robotToUpgrade.upgradeCost) {
    res.status(400);
    throw new Error('Solde de Kevium insuffisant pour cette amélioration.');
  }

  // 4. Appliquer la transaction
  user.keviumBalance -= robotToUpgrade.upgradeCost;

  // 5. Mettre à jour les stats du robot
  robotToUpgrade.level += 1;
  robotToUpgrade.miningPower = parseFloat((robotToUpgrade.miningPower * robotToUpgrade.levelUpFactor).toFixed(2));
  robotToUpgrade.upgradeCost = Math.floor(robotToUpgrade.upgradeCost * robotToUpgrade.levelUpFactor);
  
  await robotToUpgrade.save();
  const updatedUser = await user.save();

  res.status(200).json({
    message: `${robotToUpgrade.name} amélioré au niveau ${robotToUpgrade.level} !`,
    robot: robotToUpgrade,
    user: updatedUser,
  });
});


// @desc    Create a new robot
// @route   POST /api/robots
// @access  Private/Admin
const createRobot = asyncHandler(async (req, res) => {
  const { name, icon, price, miningPower, rarity, stock, isSponsored, levelUpFactor, upgradeCost } =
    req.body;

  const robotExists = await Robot.findOne({ name, owner: null });
  if (robotExists) {
    res.status(400);
    throw new Error('Un robot avec ce nom existe déjà dans le magasin');
  }

  const robot = new Robot({
    name,
    icon,
    price,
    miningPower,
    rarity,
    stock,
    isSponsored,
    levelUpFactor,
    upgradeCost,
  });

  const createdRobot = await robot.save();
  res.status(201).json(createdRobot);
});

// @desc    Update a robot
// @route   PUT /api/robots/:id
// @access  Private/Admin
const updateRobot = asyncHandler(async (req, res) => {
  const { name, icon, price, miningPower, rarity, stock, isSponsored, levelUpFactor, upgradeCost } =
    req.body;

  const robot = await Robot.findById(req.params.id);

  if (robot) {
    robot.name = name || robot.name;
    robot.icon = icon || robot.icon;
    robot.price = price === undefined ? robot.price : price;
    robot.miningPower = miningPower === undefined ? robot.miningPower : miningPower;
    robot.rarity = rarity || robot.rarity;
    robot.stock = stock === undefined ? robot.stock : stock;
    robot.isSponsored =
      isSponsored !== undefined ? isSponsored : robot.isSponsored;
    robot.levelUpFactor = levelUpFactor === undefined ? robot.levelUpFactor : levelUpFactor;
    robot.upgradeCost = upgradeCost === undefined ? robot.upgradeCost : upgradeCost;

    const updatedRobot = await robot.save();
    res.json(updatedRobot);
  } else {
    res.status(404);
    throw new Error('Robot non trouvé');
  }
});

// @desc    Delete a robot
// @route   DELETE /api/robots/:id
// @access  Private/Admin
const deleteRobot = asyncHandler(async (req, res) => {
  const robot = await Robot.findById(req.params.id);

  if (robot) {
    await Robot.deleteOne({ _id: robot._id });
    res.json({ message: 'Robot supprimé' });
  } else {
    res.status(404);
    throw new Error('Robot non trouvé');
  }
});

export {
  createRobot,
  getRobots,
  getRobotById,
  updateRobot,
  deleteRobot,
  purchaseRobot,
  upgradeRobot, // Ne pas oublier d'exporter la nouvelle fonction
};