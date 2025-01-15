const { Sequelize, Op, col, fn } = require("sequelize");
const { User, Blocked, Prediction } = require("../../models");

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
        include: [
          {
            model: Blocked,
            as: "blocked",
            attributes: ["reason", "createdAt"],
          },
        ],
      });
      return result;
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

  static async getAllUsers(page = 0, size = 100, query) {
    try {
      let query_construct = {};
      if (query?.status) {
        query_construct.status = query.status;
      }

      const users = await User.findAndCountAll({
        distinct: true,
        where: query_construct,
        attributes: {
          include: [
            // [
            //   Sequelize.literal(`(
            //   SELECT COUNT(*)
            //   FROM "predictions" AS "Prediction"
            //   WHERE "Prediction"."userId" = "User"."id"
            // )`),
            //   "totalPredictions", // Alias for the subquery count
            // ],
            [
              Sequelize.literal(`CASE 
            WHEN (SELECT COUNT(*) FROM predictions WHERE "predictions"."userId" = "User".id) = 0 THEN 0 
            ELSE CAST("User"."totalPoints" AS FLOAT) / (SELECT COUNT(*) FROM predictions WHERE "predictions"."userId" = "User".id) 
          END`), // Correct ratio calculation, with decimal casting
              "averagePoints",
            ],
          ],
        },
        include: [
          {
            model: Blocked,
            as: "blocked",
            attributes: ["reason", "createdAt"],
          },
          {
            model: Prediction, // Include the Prediction model
            attributes: [], // Exclude Prediction details, only count
          },
        ],
        limit: size,
        offset: page * size,
        // order: [["createdAt", "DESC"]],
        // order: [
        //   [
        //     Sequelize.literal(`(
        //   SELECT COUNT(*)
        //   FROM "predictions" AS "Prediction"
        //   WHERE "Prediction"."userId" = "User"."id"
        // )`),
        //     "DESC", // Sort by descending totalPredictions
        //   ],
        // ],

        order: [
          [
            Sequelize.literal(`CASE 
          WHEN (SELECT COUNT(*) FROM predictions WHERE "predictions"."userId" = "User".id) = 0 THEN 0 
          ELSE CAST("User"."totalPoints" AS FLOAT) / (SELECT COUNT(*) FROM predictions WHERE "predictions"."userId" = "User".id) 
        END`),
            query?.order || "DESC",
          ], // Sorting by ratio, handling division by zero, and maintaining decimal precision
        ],
      });
      return users;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = UserEntity;
