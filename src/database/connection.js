import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let mongoConnection = null;
let postgresConnection = null;

/**
 * Connect to MongoDB
 */
const connectMongoDB = async () => {
  try {
    if (mongoConnection) {
      return mongoConnection;
    }

    const mongoUrl = config.mongodb.url;
    
    mongoConnection = await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    logger.info('MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return mongoConnection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

/**
 * Connect to PostgreSQL
 */
const connectPostgreSQL = async () => {
  try {
    if (postgresConnection) {
      return postgresConnection;
    }

    postgresConnection = new Sequelize(
      config.postgresql.database,
      config.postgresql.username,
      config.postgresql.password,
      {
        host: config.postgresql.host,
        port: config.postgresql.port,
        dialect: 'postgres',
        logging: config.nodeEnv === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true
        }
      }
    );

    // Test the connection
    await postgresConnection.authenticate();
    logger.info('PostgreSQL connected successfully');

    return postgresConnection;
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

/**
 * Get database connection based on configuration
 */
const getDatabaseConnection = async () => {
  const databaseType = config.databaseType || 'mongodb';
  
  if (databaseType === 'postgresql') {
    return await connectPostgreSQL();
  } else {
    return await connectMongoDB();
  }
};

/**
 * Close all database connections
 */
const closeConnections = async () => {
  try {
    if (mongoConnection) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }
    
    if (postgresConnection) {
      await postgresConnection.close();
      logger.info('PostgreSQL connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

/**
 * Health check for database connections
 */
const healthCheck = async () => {
  try {
    const databaseType = config.databaseType || 'mongodb';
    
    if (databaseType === 'postgresql') {
      if (postgresConnection) {
        await postgresConnection.authenticate();
        return { status: 'healthy', database: 'postgresql' };
      }
    } else {
      if (mongoConnection && mongoose.connection.readyState === 1) {
        return { status: 'healthy', database: 'mongodb' };
      }
    }
    
    return { status: 'unhealthy', database: databaseType };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
};

export {
  connectMongoDB,
  connectPostgreSQL,
  getDatabaseConnection,
  closeConnections,
  healthCheck,
  mongoConnection,
  postgresConnection
};
