"use strict";
const { Model } = require("sequelize");
const { HashPassword } = require("../../helpers");
const {
  computeAddress,
  encryptPvKey,
} = require("../../helpers/wallet/walletEncryption");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    toJSON() {
      return {
        ...this.get(),
        accessToken: undefined,
        password: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      wallet: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          // Custom getter for parsing JSON when retrieved from the database
          const jsonString = this.getDataValue("wallet");
          return jsonString ? JSON.parse(jsonString) : null;
        },
        set(value) {
          // Custom setter for stringifying JSON when stored in the database
          this.setDataValue("wallet", value ? JSON.stringify(value) : null);
        },
      },

      verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,

        validate: {
          notNull: { msg: "email cant be null" },
          notEmpty: { msg: "email can't be empty" },
          isEmail: { msg: "invalid email" },
        },
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "password cant be null" },
          notEmpty: { msg: "password can't be empty" },
        },
      },
    },
    {
      sequelize,
      tableName: "users",
      modelName: "User",
    }
  );

  User.beforeCreate(async (user) => {
    const hashedPassword = await HashPassword(user?.password);
    const new_account = computeAddress();
    const encryptedData = encryptPvKey(new_account.privateKey, user?.password);
    const wallet = {
      ...new_account,
      privateKey: encryptedData,
    };

    user.wallet = wallet;

    user.password = hashedPassword;
  });

  return User;
};
