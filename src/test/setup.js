import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test timeout
jest.setTimeout(10000);

// Mock database connections for testing
jest.mock('../database/connection.js', () => ({
  connectMongoDB: jest.fn().mockResolvedValue({}),
  connectPostgreSQL: jest.fn().mockResolvedValue({}),
  getDatabaseConnection: jest.fn().mockResolvedValue({}),
  closeConnections: jest.fn().mockResolvedValue({}),
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
}));

// Mock email service for testing
jest.mock('../services/email.service.js', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendVerificationEmail: jest.fn().mockResolvedValue({}),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({}),
  sendWelcomeEmail: jest.fn().mockResolvedValue({}),
  sendAccountDeletionEmail: jest.fn().mockResolvedValue({}),
  sendSecurityAlertEmail: jest.fn().mockResolvedValue({}),
  testEmailConfig: jest.fn().mockResolvedValue(true)
}));

// Mock logger for testing
jest.mock('../utils/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn()
  }
}));

// Setup test database cleanup
beforeAll(async () => {
  // Any global setup before all tests
});

afterAll(async () => {
  // Any global cleanup after all tests
});

// Setup before each test
beforeEach(async () => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(async () => {
  // Any cleanup after each test
});

// Global test utilities
global.testUtils = {
  // Helper to create test user data
  createTestUser: (overrides = {}) => ({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'TestPassword123',
    ...overrides
  }),

  // Helper to create test role data
  createTestRole: (overrides = {}) => ({
    name: 'test-role',
    description: 'Test role for testing',
    permissions: ['test:read'],
    isDefault: false,
    isSystem: false,
    isActive: true,
    ...overrides
  }),

  // Helper to generate test JWT tokens
  generateTestToken: (payload = {}) => {
    const basePayload = {
      userId: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...payload
    };
    
    // This is a mock token - in real tests you'd use the actual JWT service
    return `mock.jwt.token.${Buffer.from(JSON.stringify(basePayload)).toString('base64')}`;
  },

  // Helper to create test request object
  createTestRequest: (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    headers: {},
    user: null,
    ...overrides
  }),

  // Helper to create test response object
  createTestResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  },

  // Helper to create test next function
  createTestNext: () => jest.fn()
};

// Export for use in tests
export default global.testUtils;
