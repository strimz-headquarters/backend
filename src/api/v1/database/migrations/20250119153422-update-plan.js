"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.addColumn("plans", "duration", {
      type: DataTypes.ENUM,
      values: ["yearly", "monthly"],
      allowNull: false, // Adjust according to your needs
    });

    await queryInterface.addColumn("plans", "amount", {
      type: DataTypes.INTEGER,

      allowNull: false, // Adjust according to your needs
    });
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("plans", "duration");
    await queryInterface.removeColumn("plans", "amount");

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
