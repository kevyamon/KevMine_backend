import mongoose from 'mongoose';

const gameSettingSchema = mongoose.Schema({
  // Utiliser une clé unique pour s'assurer qu'on n'a qu'un seul document de paramètres
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'globalSettings',
  },
  salesCommissionRate: {
    type: Number,
    required: true,
    default: 0.1, // Commission de 10% par défaut
    min: 0,
    max: 1,
  },
  // On pourra ajouter d'autres paramètres globaux ici à l'avenir
});

// Créer le document de paramètres s'il n'existe pas
gameSettingSchema.statics.initialize = async function () {
  const settings = await this.findOne({ key: 'globalSettings' });
  if (!settings) {
    console.log('Initializing game settings...');
    await this.create({ key: 'globalSettings' });
  }
};

const GameSetting = mongoose.model('GameSetting', gameSettingSchema);

// Initialiser les paramètres au démarrage
GameSetting.initialize().catch(err => console.error('Failed to initialize game settings:', err));

export default GameSetting;