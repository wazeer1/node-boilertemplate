import { Role, User } from '../../models/index.js';
import { connectMongoDB, connectPostgreSQL } from '../connection.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

/**
 * Seed default roles
 */
const seedRoles = async () => {
  try {
    const roles = [
      {
        name: 'admin',
        description: 'Administrator with full access',
        permissions: [
          'admin:all',
          'user:read', 'user:create', 'user:update', 'user:delete', 'user:list',
          'role:read', 'role:create', 'role:update', 'role:delete', 'role:list',
          'auth:login', 'auth:register', 'auth:refresh', 'auth:logout',
          'profile:read', 'profile:update', 'profile:delete',
          'content:read', 'content:create', 'content:update', 'content:delete', 'content:publish',
          'file:upload', 'file:download', 'file:delete', 'file:list'
        ],
        isDefault: false,
        isSystem: true,
        isActive: true
      },
      {
        name: 'user',
        description: 'Regular user with basic permissions',
        permissions: [
          'auth:login', 'auth:register', 'auth:refresh', 'auth:logout',
          'profile:read', 'profile:update',
          'content:read',
          'file:upload', 'file:download', 'file:list'
        ],
        isDefault: true,
        isSystem: true,
        isActive: true
      },
      {
        name: 'moderator',
        description: 'Moderator with content management permissions',
        permissions: [
          'auth:login', 'auth:refresh', 'auth:logout',
          'profile:read', 'profile:update',
          'user:read', 'user:list',
          'content:read', 'content:create', 'content:update', 'content:delete', 'content:publish',
          'file:upload', 'file:download', 'file:delete', 'file:list'
        ],
        isDefault: false,
        isSystem: false,
        isActive: true
      }
    ];

    for (const roleData of roles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        logger.info(`Role '${roleData.name}' created successfully`);
      } else {
        logger.info(`Role '${roleData.name}' already exists`);
      }
    }

    logger.info('Roles seeding completed');
  } catch (error) {
    logger.error('Error seeding roles:', error);
    throw error;
  }
};

/**
 * Seed admin user
 */
const seedAdminUser = async () => {
  try {
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      throw new Error('Admin role not found. Please seed roles first.');
    }

    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: adminRole._id,
        isEmailVerified: true,
        isActive: true
      });

      await adminUser.save();
      logger.info('Admin user created successfully');
      logger.info('Email: admin@example.com, Password: Admin@123');
    } else {
      logger.info('Admin user already exists');
    }
  } catch (error) {
    logger.error('Error seeding admin user:', error);
    throw error;
  }
};

/**
 * Seed sample users
 */
const seedSampleUsers = async () => {
  try {
    const userRole = await Role.findOne({ name: 'user' });
    if (!userRole) {
      throw new Error('User role not found. Please seed roles first.');
    }

    const sampleUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'User@123',
        role: userRole._id,
        isEmailVerified: true,
        isActive: true
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'User@123',
        role: userRole._id,
        isEmailVerified: true,
        isActive: true
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        logger.info(`Sample user '${userData.email}' created successfully`);
      } else {
        logger.info(`Sample user '${userData.email}' already exists`);
      }
    }

    logger.info('Sample users seeding completed');
  } catch (error) {
    logger.error('Error seeding sample users:', error);
    throw error;
  }
};

/**
 * Main seeding function
 */
const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // Connect to database
    if (config.databaseType === 'postgresql') {
      await connectPostgreSQL();
    } else {
      await connectMongoDB();
    }

    // Seed in order
    await seedRoles();
    await seedAdminUser();
    await seedSampleUsers();

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
};

/**
 * Clear all data (use with caution)
 */
const clearDatabase = async () => {
  try {
    logger.warn('Clearing all database data...');

    if (config.databaseType === 'postgresql') {
      await connectPostgreSQL();
      // For PostgreSQL, you might want to drop and recreate tables
      logger.warn('PostgreSQL clear not implemented - use with caution');
    } else {
      await connectMongoDB();
      await User.deleteMany({});
      await Role.deleteMany({});
      logger.info('MongoDB data cleared');
    }

    logger.info('Database cleared successfully');
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
};

export {
  seedDatabase,
  seedRoles,
  seedAdminUser,
  seedSampleUsers,
  clearDatabase
};
