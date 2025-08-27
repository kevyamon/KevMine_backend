import jwt from 'jsonwebtoken';
import RefreshToken from '../models/refreshTokenModel.js';

const generateTokens = async (res, userId) => {
  // Generate Access Token (short-lived)
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  // Generate Refresh Token (long-lived)
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

  // Save Refresh Token to database
  await RefreshToken.create({
    user: userId,
    token: refreshToken,
  });

  // Set tokens in cookies
  res.cookie('jwt', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export default generateTokens;