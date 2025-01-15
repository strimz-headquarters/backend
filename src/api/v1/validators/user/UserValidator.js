const { param, body } = require("express-validator");
const { User, Token, Blocked } = require("../../database/classes");

exports.getVerificationToken = [
  param("id")
    .notEmpty()
    .withMessage("Invalid query")
    .bail()
    .custom(async (id) => {
      const token = await Token.getVerificationTokenById(id);
      if (!token) {
        throw new Error("Invalid token");
      }
    }),
];

exports.getBlockParams = [
  body("status")
    .notEmpty()
    .withMessage("Invalid query")
    .bail()
    .custom(async (status) => {
      if (status !== "blocked" && status !== "active") {
        throw new Error("Invalid status value");
      }
    }),

  body("userId")
    .notEmpty()
    .withMessage("user id is required")
    .bail()
    .custom(async (id) => {
      const userExist = await User.getUserById(id);
      if (!userExist) {
        throw new Error("user does not exist with data id");
      }
    }),

  // body("reason").notEmpty().withMessage("reason is required").bail(),
];

//validate userId
exports.getUser = [
  param("id")
    .notEmpty()
    .withMessage("user id is required")
    .bail()
    .custom(async (id) => {
      const userExist = await User.getUserById(id);
      if (!userExist) {
        throw new Error("user does not exist with data id");
      }
    }),

  // body("username").custom(async (username) => {
  //   if (username) {
  //     const userExist = await User.getUserByUsername(username);
  //     if (userExist) {
  //       throw new Error("username already exist. Choose another username");
  //     }
  //   }
  // }),

  // body("email").custom(async (email) => {
  //   if (email) {
  //     const emailExists = await User.getUserByEmail(email);
  //     if (emailExists) {
  //       throw new Error("Email already exist. Choose another email");
  //     }
  //   }
  // }),
];
