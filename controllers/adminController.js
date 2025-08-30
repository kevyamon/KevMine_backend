import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Log from '../models/logModel.js';
import generateTokens from '../utils/generateToken.js';
import sendEmail from '../utils/emailService.js';
import { getStatusChangeTemplate } from '../utils/emailTemplates.js';
import { updatePlayerRanks } from '../utils/scheduler.js';
import { createNotification } from '../utils/notificationService.js'; // 1. Importer le service

const grantBonusToUser = asyncHandler(async (req, res) => {
  const { userId, amount, reason } = req.body;
  const adminId = req.user._id;

  if (!userId || !amount || !reason) {
    res.status(400);
    throw new Error('Veuillez fournir un utilisateur, un montant et un motif.');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur non trouvé.');
  }

  user.keviumBalance += Number(amount);
  await user.save();

  await Log.create({
    user: adminId,
    action: 'bonus_granted',
    description: `Bonus de ${amount} KVM accordé à ${user.name} (Raison: ${reason})`,
    ip: req.ip,
  });

  const socketId = req.io.getSocketIdByUserId(user._id.toString());
  if (socketId) {
    req.io.to(socketId).emit('bonus_granted', {
      amount,
      reason,
      keviumBalance: user.keviumBalance,
    });
  }

  // 2. Créer une notification pour le bonus
  await createNotification(
    req.io,
    userId,
    `Vous avez reçu un bonus de ${amount} KVM ! Motif : ${reason}`,
    'bonus'
  );

  res.status(200).json({
    message: `Bonus de ${amount} KVM accordé à ${user.name} avec succès.`,
    user,
  });
});

// ... (Le reste du fichier reste identique)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    const originalStatus = user.status;
    const originalIsAdmin = user.isAdmin;

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin;
    user.status = req.body.status || user.status;

    const updatedUser = await user.save();

    if (updatedUser.status !== originalStatus) {
      const socketId = req.io.getSocketIdByUserId(updatedUser._id.toString());
      if (socketId) {
        req.io.to(socketId).emit('status_update', {
          status: updatedUser.status,
        });
      }
      
      const emailContent = getStatusChangeTemplate(updatedUser.name, updatedUser.status, `Votre compte a été mis à jour par l'administration. Nouveau statut : ${updatedUser.status}.`);
      await sendEmail({
        email: updatedUser.email,
        subject: `Mise à jour de statut de votre compte KevMine`,
        htmlContent: emailContent
      });

      await Log.create({
        user: updatedUser._id,
        action: `user_${updatedUser.status}`,
        description: `Statut de l'utilisateur ${updatedUser.email} mis à jour par l'admin. Nouveau statut: ${updatedUser.status}`,
        ip: req.ip,
      });
    }

    if (updatedUser.isAdmin !== originalIsAdmin && updatedUser.isAdmin) {
      const emailContent = getStatusChangeTemplate(updatedUser.name, 'promoted_to_admin', `Félicitations ! Vous avez été promu au statut d'administrateur sur KevMine.`);
      await sendEmail({
        email: updatedUser.email,
        subject: `Félicitations ! Promotion au statut d'administrateur`,
        htmlContent: emailContent
      });

      await Log.create({
        user: updatedUser._id,
        action: 'admin_promotion',
        description: `L'utilisateur ${updatedUser.email} a été promu administrateur par l'admin.`,
        ip: req.ip,
      });
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      status: updatedUser.status,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

const triggerRankUpdate = asyncHandler(async (req, res) => {
  try {
    await updatePlayerRanks();
    res.status(200).json({ message: 'Mise à jour manuelle du classement terminée avec succès.' });
  } catch (error) {
    res.status(500);
    throw new Error('Une erreur est survenue lors de la mise à jour du classement.');
  }
});

const getLockedUsers = asyncHandler(async (req, res) => {
  const lockedUsers = await User.find({ lockUntil: { $gt: Date.now() } });
  res.json(lockedUsers);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error('Cannot delete admin user');
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }

  if (user.email === process.env.SUPER_ADMIN_EMAIL) {
    res.status(403);
    throw new Error('Vous ne pouvez pas modifier le statut du Super Administrateur');
  }

  const originalStatus = user.status;
  user.status = status;
  await user.save();

  await generateTokens(res, user._id);

  const socketId = req.io.getSocketIdByUserId(user._id.toString());
  if (socketId) {
    req.io.to(socketId).emit('status_update', {
      status: user.status,
    });
  }
  
  req.io.to(req.io.getAdminSockets()).emit('user_status_change', {
    userId: user._id,
    name: user.name,
    email: user.email,
    newStatus: user.status,
    timestamp: new Date(),
  });

  if (user.status !== originalStatus) {
    const emailContent = getStatusChangeTemplate(user.name, user.status, `Votre statut de compte a été mis à jour par un administrateur. Nouveau statut : ${user.status}.`);
    await sendEmail({
      email: user.email,
      subject: `Mise à jour de statut de votre compte KevMine`,
      htmlContent: emailContent
    });

    await Log.create({
      user: user._id,
      action: `user_${user.status}`,
      description: `Statut de l'utilisateur ${user.email} mis à jour par le super admin. Nouveau statut: ${user.status}`,
      ip: req.ip,
    });
  }

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin,
    status: user.status,
  });
});

const unlockUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    if (user.email === process.env.SUPER_ADMIN_EMAIL) {
        res.status(403);
        throw new Error('Vous ne pouvez pas déverrouiller le compte du Super Administrateur');
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
        user.lockUntil = undefined;
        user.loginAttempts = 0;
        await user.save();
        
        req.io.to(req.io.getAdminSockets()).emit('user_unlocked', {
            userId: user._id,
            name: user.name,
            email: user.email,
            timestamp: new Date(),
        });

        res.status(200).json({ message: 'Compte déverrouillé avec succès.' });
    } else {
        res.status(400);
        throw new Error('Ce compte n\'est pas verrouillé.');
    }
});

export {
  getUsers,
  getLockedUsers,
  deleteUser,
  getUserById,
  updateUser,
  updateUserStatus,
  unlockUser,
  triggerRankUpdate,
  grantBonusToUser,
};