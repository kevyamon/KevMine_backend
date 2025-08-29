import asyncHandler from 'express-async-handler';
import GameSetting from '../models/gameSettingModel.js';

// @desc    Get game settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = asyncHandler(async (req, res) => {
  // On s'assure qu'il n'y a qu'un seul document de paramètres
  const settings = await GameSetting.findOne({ key: 'globalSettings' });
  if (!settings) {
    // Si aucun paramètre n'est trouvé, on en crée un avec les valeurs par défaut
    const newSettings = await GameSetting.create({ key: 'globalSettings' });
    return res.json(newSettings);
  }
  res.json(settings);
});

// @desc    Update game settings
// @route   PUT /api/admin/settings
// @access  Private/SuperAdmin
const updateSettings = asyncHandler(async (req, res) => {
  const { salesCommissionRate } = req.body;

  // On cherche le document unique de paramètres et on le met à jour
  const settings = await GameSetting.findOneAndUpdate(
    { key: 'globalSettings' },
    { salesCommissionRate },
    { new: true, upsert: true } // new: true pour retourner le doc mis à jour, upsert: true pour le créer s'il n'existe pas
  );

  // CORRECTION : Émettre un événement à tous les clients
  if (req.io) {
    req.io.emit('settings_updated', { newRate: settings.salesCommissionRate });
  }

  res.json(settings);
});

export { getSettings, updateSettings };