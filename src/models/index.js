import config from '../config/index.js';

// Import MongoDB models
import UserMongo from './mongodb/user.model.js';
import RoleMongo from './mongodb/role.model.js';
import TokenMongo from './mongodb/token.model.js';

// Import PostgreSQL models
import UserPostgres from './postgresql/user.model.js';
import RolePostgres from './postgresql/role.model.js';
import TokenPostgres from './postgresql/token.model.js';

// Database adapter selection
const getDatabaseType = () => {
  // You can implement logic here to determine which database to use
  // For now, we'll use MongoDB as default
  return process.env.DATABASE_TYPE || 'mongodb';
};

// Export models based on database type
const databaseType = getDatabaseType();

let User, Role, Token;

if (databaseType === 'postgresql') {
  User = UserPostgres;
  Role = RolePostgres;
  Token = TokenPostgres;
} else {
  User = UserMongo;
  Role = RoleMongo;
  Token = TokenMongo;
}

// Export all models
export {
  User,
  Role,
  Token,
  UserMongo,
  RoleMongo,
  TokenMongo,
  UserPostgres,
  RolePostgres,
  TokenPostgres
};

// Export database type
export { databaseType };

// Export model initialization function
export const initializeModels = async () => {
  try {
    if (databaseType === 'postgresql') {
      // Initialize Sequelize models
      await UserPostgres.sync();
      await RolePostgres.sync();
      await TokenPostgres.sync();
      
      // Set up associations
      UserPostgres.belongsTo(RolePostgres, { foreignKey: 'roleId' });
      RolePostgres.hasMany(UserPostgres, { foreignKey: 'roleId' });
      
      console.log('PostgreSQL models initialized successfully');
    } else {
      // MongoDB models are automatically initialized when imported
      console.log('MongoDB models initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing models:', error);
    throw error;
  }
};

// Export model utilities
export const getModelByName = (modelName) => {
  const models = {
    User,
    Role,
    Token
  };
  
  return models[modelName];
};

export const getAllModels = () => {
  return {
    User,
    Role,
    Token
  };
};
