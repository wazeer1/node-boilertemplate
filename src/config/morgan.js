import morgan from 'morgan';
import logger from '../utils/logger.js';

// Custom token for request body (for POST/PUT requests)
morgan.token('body', (req) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    return JSON.stringify(req.body);
  }
  return '';
});

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  if (!res._header || !req._startAt) return '';
  const diff = process.hrtime(req._startAt);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(2);
});

// Custom token for user agent
morgan.token('user-agent', (req) => {
  return req.get('User-Agent') || 'Unknown';
});

// Custom token for IP address
morgan.token('ip', (req) => {
  return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
});

// Development format
export const devFormat = ':method :url :status :response-time-ms ms - :ip - :user-agent';

// Production format (more concise)
export const prodFormat = ':method :url :status :response-time-ms ms - :ip';

// Custom format for detailed logging
export const detailedFormat = ':method :url :status :response-time-ms ms - :ip - :user-agent - :body';

// Create custom stream for Winston logger
export const createStream = () => ({
  write: (message) => {
    logger.info(message.trim());
  }
});

// Get appropriate format based on environment
export const getFormat = (env) => {
  switch (env) {
    case 'development':
      return devFormat;
    case 'production':
      return prodFormat;
    default:
      return detailedFormat;
  }
};

// Create Morgan middleware with appropriate configuration
export const createMorganMiddleware = (env = 'development') => {
  const format = getFormat(env);
  const stream = createStream();
  
  return morgan(format, { stream });
};
