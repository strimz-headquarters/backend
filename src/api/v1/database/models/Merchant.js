const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { HashPassword, Wallet } = require("../../helpers");
const ethers = require("ethers");
module.exports = (sequelize, DataTypes) => {
  class Merchant extends Model {
    static associate(models) {
      this.hasMany(models.Subscription, { foreignKey: "merchantId" });
    }

    // Instance method to verify API secret
    async validateApiSecret(secret) {
      return bcrypt.compare(secret, this.api_secret_hash);
    }

    // Instance method to generate new API keys
    async regenerateApiKeys() {
      const apiKey = "pk_live_" + crypto.randomBytes(32).toString("hex");
      const apiSecret = "sk_live_" + crypto.randomBytes(32).toString("hex");
      const apiSecretHash = await bcrypt.hash(apiSecret, 10);

      await this.update({
        api_key: apiKey,
        api_secret_hash: apiSecretHash,
      });

      return { apiKey, apiSecret };
    }

    // Hide sensitive data when converting to JSON
    toJSON() {
      const values = Object.assign({}, this.get());

      return values;
    }
  }

  Merchant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Business name is required",
          },
          len: {
            args: [2, 255],
            msg: "Business name must be between 2 and 255 characters",
          },
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
          msg: "Email already exists",
        },
        validate: {
          isEmail: {
            msg: "Must be a valid email address",
          },
          notEmpty: {
            msg: "Email is required",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      wallet: {
        type: DataTypes.STRING(42),
        allowNull: false,
        unique: {
          msg: "Wallet address already registered",
        },
        validate: {
          isEthereumAddress(value) {
            if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
              throw new Error("Invalid Ethereum wallet address");
            }
          },
        },
      },
      apiKey: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      // api_secret_hash: {
      //   type: DataTypes.STRING(255),
      //   allowNull: false,
      // },
      // status: {
      //   type: DataTypes.ENUM("active", "suspended", "pending_verification"),
      //   defaultValue: "pending_verification",
      //   allowNull: false,
      // },
      // kyc_verified: {
      //   type: DataTypes.BOOLEAN,
      //   defaultValue: false,
      // },
      // total_volume: {
      //   type: DataTypes.DECIMAL(20, 8),
      //   defaultValue: 0,
      //   validate: {
      //     min: 0,
      //   },
      // },
      // available_balance: {
      //   type: DataTypes.DECIMAL(20, 8),
      //   defaultValue: 0,
      //   validate: {
      //     min: 0,
      //   },
      // },
      // pending_balance: {
      //   type: DataTypes.DECIMAL(20, 8),
      //   defaultValue: 0,
      //   validate: {
      //     min: 0,
      //   },
      // },
      // phone: {
      //   type: DataTypes.STRING(20),
      //   allowNull: true,
      //   validate: {
      //     is: {
      //       args: /^\+?[1-9]\d{1,14}$/,
      //       msg: "Invalid phone number format",
      //     },
      //   },
      // },
      // country: {
      //   type: DataTypes.STRING(2),
      //   allowNull: true,
      //   validate: {
      //     len: {
      //       args: [2, 2],
      //       msg: "Country code must be 2 characters",
      //     },
      //   },
      // },
      // webhook_url: {
      //   type: DataTypes.STRING(500),
      //   allowNull: true,
      //   validate: {
      //     isUrl: {
      //       msg: "Webhook URL must be a valid URL",
      //     },
      //   },
      // },
      // webhook_secret: {
      //   type: DataTypes.STRING(128),
      //   allowNull: true,
      // },
      // settings: {
      //   type: DataTypes.JSONB,
      //   defaultValue: {
      //     auto_withdrawal: false,
      //     min_withdrawal_amount: "0.01",
      //     notification_preferences: {
      //       email: true,
      //       webhook: true,
      //     },
      //   },
      // },
      // last_login_at: {
      //   type: DataTypes.DATE,
      //   allowNull: true,
      // },
    },
    {
      sequelize,
      modelName: "Merchant",
      tableName: "merchants",

      hooks: {
        beforeCreate: async (merchant) => {
          if (!merchant.api_key) {
            merchant.api_key =
              "pk_live_" + crypto.randomBytes(32).toString("hex");
          }

          const _type = "eth";

          const hashedPassword = await HashPassword(merchant?.password);
          const new_account =
            _type === "eth"
              ? new ethers.Wallet(ethers.Wallet.createRandom().privateKey)
              : Wallet.computeAddress();
          const encryptionKey = await Wallet.deriveKeyFromPassword(
            hashedPassword
          );
          const encryptedData =
            _type === "eth"
              ? await new_account.encrypt(encryptionKey.toString("hex"))
              : await Wallet.encryptPvKey(
                  new_account.privateKey,
                  encryptionKey.toString("hex")
                );
          const wallet = {
            ...new_account,
            encryptedData,
            encryptionKey: encryptionKey.toString("hex"),
          };

          merchant.password = hashedPassword;
          merchant.wallet = wallet;
        },
      },
    }
  );

  return Merchant;
};
