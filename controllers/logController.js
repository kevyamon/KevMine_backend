import asyncHandler from 'express-async-handler';
import Log from '../models/logModel.js';

// @desc    Get all logs
// @route   GET /api/logs
// @access  Private/Admin
const getLogs = asyncHandler(async (req, res) => {
  const logs = await Log.find({}).sort({ createdAt: -1 });
  res.json(logs);
});

// @desc    Clear all logs
// @route   DELETE /api/logs
// @access  Private/Admin
const clearLogs = asyncHandler(async (req, res) => {
  await Log.deleteMany({});
  res.status(200).json({ message: 'Logs effacés avec succès.' });
});

export { getLogs, clearLogs };