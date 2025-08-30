import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select('-password');

      // CORRECTION : On autorise la déconnexion quel que soit le statut
      if (req.originalUrl === '/api/users/logout') {
        return next();
      }

      if (req.user.status === 'banned' || req.user.status === 'suspended') {
        res.status(403); // Utiliser 403 Forbidden est plus sémantique
        throw new Error('Votre compte est banni ou suspendu.');
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Non autorisé, token invalide');
    }
  } else {
    res.status(401);
    throw new Error('Non autorisé, pas de token');
  }
});

const adminProtect = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Non autorisé en tant qu\'administrateur');
  }
};

const superAdminProtect = (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Non autorisé en tant que super administrateur');
  }
};

export { protect, adminProtect, superAdminProtect };