"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable("payrolls", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      owner: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      receipients: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: JSON.stringify([]),
        get() {
          // Custom getter for parsing JSON when retrieved from the database
          const jsonString = this.getDataValue("receipients");
          return jsonString ? JSON.parse(jsonString) : null;
        },
        set(value) {
          // Custom setter for stringifying JSON when stored in the database
          this.setDataValue(
            "receipients",
            value ? JSON.stringify(value) : null
          );
        },
      },

      plan: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      frequency: {
        type: DataTypes.ENUM,
        values: ["daily", "weekly", "monthly", "yearly"],
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["active", "paused"],
        allowNull: false,
      },
      last_payroll: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });

    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("payrolls");

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
