import config from './index.js';

// CORS configuration
export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.cors.origin,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

// Development CORS options (more permissive)
export const devCorsOptions = {
  ...corsOptions,
  origin: true, // Allow all origins in development
  credentials: true
};

// Production CORS options (strict)
export const prodCorsOptions = {
  ...corsOptions,
  origin: config.cors.origin,
  credentials: config.cors.credentials
};

// Get appropriate CORS options based on environment
export const getCorsOptions = (env = 'development') => {
  switch (env) {
    case 'production':
      return prodCorsOptions;
    case 'development':
    default:
      return devCorsOptions;
  }
};
