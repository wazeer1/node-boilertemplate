import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../config/jwt.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and adds user information to request object
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Check for token in query parameters (for email verification links, etc.)
    else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return next(ApiError.unauthorized('Access token required'));
    }

    try {
      // Verify the token
      const decoded = verifyAccessToken(token);
      
      // Add user information to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || []
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token expired'));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(ApiError.unauthorized('Invalid token'));
      }
      throw error;
    }
  } catch (error) {
    next(ApiError.unauthorized('Authentication failed'));
  }
};

/**
 * Optional Authentication Middleware
 * Similar to authenticate but doesn't require a token
 * Useful for routes that can work with or without authentication
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions || []
        };
      } catch (error) {
        // Token is invalid, but we don't throw an error
        // req.user will remain undefined
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Refresh Token Middleware
 * Verifies refresh tokens for token refresh operations
 */
export const authenticateRefresh = async (req, res, next) => {
  try {
    let refreshToken;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      refreshToken = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    } else if (req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      return next(ApiError.unauthorized('Refresh token required'));
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Refresh token expired'));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(ApiError.unauthorized('Invalid refresh token'));
      }
      throw error;
    }
  } catch (error) {
    next(ApiError.unauthorized('Refresh authentication failed'));
  }
};

/**
 * Role-based Access Control Middleware
 * Checks if user has required role
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Permission-based Access Control Middleware
 * Checks if user has required permissions
 */
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Self or Admin Access Middleware
 * Allows users to access their own resources or admins to access any resource
 */
export const selfOrAdmin = (resourceIdField = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
    const isOwner = req.user.id === resourceId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(ApiError.forbidden('Access denied'));
    }

    next();
  };
};
