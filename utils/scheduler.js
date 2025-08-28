import cron from 'node-cron';
import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';

// Cette fonction met à jour le classement de tous les joueurs
const updatePlayerRanks = asyncHandler(async () => {
  console.log('Running daily rank update...');

  // 1. Récupérer tous les joueurs non-admin, triés par leur richesse
  const players = await User.find({ isAdmin: false }).sort({ keviumBalance: -1 });

  // 2. Créer une liste d'opérations à exécuter en une seule fois (plus performant)
  const bulkOps = players.map((player, index) => {
    const newRank = index + 1;
    return {
      updateOne: {
        filter: { _id: player._id },
        update: {
          $set: {
            previousRank: player.rank || newRank, // Si l'ancien rang n'existe pas, on prend le nouveau
            rank: newRank,
          },
        },
      },
    };
  });

  // 3. Exécuter toutes les mises à jour en une seule requête à la base de données
  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps);
    console.log(`Successfully updated ranks for ${bulkOps.length} players.`);
  } else {
    console.log('No players to update.');
  }
});

// Planifier l'exécution de la tâche tous les jours à minuit
const startRankUpdateScheduler = () => {
  // '0 0 * * *' signifie : à la minute 0, de l'heure 0 (minuit), tous les jours
  cron.schedule('0 0 * * *', () => {
    updatePlayerRanks();
  });

  console.log('Rank update scheduler started. Will run every day at midnight.');
};

export default startRankUpdateScheduler;