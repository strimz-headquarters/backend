"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("merchants", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      business_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      wallet_address: {
        type: Sequelize.STRING(42),
        allowNull: false,
        unique: true,
      },
      api_key: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true,
      },
      api_secret_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "suspended", "pending_verification"),
        defaultValue: "pending_verification",
        allowNull: false,
      },
      kyc_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      total_volume: {
        type: Sequelize.DECIMAL(20, 8),
        defaultValue: 0,
      },
      available_balance: {
        type: Sequelize.DECIMAL(20, 8),
        defaultValue: 0,
      },
      pending_balance: {
        type: Sequelize.DECIMAL(20, 8),
        defaultValue: 0,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: true,
      },
      webhook_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      webhook_secret: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex("merchants", ["email"], { unique: true });
    await queryInterface.addIndex("merchants", ["wallet_address"], {
      unique: true,
    });
    await queryInterface.addIndex("merchants", ["api_key"], { unique: true });
    await queryInterface.addIndex("merchants", ["status"]);

    await queryInterface.addIndex("payment_sessions", ["session_id"], {
      unique: true,
    });
    await queryInterface.addIndex("payment_sessions", ["merchant_id"]);
    await queryInterface.addIndex("payment_sessions", ["status"]);
    await queryInterface.addIndex("payment_sessions", [
      "order_id",
      "merchant_id",
    ]);
    await queryInterface.addIndex("payment_sessions", ["tx_hash"]);
    await queryInterface.addIndex("payment_sessions", ["created_at"]);

    await queryInterface.addIndex("transactions", ["merchant_id"]);
    await queryInterface.addIndex("transactions", ["session_id"]);
    await queryInterface.addIndex("transactions", ["type"]);
    await queryInterface.addIndex("transactions", ["status"]);
    await queryInterface.addIndex("transactions", ["tx_hash"], {
      unique: true,
    });
    await queryInterface.addIndex("transactions", ["customer_wallet"]);
    await queryInterface.addIndex("transactions", ["created_at"]);

    await queryInterface.addIndex("webhook_logs", ["merchant_id"]);
    await queryInterface.addIndex("webhook_logs", ["event_type"]);
    await queryInterface.addIndex("webhook_logs", ["status"]);
    await queryInterface.addIndex("webhook_logs", ["created_at"]);

    await queryInterface.createTable("payment_sessions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      session_id: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true,
      },
      merchant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "merchants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      order_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "ETH",
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING(42),
        allowNull: true,
      },
      tx_hash: {
        type: Sequelize.STRING(66),
        allowNull: true,
      },
      payment_id: {
        type: Sequelize.STRING(66),
        allowNull: true,
      },
      block_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      gas_used: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      network: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "ethereum",
      },
      success_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      cancel_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Create transactions table
    await queryInterface.createTable("transactions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      merchant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "merchants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "payment_sessions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      type: {
        type: Sequelize.ENUM(
          "payment",
          "refund",
          "withdrawal",
          "fee",
          "adjustment"
        ),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "ETH",
      },
      platform_fee: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
        defaultValue: 0,
      },
      platform_fee_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 2.5,
      },
      net_amount: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
      },
      customer_wallet: {
        type: Sequelize.STRING(42),
        allowNull: true,
      },
      merchant_wallet: {
        type: Sequelize.STRING(42),
        allowNull: false,
      },
      tx_hash: {
        type: Sequelize.STRING(66),
        allowNull: true,
        unique: true,
      },
      payment_id: {
        type: Sequelize.STRING(66),
        allowNull: true,
        unique: true,
      },
      block_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      block_timestamp: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      gas_used: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      gas_price: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      network: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "ethereum",
      },
      order_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      refund_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      parent_transaction_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Create webhook_logs table
    await queryInterface.createTable("webhook_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      merchant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "merchants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "success", "failed"),
        defaultValue: "pending",
        allowNull: false,
      },
      response_code: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      response_body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      next_retry_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      duration_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("webhook_logs");
    await queryInterface.dropTable("transactions");
    await queryInterface.dropTable("payment_sessions");
    await queryInterface.dropTable("merchants");
  },
};
