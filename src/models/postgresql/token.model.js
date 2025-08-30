import { DataTypes, Model } from 'sequelize';

class Token extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        token: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        type: {
          type: DataTypes.ENUM('refresh', 'password_reset', 'email_verification', 'access'),
          allowNull: false
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        isRevoked: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {}
        },
        ipAddress: {
          type: DataTypes.INET,
          allowNull: true
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        lastUsedAt: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'Token',
        tableName: 'tokens',
        timestamps: true,
        indexes: [
          {
            fields: ['userId']
          },
          {
            fields: ['token']
          },
          {
            fields: ['type']
          },
          {
            fields: ['expiresAt']
          },
          {
            fields: ['isRevoked']
          },
          {
            fields: ['createdAt']
          }
        ],
        hooks: {
          beforeSave: async token => {
            // Update lastUsedAt when token is used
            if (token.changed('lastUsedAt')) {
              token.lastUsedAt = new Date();
            }
          },

          beforeCreate: async token => {
            // Set default expiration if not provided
            if (!token.expiresAt) {
              const now = new Date();
              switch (token.type) {
                case 'refresh':
                  token.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
                  break;
                case 'password_reset':
                  token.expiresAt = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour
                  break;
                case 'email_verification':
                  token.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
                  break;
                case 'access':
                  token.expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
                  break;
              }
            }
          }
        }
      }
    );
  }

  static associate(models) {
    // Define associations
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  // Instance methods
  isExpired() {
    return new Date() > this.expiresAt;
  }

  isValid() {
    return !this.isRevoked && !this.isExpired();
  }

  revoke() {
    this.isRevoked = true;
    return this.save();
  }

  markAsUsed() {
    this.lastUsedAt = new Date();
    return this.save();
  }

  // Static methods
  static async findByToken(token) {
    return this.findOne({
      where: {
        token,
        isRevoked: false
      },
      include: ['user']
    });
  }

  static async findByUserId(userId, type = null) {
    const where = {
      userId,
      isRevoked: false
    };

    if (type) {
      where.type = type;
    }

    return this.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
  }

  static async findValidByUserId(userId, type) {
    return this.findAll({
      where: {
        userId,
        type,
        isRevoked: false,
        expiresAt: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });
  }

  static async findExpired() {
    return this.findAll({
      where: {
        expiresAt: {
          [require('sequelize').Op.lt]: new Date()
        }
      }
    });
  }

  static async findRevoked() {
    return this.findAll({
      where: { isRevoked: true }
    });
  }

  static async revokeByUserId(userId, type = null) {
    const where = { userId };

    if (type) {
      where.type = type;
    }

    return this.update({ isRevoked: true }, { where });
  }

  static async revokeByToken(token) {
    return this.update({ isRevoked: true }, { where: { token } });
  }

  static async cleanupExpired() {
    return this.destroy({
      where: {
        expiresAt: {
          [require('sequelize').Op.lt]: new Date()
        }
      }
    });
  }

  static async getStats() {
    const { Op } = require('sequelize');

    const stats = await this.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isRevoked" = true THEN 1 END')), 'revoked'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "expiresAt" < NOW() THEN 1 END')), 'expired']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      group: ['type']
    });

    return stats;
  }

  static async createToken(tokenData) {
    // Check if token already exists
    const existingToken = await this.findOne({
      where: {
        userId: tokenData.userId,
        type: tokenData.type,
        isRevoked: false
      }
    });

    if (existingToken) {
      // Revoke existing token
      await existingToken.revoke();
    }

    // Create new token
    return this.create(tokenData);
  }
}

export default Token;
