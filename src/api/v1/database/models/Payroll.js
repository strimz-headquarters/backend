"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Payroll extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // this.belongsTo(models.Plan, {
      //   foreignKey: "plan",
      //   as: "current_plan",
      //   // as: "plan",
      // });
    }

    toJSON() {
      return {
        ...this.get(),

        // createdAt: undefined,
        // updatedAt: undefined,
      };
    }
  }
  Payroll.init(
    {
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

      // plan: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      // },

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
    },
    {
      sequelize,
      tableName: "payrolls",
      modelName: "Payroll",
    }
  );

  return Payroll;
};
