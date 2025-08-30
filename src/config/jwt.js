import jwt from 'jsonwebtoken';
import config from './index.js';
import logger from '../utils/logger.js';

// Generate access token
export const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
};

// Generate refresh token
export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    logger.error('Error verifying access token:', error);
    throw error;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    logger.error('Error verifying refresh token:', error);
    throw error;
  }
};

// Decode token without verification (for getting payload)
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token:', error);
    throw error;
  }
};

// Get token expiration time
export const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded ? new Date(decoded.exp * 1000) : null;
  } catch (error) {
    logger.error('Error getting token expiration:', error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  try {
    const expiration = getTokenExpiration(token);
    return expiration ? expiration < new Date() : true;
  } catch (error) {
    logger.error('Error checking token expiration:', error);
    return true;
  }
};
