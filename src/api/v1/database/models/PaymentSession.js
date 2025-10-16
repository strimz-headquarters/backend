const { Model } = require("sequelize");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  class PaymentSession extends Model {
    static associate(models) {
      this.belongsTo(models.Merchant, {
        foreignKey: "merchant_id",
        as: "merchant",
      });

      this.hasMany(models.Transaction, {
        foreignKey: "session_id",
        as: "transactions",
      });
    }

    // Check if session is expired
    isExpired() {
      return new Date() > this.expires_at;
    }

    // Check if session can be processed
    canProcess() {
      return this.status === "pending" && !this.isExpired();
    }

    // Mark session as completed
    async markCompleted(transactionData) {
      return await this.update({
        status: "completed",
        completed_at: new Date(),
        tx_hash: transactionData.txHash,
        payment_id: transactionData.paymentId,
        block_number: transactionData.blockNumber,
        gas_used: transactionData.gasUsed,
      });
    }

    // Mark session as failed
    async markFailed(reason) {
      return await this.update({
        status: "failed",
        failure_reason: reason,
        completed_at: new Date(),
      });
    }
  }

  PaymentSession.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      session_id: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      merchant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "merchants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      order_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Order ID is required",
          },
          len: {
            args: [1, 255],
            msg: "Order ID must be between 1 and 255 characters",
          },
        },
      },
      amount: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
        validate: {
          min: {
            args: [0.000001],
            msg: "Amount must be greater than 0",
          },
          isDecimal: {
            msg: "Amount must be a valid decimal number",
          },
        },
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "ETH",
        validate: {
          isIn: {
            args: [["ETH", "MATIC", "BNB", "USDT", "USDC"]],
            msg: "Invalid currency",
          },
        },
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "processing",
          "completed",
          "failed",
          "expired",
          "cancelled"
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      customer_wallet: {
        type: DataTypes.STRING(42),
        allowNull: true,
        validate: {
          isEthereumAddress(value) {
            if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
              throw new Error("Invalid customer wallet address");
            }
          },
        },
      },
      tx_hash: {
        type: DataTypes.STRING(66),
        allowNull: true,
        validate: {
          isTransactionHash(value) {
            if (value && !/^0x[a-fA-F0-9]{64}$/.test(value)) {
              throw new Error("Invalid transaction hash");
            }
          },
        },
      },
      payment_id: {
        type: DataTypes.STRING(66),
        allowNull: true,
        comment: "Payment ID from smart contract",
      },
      block_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      gas_used: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      network: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "ethereum",
        validate: {
          isIn: {
            args: [["ethereum", "polygon", "bsc", "sepolia", "goerli"]],
            msg: "Invalid network",
          },
        },
      },
      success_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Success URL must be a valid URL",
          },
        },
      },
      cancel_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Cancel URL must be a valid URL",
          },
        },
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: "Additional data from merchant",
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          isFuture(value) {
            if (new Date(value) <= new Date()) {
              throw new Error("Expiration date must be in the future");
            }
          },
        },
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      failure_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.INET,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PaymentSession",
      tableName: "payment_sessions",
      indexes: [
        {
          unique: true,
          fields: ["session_id"],
        },
        {
          fields: ["merchant_id"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["order_id", "merchant_id"],
        },
        {
          fields: ["tx_hash"],
        },
        {
          fields: ["expires_at"],
        },
        {
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (session) => {
          if (!session.session_id) {
            session.session_id = "cs_" + crypto.randomBytes(32).toString("hex");
          }
          if (!session.expires_at) {
            session.expires_at = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          }
        },
      },
    }
  );

  return PaymentSession;
};
