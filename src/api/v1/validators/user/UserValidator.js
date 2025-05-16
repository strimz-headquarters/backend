const { param, body } = require("express-validator");
const { User, Token } = require("../../database/classes");
const bcrypt = require("bcryptjs");
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

exports.exportWallet = [
  body("password")
    .notEmpty()
    .withMessage("password required")
    .bail()
    .custom(async (password, { req }) => {
      const user = await User.getUser(req.user.uid);
      if (!user) {
        throw new Error("Invalid params");
      }
      if (!user.verified) {
        throw new Error("User not verified");
      }
      // const user = await User.getUserByEmail(data.email);
      // console
      const matchPassword = await bcrypt.compare(`${password}`, user.password);
      if (!matchPassword) {
        throw new Error("Incorrect Password");
      }
      return true;
    }),
];

exports.withdraw = [
  body("password")
    .notEmpty()
    .withMessage("password required")
    .bail()
    .custom(async (password, { req }) => {
      const user = await User.getUser(req.user.uid);
      if (!user) {
        throw new Error("Invalid params");
      }
      if (!user.verified) {
        throw new Error("User not verified");
      }
      // const user = await User.getUserByEmail(data.email);
      // console
      const matchPassword = await bcrypt.compare(`${password}`, user.password);
      if (!matchPassword) {
        throw new Error("Incorrect Password");
      }
      return true;
    }),
  body("amount")
    .notEmpty()
    .withMessage("amount required")
    .bail()
    .isNumeric()
    .bail()
    .custom((amount) => {
      if (isNaN(Number(amount))) {
        throw new Error("Invalid amount");
      }
      return true;
    }),

  body("receipient").notEmpty().withMessage("receipient required").bail(),
];
