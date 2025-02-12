"use strict";
const { Model } = require("sequelize");
const { HashPassword, Wallet } = require("../../helpers");
const ethers = require("ethers");
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
        wallet: undefined,
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

      type: {
        type: DataTypes.ENUM("eth", "strk"),
        allowNull: false,
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

      level: {
        type: DataTypes.INTEGER, // Change to the desired type
        allowNull: false, // Adjust according to your needs
        defaultValue: 0, // Optional: set a default value
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
    try {
      const hashedPassword = await HashPassword(user?.password);
      const new_account =
        user.type.toLowerCase() === "eth"
          ? new ethers.Wallet(ethers.Wallet.createRandom().privateKey)
          : Wallet.computeAddress();
      const encryptionKey = await Wallet.deriveKeyFromPassword(hashedPassword);
      const encryptedData =
        user.type.toLowerCase() === "eth"
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

      user.wallet = wallet;
      user.type = user.type.toLowerCase();

      user.password = hashedPassword;
    } catch (error) {
      throw error;
    }
  });

  return User;
};
