import asyncHandler from 'express-async-handler';
import Robot from '../models/robotModel.js';
import User from '../models/userModel.js';
import GameSetting from '../models/gameSettingModel.js'; // Importer les paramètres du jeu
import sendEmail from '../utils/emailService.js';
import { getPurchaseConfirmationTemplate } from '../utils/emailTemplates.js';

// @desc    Get all robots for the store (not owned by anyone)
// @route   GET /api/robots
// @access  Public
const getRobots = asyncHandler(async (req, res) => {
  const robots = await Robot.find({ owner: null }).populate('category');
  res.json(robots);
});

// @desc    Get a single robot by ID
// @route   GET /api/robots/:id
// @access  Public
const getRobotById = asyncHandler(async (req, res) => {
  const robot = await Robot.findById(req.params.id).populate('category');
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
  const robotToPurchase = await Robot.findById(req.params.id);
  const user = await User.findById(req.user._id);

  if (!robotToPurchase) {
    res.status(404);
    throw new Error('Robot non trouvé.');
  }

  // Utiliser le prix de vente si c'est une revente, sinon le prix normal
  const price = robotToPurchase.isPlayerSale ? robotToPurchase.salePrice : robotToPurchase.price;

  if (user.keviumBalance < price) {
    res.status(400);
    throw new Error('Solde de Kevium insuffisant pour cet achat.');
  }

  // --- Début de la transaction ---
  user.keviumBalance -= price;

  let purchasedRobot;

  if (robotToPurchase.isPlayerSale) {
    // C'est un robot d'occasion, on le transfère directement
    if (robotToPurchase.stock <= 0) {
      res.status(400);
      throw new Error('Ce robot n\'est plus disponible.');
    }
    robotToPurchase.owner = user._id;
    robotToPurchase.isPlayerSale = false;
    robotToPurchase.stock = 0; // Il n'est plus dans le magasin
    purchasedRobot = await robotToPurchase.save();
  } else {
    // C'est un robot neuf, on en crée une copie
    if (robotToPurchase.stock <= 0) {
      res.status(400);
      throw new Error('Ce robot est en rupture de stock.');
    }
    robotToPurchase.stock -= 1;
    await robotToPurchase.save();

    purchasedRobot = new Robot({
      ...robotToPurchase.toObject(),
      _id: undefined,
      owner: user._id,
      stock: 0,
      isPlayerSale: false,
    });
    await purchasedRobot.save();
  }

  user.inventory.push(purchasedRobot._id);
  user.purchaseHistory.push({
    robotId: purchasedRobot._id,
    robotName: purchasedRobot.name,
    price: price,
    purchaseDate: new Date(),
  });

  const updatedUser = await user.save();

  const emailContent = getPurchaseConfirmationTemplate(
    user.name,
    purchasedRobot.name,
    purchasedRobot.icon,
    price,
    updatedUser.keviumBalance
  );
  await sendEmail({
    email: user.email,
    subject: `Confirmation d'achat - ${purchasedRobot.name}`,
    htmlContent: emailContent,
  });

  res.status(200).json({ message: 'Achat réussi !', user: updatedUser });
});

// @desc    Sell a robot owned by the user
// @route   POST /api/robots/:id/sell
// @access  Private
const sellRobot = asyncHandler(async (req, res) => {
  const { salePrice } = req.body;
  const user = await User.findById(req.user._id);
  const robotToSell = await Robot.findById(req.params.id);
  const superAdmin = await User.findOne({ isSuperAdmin: true });
  const settings = await GameSetting.findOne({ key: 'globalSettings' });

  if (!robotToSell || robotToSell.owner.toString() !== user._id.toString()) {
    res.status(404);
    throw new Error('Robot non trouvé ou vous n\'en êtes pas le propriétaire.');
  }
  if (!superAdmin) {
    throw new Error('Configuration du SuperAdmin introuvable.');
  }
  if (!salePrice || salePrice <= 0) {
    res.status(400);
    throw new Error('Veuillez fournir un prix de vente valide.');
  }

  // Calcul de la commission
  const commissionRate = settings.salesCommissionRate;
  const commission = salePrice * commissionRate;
  const userRevenue = salePrice - commission;

  // Mettre à jour les soldes
  user.keviumBalance += userRevenue;
  superAdmin.keviumBalance += commission;
  
  // Retirer le robot de l'inventaire du vendeur
  user.inventory.pull(robotToSell._id);

  // Mettre à jour le robot pour le remettre en vente
  robotToSell.owner = null;
  robotToSell.isPlayerSale = true;
  robotToSell.salePrice = salePrice;
  robotToSell.stock = 1; // C'est maintenant un item unique en magasin

  await robotToSell.save();
  await user.save();
  await superAdmin.save();

  res.status(200).json({
    message: `Robot ${robotToSell.name} vendu pour ${salePrice} KVM (vous recevez ${userRevenue} KVM après commission).`,
    user: user,
  });
});

// @desc    Upgrade a robot owned by the user
// @route   PUT /api/robots/:id/upgrade
// @access  Private
const upgradeRobot = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const robotToUpgrade = await Robot.findById(req.params.id);

  if (!robotToUpgrade || robotToUpgrade.owner.toString() !== user._id.toString()) {
    res.status(404);
    throw new Error('Robot non trouvé ou vous n\'en êtes pas le propriétaire.');
  }

  if (user.keviumBalance < robotToUpgrade.upgradeCost) {
    res.status(400);
    throw new Error('Solde de Kevium insuffisant pour cette amélioration.');
  }

  user.keviumBalance -= robotToUpgrade.upgradeCost;
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

// --- ROUTES ADMIN ---
const createRobot = asyncHandler(async (req, res) => {
  const { name, icon, price, miningPower, rarity, stock, isSponsored, levelUpFactor, upgradeCost, category } = req.body;
  const robot = new Robot({ name, icon, price, miningPower, rarity, stock, isSponsored, levelUpFactor, upgradeCost, category });
  const createdRobot = await robot.save();
  res.status(201).json(createdRobot);
});

const updateRobot = asyncHandler(async (req, res) => {
  const robot = await Robot.findById(req.params.id);
  if (robot) {
    Object.assign(robot, req.body);
    const updatedRobot = await robot.save();
    res.json(updatedRobot);
  } else {
    res.status(404);
    throw new Error('Robot non trouvé');
  }
});

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
  createRobot, getRobots, getRobotById, updateRobot, deleteRobot,
  purchaseRobot, upgradeRobot, sellRobot,
};