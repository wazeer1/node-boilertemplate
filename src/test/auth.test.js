import request from 'supertest';
import app from '../app.js';
import { User, Role } from '../models/index.js';
import { testUtils } from './setup.js';

// Mock models
jest.mock('../models/index.js');

describe('Authentication API', () => {
  let testRole;
  let testUser;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup test data
    testRole = {
      _id: '507f1f77bcf86cd799439011',
      name: 'user',
      permissions: ['auth:login', 'auth:register']
    };
    
    testUser = {
      _id: '507f1f77bcf86cd799439012',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: '$2b$10$hashedpassword',
      role: testRole._id,
      isEmailVerified: true,
      isActive: true,
      isDeleted: false
    };
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = testUtils.createTestUser();
      
      // Mock Role.findOne to return default role
      Role.findOne.mockResolvedValue(testRole);
      
      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);
      
      // Mock User.save to return the created user
      const mockUser = { ...testUser, ...userData };
      User.prototype.save = jest.fn().mockResolvedValue(mockUser);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should return 400 if user already exists', async () => {
      const userData = testUtils.createTestUser();
      
      // Mock User.findOne to return existing user
      User.findOne.mockResolvedValue(testUser);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');
    });

    it('should return 400 for invalid input', async () => {
      const invalidUserData = {
        firstName: '',
        email: 'invalid-email',
        password: '123'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123'
      };
      
      // Mock User.findOne to return user
      User.findOne.mockResolvedValue(testUser);
      
      // Mock bcrypt comparison
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };
      
      // Mock User.findOne to return user
      User.findOne.mockResolvedValue(testUser);
      
      // Mock bcrypt comparison to return false
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(false);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 404 if user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123'
      };
      
      // Mock User.findOne to return null
      User.findOne.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      // Mock authentication middleware
      const mockAuthMiddleware = (req, res, next) => {
        req.user = testUser;
        next();
      };
      
      // Apply mock middleware
      app.use('/api/auth/me', mockAuthMiddleware);
      
      const response = await request(app)
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const logoutData = {
        refreshToken: 'valid-refresh-token'
      };
      
      const response = await request(app)
        .post('/api/auth/logout')
        .send(logoutData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should return 400 if refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });
});
