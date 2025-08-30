import cron from 'node-cron';
import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';

// On passe maintenant 'io' en paramètre pour pouvoir émettre des événements
export const updatePlayerRanks = asyncHandler(async (io) => {
  console.log('Running recurring rank update...');

  const players = await User.find({ isAdmin: false }).sort({ keviumBalance: -1 });

  const bulkOps = players.map((player, index) => {
    const newRank = index + 1;
    return {
      updateOne: {
        filter: { _id: player._id },
        update: {
          $set: {
            previousRank: player.rank || newRank,
            rank: newRank,
          },
        },
      },
    };
  });

  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps);
    console.log(`Successfully updated ranks for ${bulkOps.length} players.`);
    
    // NOUVEAU : On notifie tout le monde que le classement a changé
    io.emit('leaderboard_updated');
  } else {
    console.log('No players to update.');
  }
});

// La fonction prend maintenant 'io' pour le passer à la tâche
const startRankUpdateScheduler = (io) => {
  // CORRECTION : '*/1 * * * *' signifie "toutes les minutes"
  cron.schedule('*/1 * * * *', () => {
    updatePlayerRanks(io);
  });

  console.log('Rank update scheduler started. Will run every minute.');
};

export default startRankUpdateScheduler;