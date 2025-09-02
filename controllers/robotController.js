import asyncHandler from 'express-async-handler';
import Robot from '../models/robotModel.js';
import User from '../models/userModel.js';
import GameSetting from '../models/gameSettingModel.js';
import sendEmail from '../utils/emailService.js';
import { getPurchaseConfirmationTemplate } from '../utils/emailTemplates.js';
import { updateQuestProgress } from '../utils/questService.js';
// 1. Importer le nouveau service de succès
import { updateAchievementProgress } from '../utils/achievementService.js';

const getRobots = asyncHandler(async (req, res) => {
  const robots = await Robot.find({ owner: null })
    .populate('category')
    .populate('seller', 'name');
  res.json(robots);
});

const getRobotById = asyncHandler(async (req, res) => {
  const robot = await Robot.findById(req.params.id).populate('category');
  if (robot) res.json(robot);
  else { res.status(404); throw new Error('Robot non trouvé'); }
});

const purchaseRobot = asyncHandler(async (req, res) => {
  const robotToPurchase = await Robot.findById(req.params.id);
  const user = await User.findById(req.user._id);

  if (!robotToPurchase) { res.status(404); throw new Error('Robot non trouvé.'); }

  const price = robotToPurchase.isPlayerSale ? robotToPurchase.price : robotToPurchase.price;

  if (user.keviumBalance < price) { res.status(400); throw new Error('Solde de Kevium insuffisant.'); }

  user.keviumBalance -= price;

  let purchasedRobot;

  if (robotToPurchase.isPlayerSale) {
    robotToPurchase.owner = user._id;
    robotToPurchase.isPlayerSale = false;
    robotToPurchase.stock = 0;
    robotToPurchase.investedKevium = price;
    robotToPurchase.seller = undefined;
    purchasedRobot = await robotToPurchase.save();
  } else {
    if (robotToPurchase.stock <= 0) { res.status(400); throw new Error('Ce robot est en rupture de stock.'); }
    robotToPurchase.stock -= 1;
    await robotToPurchase.save();

    purchasedRobot = new Robot({
      ...robotToPurchase.toObject(),
      _id: undefined,
      owner: user._id,
      stock: 0,
      isPlayerSale: false,
      investedKevium: price,
      seller: undefined,
    });
    await purchasedRobot.save();
  }

  user.inventory.push(purchasedRobot._id);
  user.purchaseHistory.push({ robotName: purchasedRobot.name, price: price, purchaseDate: new Date() });
  const updatedUser = await user.save();
  
  await updateQuestProgress(req.user._id, 'PURCHASE_ROBOT', 1);

  // 2. Mettre à jour les succès liés à l'achat et au nombre de robots possédés
  await updateAchievementProgress(req.io, req.user._id, 'ROBOTS_PURCHASED', updatedUser.purchaseHistory.length);
  await updateAchievementProgress(req.io, req.user._id, 'ROBOTS_OWNED', updatedUser.inventory.length);


  const emailContent = getPurchaseConfirmationTemplate(user.name, purchasedRobot.name, purchasedRobot.icon, price, updatedUser.keviumBalance);
  await sendEmail({ email: user.email, subject: `Confirmation d'achat - ${purchasedRobot.name}`, htmlContent: emailContent });

  res.status(200).json({ message: 'Achat réussi !', user: updatedUser });
});

