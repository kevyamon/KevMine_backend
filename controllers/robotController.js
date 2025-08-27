import asyncHandler from 'express-async-handler';
import Robot from '../models/robotModel.js';

// @desc    Get all robots
// @route   GET /api/robots
// @access  Public
const getRobots = asyncHandler(async (req, res) => {
  const robots = await Robot.find({});
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

// @desc    Create a new robot
// @route   POST /api/robots
// @access  Private/Admin
const createRobot = asyncHandler(async (req, res) => {
  const { name, icon, price, miningPower, rarity, stock, isSponsored } = req.body;

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
  const { name, icon, price, miningPower, rarity, stock, isSponsored } = req.body;

  const robot = await Robot.findById(req.params.id);

  if (robot) {
    robot.name = name || robot.name;
    robot.icon = icon || robot.icon;
    robot.price = price || robot.price;
    robot.miningPower = miningPower || robot.miningPower;
    robot.rarity = rarity || robot.rarity;
    robot.stock = stock || robot.stock;
    robot.isSponsored = isSponsored !== undefined ? isSponsored : robot.isSponsored;

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

export { createRobot, getRobots, getRobotById, updateRobot, deleteRobot };