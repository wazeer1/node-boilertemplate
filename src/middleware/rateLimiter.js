import rateLimit from 'express-rate-limit';
import config from '../config/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * General Rate Limiter
 * Applies to all routes by default
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes by default
  max: config.rateLimit.max, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many requests from this IP, please try again later.'));
  }
});

/**
 * Strict Rate Limiter
 * For sensitive routes like login, registration
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many attempts, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many attempts, please try again later.'));
  }
});

/**
 * API Key Rate Limiter
 * For routes that require API keys
 */
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each API key to 1000 requests per hour
  keyGenerator: (req) => {
    // Use API key from headers or query params
    return req.headers['x-api-key'] || req.query.apiKey || req.ip;
  },
  message: {
    success: false,
    message: 'API rate limit exceeded.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('API rate limit exceeded.'));
  }
});

/**
 * Upload Rate Limiter
 * For file upload routes
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    success: false,
    message: 'Upload limit exceeded, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Upload limit exceeded, please try again later.'));
  }
});

/**
 * Search Rate Limiter
 * For search and query routes
 */
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 searches per minute
  message: {
    success: false,
    message: 'Search limit exceeded, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Search limit exceeded, please try again later.'));
  }
});

/**
 * Dynamic Rate Limiter
 * Creates a rate limiter with custom settings
 */
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      message: 'Rate limit exceeded.',
      statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    handler: (req, res, next) => {
      next(ApiError.tooManyRequests('Rate limit exceeded.'));
    }
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  return rateLimit(finalOptions);
};

/**
 * Whitelist Rate Limiter
 * Applies rate limiting to all IPs except whitelisted ones
 */
export const whitelistRateLimiter = (whitelist = []) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    skip: (req) => whitelist.includes(req.ip),
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(ApiError.tooManyRequests('Too many requests from this IP, please try again later.'));
    }
  });
};