const sellRobot = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const robotToSell = await Robot.findById(req.params.id);
    const superAdmin = await User.findOne({ isSuperAdmin: true });
    const settings = await GameSetting.findOne({ key: 'globalSettings' });

    if (!robotToSell || robotToSell.owner.toString() !== user._id.toString()) { res.status(404); throw new Error('Robot non trouvé ou vous n\'en êtes pas le propriétaire.'); }
    if (!superAdmin) { throw new Error('Configuration du SuperAdmin introuvable.'); }
    
    const investedValue = robotToSell.investedKevium;
    const salePrice = Math.floor(investedValue * 1.4);
    const commissionRate = settings.salesCommissionRate;
    const commission = Math.floor(investedValue * commissionRate);
    const userTotalReturn = salePrice - commission;

    user.keviumBalance += userTotalReturn;
    superAdmin.keviumBalance += commission;
    
    user.inventory.pull(robotToSell._id);

    user.salesHistory.push({
      robotName: robotToSell.name,
      salePrice: salePrice,
      userRevenue: userTotalReturn,
      saleDate: new Date(),
    });

    robotToSell.owner = null;
    robotToSell.seller = user._id;
    robotToSell.isPlayerSale = true;
    robotToSell.price = salePrice;
    robotToSell.stock = 1;
    robotToSell.investedKevium = 0;

    await robotToSell.save();
    const updatedUser = await user.save();
    await superAdmin.save();
    
    await updateQuestProgress(req.user._id, 'SELL_ROBOT', 1);

    // 3. Mettre à jour les succès liés à la vente et au nombre de robots
    await updateAchievementProgress(req.io, req.user._id, 'ROBOTS_SOLD', updatedUser.salesHistory.length);
    await updateAchievementProgress(req.io, req.user._id, 'ROBOTS_OWNED', updatedUser.inventory.length);
    
    req.io.emit('robots_updated');

    res.status(200).json({
      message: `Robot ${robotToSell.name} vendu pour ${salePrice} KVM. Vous recevez ${userTotalReturn} KVM.`,
      user: updatedUser,
    });
});

const upgradeRobot = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const robotToUpgrade = await Robot.findById(req.params.id);

  if (!robotToUpgrade || robotToUpgrade.owner.toString() !== user._id.toString()) { res.status(404); throw new Error('Robot non trouvé ou vous n\'en êtes pas le propriétaire.'); }
  if (user.keviumBalance < robotToUpgrade.upgradeCost) { res.status(400); throw new Error('Solde de Kevium insuffisant pour cette amélioration.'); }

  const costOfUpgrade = robotToUpgrade.upgradeCost;
  user.keviumBalance -= costOfUpgrade;

  robotToUpgrade.investedKevium += costOfUpgrade;
  robotToUpgrade.level += 1;
  robotToUpgrade.miningPower = parseFloat((robotToUpgrade.miningPower * robotToUpgrade.levelUpFactor).toFixed(2));
  robotToUpgrade.upgradeCost = Math.floor(robotToUpgrade.upgradeCost * robotToUpgrade.levelUpFactor);
  
  await robotToUpgrade.save();
  const updatedUser = await user.save();
  
  await updateQuestProgress(req.user._id, 'UPGRADE_ROBOT', 1);

  // 4. Mettre à jour le succès lié aux améliorations
  const allUpgrades = await Robot.aggregate([
      { $match: { owner: user._id } },
      { $group: { _id: null, totalUpgrades: { $sum: { $subtract: ['$level', 1] } } } }
  ]);
  const totalUpgrades = allUpgrades.length > 0 ? allUpgrades[0].totalUpgrades : 0;
  await updateAchievementProgress(req.io, req.user._id, 'ROBOTS_UPGRADED', totalUpgrades);

  res.status(200).json({ message: `${robotToUpgrade.name} amélioré au niveau ${robotToUpgrade.level} !`, robot: robotToUpgrade, user: updatedUser });
});


// --- ADMIN ROUTES ---
const createRobot = asyncHandler(async (req, res) => {
  const { name, icon, price, miningPower, rarity, stock, isSponsored, levelUpFactor, upgradeCost, category } = req.body;
  const robot = new Robot({ name, icon, price, miningPower, rarity, stock, isSponsored, levelUpFactor, upgradeCost, category });
  const createdRobot = await robot.save();
  
  req.io.emit('robots_updated');
  
  res.status(201).json(createdRobot);
});

const updateRobot = asyncHandler(async (req, res) => {
  const robot = await Robot.findById(req.params.id);
  if (robot) {
    Object.assign(robot, req.body);
    const updatedRobot = await robot.save();
    
    req.io.emit('robots_updated');
    
    res.json(updatedRobot);
  } else { res.status(404); throw new Error('Robot non trouvé'); }
});

const deleteRobot = asyncHandler(async (req, res) => {
  const robot = await Robot.findById(req.params.id);
  if (robot) {
    await Robot.deleteOne({ _id: robot._id });
    
    req.io.emit('robots_updated');
    
    res.json({ message: 'Robot supprimé' });
  } else { res.status(404); throw new Error('Robot non trouvé'); }
});

export { createRobot, getRobots, getRobotById, updateRobot, deleteRobot, purchaseRobot, upgradeRobot, sellRobot };