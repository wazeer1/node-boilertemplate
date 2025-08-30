import { Token } from '../models/index.js';
import { verifyRefreshToken as verifyJWTRefreshToken } from '../config/jwt.js';
import ApiError from '../utils/ApiError.js';

/**
 * Store refresh token in database
 */
const storeRefreshToken = async (userId, token, metadata = {}) => {
  try {
    const tokenDoc = new Token({
      userId,
      token,
      type: 'refresh',
      metadata
    });

    await tokenDoc.save();
    return tokenDoc;
  } catch (error) {
    throw ApiError.internalError('Failed to store refresh token');
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async token => {
  try {
    // First verify the JWT signature
    const decoded = await verifyJWTRefreshToken(token);

    // Then check if token exists in database and is valid
    const tokenDoc = await Token.findValidToken(token, 'refresh');
    if (!tokenDoc) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Check if refresh token exists and is valid
 */
const checkRefreshToken = async token => {
  try {
    const tokenDoc = await Token.findValidToken(token, 'refresh');
    return !!tokenDoc;
  } catch (error) {
    return false;
  }
};

/**
 * Remove refresh token from database
 */
const removeRefreshToken = async token => {
  try {
    const result = await Token.findOneAndUpdate({ token, type: 'refresh' }, { isRevoked: true }, { new: true });

    return result;
  } catch (error) {
    throw ApiError.internalError('Failed to remove refresh token');
  }
};

/**
 * Remove all refresh tokens for a user
 */
const removeAllRefreshTokens = async userId => {
  try {
    const result = await Token.revokeAllForUser(userId, 'refresh');
    return result;
  } catch (error) {
    throw ApiError.internalError('Failed to remove refresh tokens');
  }
};

/**
 * Get all active tokens for a user
 */
const getUserTokens = async userId => {
  try {
    const tokens = await Token.findByUserId(userId, 'refresh');
    return tokens;
  } catch (error) {
    throw ApiError.internalError('Failed to get user tokens');
  }
};

/**
 * Revoke specific token
 */
const revokeToken = async tokenId => {
  try {
    const token = await Token.findById(tokenId);
    if (!token) {
      throw ApiError.notFound('Token not found');
    }

    await token.revoke();
    return token;
  } catch (error) {
    throw ApiError.internalError('Failed to revoke token');
  }
};

/**
 * Clean expired tokens
 */
const cleanExpiredTokens = async () => {
  try {
    const result = await Token.cleanExpired();
    return result;
  } catch (error) {
    throw ApiError.internalError('Failed to clean expired tokens');
  }
};

/**
 * Get token statistics
 */
const getTokenStats = async () => {
  try {
    const stats = await Token.getStats();
    return stats;
  } catch (error) {
    throw ApiError.internalError('Failed to get token statistics');
  }
};

/**
 * Store password reset token
 */
const storePasswordResetToken = async (userId, token, expiresAt) => {
  try {
    const tokenDoc = new Token({
      userId,
      token,
      type: 'reset',
      expiresAt
    });

    await tokenDoc.save();
    return tokenDoc;
  } catch (error) {
    throw ApiError.internalError('Failed to store password reset token');
  }
};

/**
 * Verify password reset token
 */
const verifyPasswordResetToken = async token => {
  try {
    const tokenDoc = await Token.findValidToken(token, 'reset');
    if (!tokenDoc) {
      throw ApiError.unauthorized('Invalid or expired password reset token');
    }

    return tokenDoc;
  } catch (error) {
    throw ApiError.unauthorized('Invalid password reset token');
  }
};

/**
 * Store email verification token
 */
const storeEmailVerificationToken = async (userId, token, expiresAt) => {
  try {
    const tokenDoc = new Token({
      userId,
      token,
      type: 'verification',
      expiresAt
    });

    await tokenDoc.save();
    return tokenDoc;
  } catch (error) {
    throw ApiError.internalError('Failed to store email verification token');
  }
};

/**
 * Verify email verification token
 */
const verifyEmailVerificationToken = async token => {
  try {
    const tokenDoc = await Token.findValidToken(token, 'verification');
    if (!tokenDoc) {
      throw ApiError.unauthorized('Invalid or expired email verification token');
    }

    return tokenDoc;
  } catch (error) {
    throw ApiError.unauthorized('Invalid email verification token');
  }
};

export default {
  storeRefreshToken,
  verifyRefreshToken,
  checkRefreshToken,
  removeRefreshToken,
  removeAllRefreshTokens,
  getUserTokens,
  revokeToken,
  cleanExpiredTokens,
  getTokenStats,
  storePasswordResetToken,
  verifyPasswordResetToken,
  storeEmailVerificationToken,
  verifyEmailVerificationToken
};
