import asyncHandler from 'express-async-handler';
import Robot from '../models/robotModel.js';
import User from '../models/userModel.js';
import sendEmail from '../utils/emailService.js';
import { getPurchaseConfirmationTemplate } from '../utils/emailTemplates.js';

// @desc    Get all robots
// @route   GET /api/robots
// @access  Public
const getRobots = asyncHandler(async (req, res) => {
  // On ne retourne que les robots qui ont un propriétaire (donc pas en vente)
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

// --- NOUVELLE FONCTIONNALITÉ D'ACHAT ---
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

  if (user.keviumBalance < robot.price) {
    res.status(400);
    throw new Error('Solde de Kevium insuffisant pour cet achat.');
  }

  // --- Début de la transaction ---
  user.keviumBalance -= robot.price;
  robot.stock -= 1;

  // Cloner le robot pour en faire un item unique pour le joueur
  const userRobot = new Robot({
    ...robot.toObject(),
    _id: undefined, // Laisse Mongoose générer un nouvel ID
    owner: user._id,
    stock: 0, // La copie du joueur n'est pas en stock
  });
  
  await userRobot.save();

  user.inventory.push(userRobot._id);
  user.purchaseHistory.push({
    robotId: userRobot._id,
    robotName: robot.name,
    price: robot.price,
  });

  await robot.save(); // Sauvegarde le stock décrémenté du robot du magasin
  await user.save(); // Sauvegarde le nouveau solde et l'inventaire de l'utilisateur

  // Envoyer un email de confirmation
  const emailContent = getPurchaseConfirmationTemplate(
    user.name,
    robot.name,
    robot.icon,
    robot.price,
    user.keviumBalance
  );
  await sendEmail({
    email: user.email,
    subject: `Confirmation d'achat - ${robot.name}`,
    htmlContent: emailContent,
  });

  res.status(200).json({ message: 'Achat réussi !', user });
});
// --- FIN DE LA FONCTIONNALITÉ D'ACHAT ---

// @desc    Create a new robot
// @route   POST /api/robots
// @access  Private/Admin
const createRobot = asyncHandler(async (req, res) => {
  const { name, icon, price, miningPower, rarity, stock, isSponsored } =
    req.body;

  const robotExists = await Robot.findOne({ name });
  if (robotExists) {
    res.status(400);
    throw new Error('Un robot avec ce nom existe déjà');
  }

  const robot = new Robot({
    name,
    icon,
    price,
    miningPower,
    rarity,
    stock,
    isSponsored,
  });

  const createdRobot = await robot.save();
  res.status(201).json(createdRobot);
});

// @desc    Update a robot
// @route   PUT /api/robots/:id
// @access  Private/Admin
const updateRobot = asyncHandler(async (req, res) => {
  const { name, icon, price, miningPower, rarity, stock, isSponsored } =
    req.body;

  const robot = await Robot.findById(req.params.id);

  if (robot) {
    robot.name = name || robot.name;
    robot.icon = icon || robot.icon;
    robot.price = price || robot.price;
    robot.miningPower = miningPower || robot.miningPower;
    robot.rarity = rarity || robot.rarity;
    robot.stock = stock === undefined ? robot.stock : stock;
    robot.isSponsored =
      isSponsored !== undefined ? isSponsored : robot.isSponsored;

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
  purchaseRobot, // Exporter la nouvelle fonction
};