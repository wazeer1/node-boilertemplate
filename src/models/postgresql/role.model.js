import { DataTypes, Model } from 'sequelize';

class Role extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          validate: {
            len: [2, 50],
            is: /^[a-zA-Z0-9_-]+$/
          }
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            len: [5, 500]
          }
        },
        permissions: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
          validate: {
            isValidPermissions(value) {
              const validPermissions = [
                'admin:all',
                'user:read',
                'user:create',
                'user:update',
                'user:delete',
                'user:list',
                'role:read',
                'role:create',
                'role:update',
                'role:delete',
                'role:list',
                'auth:login',
                'auth:register',
                'auth:refresh',
                'auth:logout',
                'profile:read',
                'profile:update',
                'profile:delete',
                'content:read',
                'content:create',
                'content:update',
                'content:delete',
                'content:publish',
                'file:upload',
                'file:download',
                'file:delete',
                'file:list'
              ];

              const invalidPermissions = value.filter(perm => !validPermissions.includes(perm));
              if (invalidPermissions.length > 0) {
                throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
              }
            }
          }
        },
        isDefault: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        isSystem: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {}
        }
      },
      {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        timestamps: true,
        paranoid: true, // Soft deletes
        indexes: [
          {
            unique: true,
            fields: ['name']
          },
          {
            fields: ['isDefault']
          },
          {
            fields: ['isSystem']
          },
          {
            fields: ['isActive']
          },
          {
            fields: ['isDeleted']
          }
        ],
        hooks: {
          beforeSave: async role => {
            // Ensure only one default role
            if (role.isDefault && role.changed('isDefault')) {
              await Role.update(
                { isDefault: false },
                {
                  where: {
                    id: { [require('sequelize').Op.ne]: role.id },
                    isDeleted: false
                  }
                }
              );
            }

            // Prevent system role modifications
            if (role.isSystem && role.changed()) {
              const originalRole = await Role.findByPk(role.id);
              if (originalRole && originalRole.isSystem) {
                throw new Error('Cannot modify system roles');
              }
            }
          },

          beforeDestroy: async role => {
            if (role.isSystem) {
              throw new Error('Cannot delete system roles');
            }

            // Check if role is assigned to any users
            const userCount = await require('./user.model.js').default.count({
              where: { roleId: role.id }
            });

            if (userCount > 0) {
              throw new Error('Cannot delete role that is assigned to users');
            }
          }
        }
      }
    );
  }

  static associate(models) {
    // Define associations
    this.hasMany(models.User, {
      foreignKey: 'roleId',
      as: 'users'
    });
  }

  // Instance methods
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.permissions.includes('admin:all');
  }

  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  addPermission(permission) {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
    }
  }

  removePermission(permission) {
    this.permissions = this.permissions.filter(p => p !== permission);
  }

  // Virtual fields
  get permissionCount() {
    return this.permissions.length;
  }

  get isAdmin() {
    return this.permissions.includes('admin:all');
  }

  // Static methods
  static async findByName(name) {
    return this.findOne({
      where: {
        name,
        isDeleted: false
      }
    });
  }

  static async findDefault() {
    return this.findOne({
      where: {
        isDefault: true,
        isActive: true,
        isDeleted: false
      }
    });
  }

  static async findSystem() {
    return this.findAll({
      where: {
        isSystem: true,
        isDeleted: false
      }
    });
  }

  static async findActive() {
    return this.findAll({
      where: {
        isActive: true,
        isDeleted: false
      }
    });
  }

  static async findByPermission(permission) {
    return this.findAll({
      where: {
        permissions: {
          [require('sequelize').Op.contains]: [permission]
        },
        isActive: true,
        isDeleted: false
      }
    });
  }

  static async search(query, options = {}) {
    const { Op } = require('sequelize');

    return this.findAll({
      where: {
        [Op.or]: [{ name: { [Op.iLike]: `%${query}%` } }, { description: { [Op.iLike]: `%${query}%` } }],
        isDeleted: false
      },
      ...options
    });
  }
}

export default Role;
