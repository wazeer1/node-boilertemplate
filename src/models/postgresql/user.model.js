import { DataTypes, Model } from 'sequelize';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        firstName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          validate: {
            len: [2, 50],
            is: /^[a-zA-Z\s'-]+$/
          }
        },
        lastName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          validate: {
            len: [2, 50],
            is: /^[a-zA-Z\s'-]+$/
          }
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
            len: [5, 100]
          }
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          validate: {
            is: /^[\+]?[1-9][\d]{0,15}$/
          }
        },
        dateOfBirth: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          validate: {
            isPast: true
          }
        },
        gender: {
          type: DataTypes.ENUM('male', 'female', 'other', 'prefer-not-to-say'),
          allowNull: true
        },
        avatar: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        isEmailVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        emailVerificationToken: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        emailVerificationExpires: {
          type: DataTypes.DATE,
          allowNull: true
        },
        passwordResetToken: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        passwordResetExpires: {
          type: DataTypes.DATE,
          allowNull: true
        },
        lastPasswordChange: {
          type: DataTypes.DATE,
          allowNull: true
        },
        loginAttempts: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        lockUntil: {
          type: DataTypes.DATE,
          allowNull: true
        },
        lastSeen: {
          type: DataTypes.DATE,
          allowNull: true
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        isSuspended: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        suspensionReason: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        suspendedUntil: {
          type: DataTypes.DATE,
          allowNull: true
        },
        preferences: {
          type: DataTypes.JSONB,
          defaultValue: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: true
            }
          }
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {}
        }
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        paranoid: true, // Soft deletes
        indexes: [
          {
            unique: true,
            fields: ['email']
          },
          {
            fields: ['roleId']
          },
          {
            fields: ['isActive']
          },
          {
            fields: ['isDeleted']
          },
          {
            fields: ['createdAt']
          },
          {
            fields: ['lastSeen']
          }
        ],
        hooks: {
          beforeSave: async user => {
            if (user.changed('password')) {
              user.lastPasswordChange = new Date();
            }
          },
          beforeUpdate: async user => {
            if (user.changed('lastSeen')) {
              user.lastSeen = new Date();
            }
          }
        }
      }
    );
  }

  static associate(models) {
    // Define associations
    this.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role'
    });

    this.hasMany(models.Token, {
      foreignKey: 'userId',
      as: 'tokens'
    });
  }

  // Instance methods
  async comparePassword(password) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, this.password);
  }

  async isLocked() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
  }

  async incrementLoginAttempts() {
    const updates = { loginAttempts: this.loginAttempts + 1 };

    if (this.loginAttempts + 1 >= 5) {
      updates.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    }

    await this.update(updates);
  }

  async resetLoginAttempts() {
    await this.update({
      loginAttempts: 0,
      lockUntil: null
    });
  }

  // Virtual fields
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get accountAge() {
    return Math.floor((Date.now() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24));
  }

  // Static methods
  static async findByEmail(email) {
    return this.findOne({
      where: {
        email: email.toLowerCase(),
        isDeleted: false
      },
      include: ['role']
    });
  }

  static async findActive() {
    return this.findAll({
      where: {
        isActive: true,
        isDeleted: false
      },
      include: ['role']
    });
  }

  static async findByRole(roleId) {
    return this.findAll({
      where: {
        roleId,
        isDeleted: false
      },
      include: ['role']
    });
  }

  static async search(query, options = {}) {
    const { Op } = require('sequelize');

    return this.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ],
        isDeleted: false
      },
      include: ['role'],
      ...options
    });
  }
}

export default User;
