const { Sequelize, Op, col, fn } = require("sequelize");
const { User } = require("../../models");
const {
  getWallet,
  estimateGas,
  invokeFunction,
} = require("../../../controllers/contract/contract.controller");
const { parseUnits } = require("ethers");

class UserEntity {
  //create a new user
  static async createUser(data) {
    try {
      const newUser = await User.create(data);

      return newUser;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  //update a user
  static async updateUser(uid, data) {
    try {
      const updatedUser = await User.findByPk(uid);
      await updatedUser.update(data);
      return updatedUser;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  // deleteUser account
  static async deleteUser(uid) {
    try {
      const deletedUser = await User.findByPk(uid);
      await deletedUser.destroy();
      return { success: true, message: "user successfully deleted" };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  // get user based on id
  static async getUser(id) {
    try {
      const result = await User.findOne({
        where: { id },
      });
      return result;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }
  //get user by id
  static async getUserById(uid) {
    try {
      const result = await User.findOne({
        where: { id: uid },
      });
      return {
        ...result.dataValues,
        wallet: undefined,
        createdAt: undefined,
        password: undefined,
        updatedAt: undefined,
        address: result?.wallet?.address,
      };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async exportWallet(uid) {
    try {
      const result = await User.findOne({
        where: { id: uid },
      });

      const wallet = await getWallet(result);
      return wallet;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async withdraw(uid, body) {
    try {
      const user = await User.findOne({
        where: { id: uid },
      });
      const args = [body.receipient, parseUnits(body.amount.toString(), 6)];
      await estimateGas("transfer", args, user.type, user.wallet.address, true);

      const receipt = await invokeFunction(
        "transfer",
        args,
        user.type,
        user,
        true
      );
      return receipt;
      // const wallet = await getWallet(result);
      return wallet;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getUserByCustomArgs(args) {
    try {
      const result = await User.findOne(args);
      return result;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getUserByUsernameOrEmail(user_cred) {
    // const Op = Sequelize.Op;
    const result = await User.findOne({
      where: {
        [Op.or]: [
          {
            username: {
              [Op.like]: user_cred,
            },
          },

          {
            email: {
              [Op.like]: user_cred,
            },
          },
        ],
      },
    });
    return result;
  }

  static async getUserByUsername(username) {
    try {
      const result = await User.findOne({
        where: {
          username,
        },
      });
      return result;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async searchUser(query, page = 0, size = 100) {
    try {
      const result = await User.findAll({
        limit: size ?? 20,
        offset: page * size ?? 0,
        // where: {
        //   [Op.or]: [
        //     {
        //       username: {
        //         [Op.like]: `%${query.toString().trim().toLowerCase()}%`,
        //       },
        //     },
        //     {
        //       email: {
        //         [Op.like]: `%${query.toString().trim().toLowerCase()}%`,
        //       },
        //     },
        //     {
        //       firstname: {
        //         [Op.like]: `%${query.toString().trim().toLowerCase()}%`,
        //       },
        //     },
        //     {
        //       lastname: {
        //         [Op.like]: `%${query.toString().trim().toLowerCase()}%`,
        //       },
        //     },
        //   ],
        // },

        where: {
          [Op.or]: [
            Sequelize.where(fn("LOWER", col("username")), {
              [Op.like]: `%${query.trim().toLowerCase()}%`,
            }),
            Sequelize.where(fn("LOWER", col("email")), {
              [Op.like]: `%${query.trim().toLowerCase()}%`,
            }),
            Sequelize.where(fn("LOWER", col("firstname")), {
              [Op.like]: `%${query.trim().toLowerCase()}%`,
            }),
            Sequelize.where(fn("LOWER", col("lastname")), {
              [Op.like]: `%${query.trim().toLowerCase()}%`,
            }),
            // Add more conditions here if necessary
          ],
        },
        // attributes: [
        //   [col("username"), "username"],
        //   [col("email"), "email"],
        //   [col("firstname"), "firstname"],
        //   [col("lastname"), "lastname"],
        // ],
        collate: "utf8mb4_general_ci", // Case-insensitive collation at query level
      });
      return result;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getUserByEmail(email) {
    try {
      const result = await User.findOne({ where: { email } });
      return result;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }
}

module.exports = UserEntity;
