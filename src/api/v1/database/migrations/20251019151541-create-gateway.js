"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Merchants table
    await queryInterface.createTable("merchants", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      apiKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      wallet: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Subscriptions table
    await queryInterface.createTable("subscriptions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "User",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      merchantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Merchant",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("active", "expired", "cancelled", "pending"),
        defaultValue: "pending",
      },
      amount: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATE,
      },
      endDate: {
        type: Sequelize.DATE,
      },
      nextBillingDate: {
        type: Sequelize.DATE,
      },
      autoRenew: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Payments table
    await queryInterface.createTable("payments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      subscriptionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "subscriptions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      merchantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "merchants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      amount: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      txHash: {
        type: Sequelize.STRING,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM("pending", "confirmed", "failed"),
        defaultValue: "pending",
      },
      type: {
        type: Sequelize.ENUM("initial", "renewal", "manual"),
        defaultValue: "initial",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes for performance
    // await queryInterface.addIndex("subscriptions", ["userId"]);
    // await queryInterface.addIndex("subscriptions", ["planId"]);
    await queryInterface.addIndex("subscriptions", ["merchantId"]);
    await queryInterface.addIndex("subscriptions", ["status"]);
    await queryInterface.addIndex("subscriptions", ["nextBillingDate"]);
    await queryInterface.addIndex("payments", ["subscriptionId"]);
    await queryInterface.addIndex("payments", ["userId"]);
    await queryInterface.addIndex("payments", ["merchantId"]);
    await queryInterface.addIndex("payments", ["txHash"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("payments");
    await queryInterface.dropTable("subscriptions");
    await queryInterface.dropTable("Merchants");
  },
};
