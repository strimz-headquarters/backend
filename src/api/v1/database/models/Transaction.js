const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      this.belongsTo(models.Merchant, {
        foreignKey: "merchant_id",
        as: "merchant",
      });

      this.belongsTo(models.PaymentSession, {
        foreignKey: "session_id",
        as: "session",
      });

      // Transaction self-referencing for refunds
      this.belongsTo(models.Transaction, {
        foreignKey: "parent_transaction_id",
        as: "parentTransaction",
      });
      this.hasOne(models.Transaction, {
        foreignKey: "parent_transaction_id",
        as: "refundTransaction",
      });
    }

    // Calculate net amount after fees
    getNetAmount() {
      return parseFloat(this.amount) - parseFloat(this.platform_fee);
    }

    // Check if refundable
    isRefundable() {
      return (
        this.status === "completed" &&
        this.type === "payment" &&
        !this.refund_id &&
        new Date() - new Date(this.created_at) < 90 * 24 * 60 * 60 * 1000
      ); // 90 days
    }
  }

  Transaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      session_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "payment_sessions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      type: {
        type: DataTypes.ENUM(
          "payment",
          "refund",
          "withdrawal",
          "fee",
          "adjustment"
        ),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "processing",
          "completed",
          "failed",
          "cancelled"
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
        validate: {
          min: {
            args: [0],
            msg: "Amount must be positive",
          },
          isDecimal: true,
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
      platform_fee: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: [0],
            msg: "Platform fee must be positive",
          },
        },
      },
      platform_fee_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 2.5,
        comment: "Fee percentage at time of transaction",
      },
      net_amount: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      customer_wallet: {
        type: DataTypes.STRING(42),
        allowNull: true,
        validate: {
          isEthereumAddress(value) {
            if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
              throw new Error("Invalid wallet address");
            }
          },
        },
      },
      merchant_wallet: {
        type: DataTypes.STRING(42),
        allowNull: false,
        validate: {
          isEthereumAddress(value) {
            if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
              throw new Error("Invalid merchant wallet address");
            }
          },
        },
      },
      tx_hash: {
        type: DataTypes.STRING(66),
        allowNull: true,
        unique: true,
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
        unique: true,
      },
      block_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      block_timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      gas_used: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gas_price: {
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
      order_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Merchant order reference",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      refund_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "transactions",
          key: "id",
        },
        comment: "References the refund transaction if this was refunded",
      },
      parent_transaction_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "transactions",
          key: "id",
        },
        comment: "For refunds, references the original transaction",
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      failure_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "transactions",
      indexes: [
        {
          fields: ["merchant_id"],
        },
        {
          fields: ["session_id"],
        },
        {
          fields: ["type"],
        },
        {
          fields: ["status"],
        },
        {
          unique: true,
          fields: ["tx_hash"],
          where: {
            tx_hash: {
              [sequelize.Sequelize.Op.ne]: null,
            },
          },
        },
        {
          fields: ["customer_wallet"],
        },
        {
          fields: ["merchant_wallet"],
        },
        {
          fields: ["order_id"],
        },
        {
          fields: ["created_at"],
        },
        {
          fields: ["block_number"],
        },
      ],
      hooks: {
        beforeValidate: (transaction) => {
          // Calculate net amount
          if (transaction.amount && transaction.platform_fee) {
            transaction.net_amount =
              parseFloat(transaction.amount) -
              parseFloat(transaction.platform_fee);
          }
        },
      },
    }
  );
  return Transaction;
};
