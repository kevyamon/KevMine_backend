import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Log from '../models/logModel.js';
import generateTokens from '../utils/generateToken.js';
import sendEmail from '../utils/emailService.js';
import crypto from 'crypto';
import RefreshToken from '../models/refreshTokenModel.js';
import jwt from 'jsonwebtoken';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier }, { name: identifier }, { phone: identifier }],
  });

  if (!user) {
    await Log.create({
      action: 'login_fail',
      description: `Tentative de connexion échouée pour l'identifiant: ${identifier}`,
      email: identifier,
      ip: req.ip,
    });
    res.status(401);
    throw new Error('Identifiant ou mot de passe invalide');
  }

  if (user.isLocked) {
    res.status(429);
    throw new Error('Trop de tentatives de connexion échouées. Veuillez réessayer dans 10 minutes.');
  }

  if (await user.matchPassword(password)) {
    if (user.status === 'banned') {
      res.status(401);
      throw new Error('Votre compte est temporairement suspendu.');
    }
    if (user.status === 'inactive') {
      res.status(401);
      throw new Error('Votre compte est inactif.');
    }
    
    await Log.create({
      user: user._id,
      action: 'login_success',
      description: `Connexion réussie pour l'utilisateur: ${user.email}`,
      ip: req.ip,
    });

    const isNewUser = false;
    await generateTokens(res, user._id);
    await user.resetLoginAttempts();

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({ ...userData, isNewUser });
    
    req.io.to(req.io.getAdminSockets()).emit('user_login', {
      userId: user._id,
      name: user.name,
      email: user.email,
      timestamp: new Date(),
    });
  } else {
    await user.incLoginAttempts();
    await Log.create({
      action: 'login_fail',
      description: `Mot de passe incorrect pour l'utilisateur: ${user.email}`,
      user: user._id,
      ip: req.ip,
    });
    
    if (user.isLocked) {
      req.io.to(req.io.getAdminSockets()).emit('user_locked', {
        userId: user._id,
        name: user.name,
        email: user.email,
        timestamp: new Date(),
      });
    }

    res.status(401);
    throw new Error('Identifiant ou mot de passe invalide');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { name }] });
  if (userExists) {
    res.status(400);
    throw new Error('Un utilisateur avec cet email ou ce nom existe déjà');
  }

  if (phone) {
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      res.status(400);
      throw new Error('Un utilisateur avec ce numéro de téléphone existe déjà');
    }
  }

  const isSuperAdmin = email === process.env.SUPER_ADMIN_EMAIL;

  const userDataToCreate = {
    name,
    email,
    password,
    phone,
    isAdmin: isSuperAdmin,
    isSuperAdmin: isSuperAdmin,
  };

  if (isSuperAdmin) {
    userDataToCreate.keviumBalance = 999999999;
  }

  const user = await User.create(userDataToCreate);

  if (user) {
    const isNewUser = true;
    await generateTokens(res, user._id);
    const userData = user.toObject();
    delete userData.password;
    res.status(201).json({ ...userData, isNewUser });
  } else {
    res.status(400);
    throw new Error('Données utilisateur invalides');
  }
});

// @desc    Refresh access token using refresh token
// @route   POST /api/users/refresh-token
// @access  Public
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refresh;

  if (!refreshToken) {
    res.status(401);
    throw new Error('Non autorisé, aucun jeton de rafraîchissement fourni');
  }

  const existingToken = await RefreshToken.findOne({ token: refreshToken });
  if (!existingToken) {
    res.status(401);
    throw new Error('Non autorisé, jeton de rafraîchissement invalide');
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
    if (err) {
      await RefreshToken.deleteOne({ token: refreshToken });
      res.status(401);
      throw new Error('Non autorisé, jeton de rafraîchissement expiré');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401);
      throw new Error('Utilisateur non trouvé');
    }

    const newAccessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.cookie('jwt', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'none',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: 'Access token rafraîchi avec succès.' });
  });
});

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.cookie('refresh', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  
  await RefreshToken.deleteOne({ user: req.user._id });

  res.status(200).json({ message: 'Déconnexion réussie' });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  // CORRECTION : On peuple l'inventaire ET la catégorie de chaque robot
  const user = await User.findById(req.user._id).populate({
    path: 'inventory',
    populate: {
      path: 'category',
      model: 'Category'
    }
  });

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.photo = req.body.photo || user.photo;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const userData = updatedUser.toObject();
    delete userData.password;

    res.status(200).json(userData);
  } else {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }
});

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('Utilisateur non trouvé avec cet email');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  await user.save({ validateBeforeSave: false });
  
  await Log.create({
    user: user._id,
    action: 'password_reset',
    description: `Demande de réinitialisation de mot de passe pour l'utilisateur: ${user.email}`,
    ip: req.ip,
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `Vous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur ce lien pour réinitialiser votre mot de passe : \n\n ${resetUrl} \n\n Si vous n'avez pas fait cette demande, veuillez l'ignorer. Le lien expirera dans 15 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de mot de passe',
      textContent: message,
    });

    res.status(200).json({ success: true, message: 'Email envoyé' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error('Échec de l\'envoi de l\'email, veuillez réessayer');
  }
});

// @desc    Reset password
// @route   PUT /api/users/reset-password/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Jeton invalide ou expiré');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({ success: true, message: 'Mot de passe réinitialisé' });
});

export {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
};