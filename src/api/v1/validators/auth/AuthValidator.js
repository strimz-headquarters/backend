const { body, param } = require("express-validator");
const { User } = require("../../database/classes");

//validate if the user is passing username and email and check if the already exists
exports.addUser = [
  body("username")
    .notEmpty()
    .withMessage("username is required")
    .bail()
    .isLength({ min: 3 })
    .withMessage("username should be at least 3 characters")
    .bail()
    .custom(async (username) => {
      const usernameExists = await User.getUserByUsername(username);
      if (usernameExists) {
        throw new Error("user already exists withh this username");
      }
    }),
  body("email")
    .notEmpty()
    .withMessage("email is required")
    .bail()
    .isEmail()
    .withMessage("it should be a valid email address")
    .bail()
    .custom(async (email) => {
      const emailExists = await User.getUserByEmail(email);
      if (emailExists) {
        throw new Error("user already exists with this email address");
      }
    }),
  body("firstname").notEmpty().withMessage("first name is required").bail(),
  body("lastname").notEmpty().withMessage("last name is required").bail(),
  body("password")
    .notEmpty()
    .withMessage("password is required")
    .bail()

    .isLength({ min: 7 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  // .matches(/[!@#$%^&*(),.?":{}|<>]/)
  // .withMessage("Password must contain at least one symbol"),
];

//validate if the user is passing username and email and check if the already exists
exports.loginUser = [
  body("password")
    .notEmpty()
    .withMessage("password is required")
    .bail()
    .isLength({ min: 7 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  // .matches(/[!@#$%^&*(),.?":{}|<>]/)
  // .withMessage("Password must contain at least one symbol"),
  body("email")
    .notEmpty()
    .withMessage("email is required")
    .bail()
    .isEmail()
    .withMessage("it should be a valid email address")
    .bail()
    .custom(async (email) => {
      const emailExists = await User.getUserByEmail(email);
      if (!emailExists) {
        throw new Error("Invalid email or password");
      }
    }),
];

exports.emailOrUsernameExists = [
  body("username")
    .notEmpty()
    .withMessage("username is required")
    .bail()
    .isLength({ min: 6 })
    .withMessage("should be at least 6 characters")
    .bail()
    .custom(async (username) => {
      const usernameExists = await User.getUserByUsername(username);
      if (usernameExists) {
        throw new Error("user already exists withh this username");
      }
    }),
  body("email")
    .notEmpty()
    .withMessage("email is required")
    .bail()
    .isEmail()
    .withMessage("it should be a valid email address")
    .bail()
    .custom(async (email) => {
      const emailExists = await User.getUserByEmail(email);
      if (emailExists) {
        throw new Error("user already exists withh this email address");
      }
    }),
];

exports.emailExists = [
  body("email")
    .notEmpty()
    .withMessage("email is required")
    .bail()
    .isEmail()
    .withMessage("it should be a valid email address")
    .bail()
    .custom(async (email) => {
      const emailExists = await User.getUserByEmail(email);
      if (!emailExists) {
        throw new Error("Email does not exist");
      }
    }),
];

//reset user password
exports.ResetUserPassword = [
  body("newPassword")
    .notEmpty()
    .withMessage("newPassword is required")
    .bail()
    .isLength({ min: 7 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  // .matches(/[!@#$%^&*(),.?":{}|<>]/)
  // .withMessage("Password must contain at least one symbol"),
  // body("email")
  //   .notEmpty()
  //   .withMessage("email is required")
  //   .bail()
  //   .isEmail()
  //   .withMessage("it should be a valid email address")
  //   .bail()
  //   .custom(async (email) => {
  //     const emailExists = await User.getUserByEmail(email);
  //     if (!emailExists) {
  //       throw new Error("user does not exists with this email address");
  //     }
  //     if (emailExists.suspended === true) {
  //       throw new Error("user account has been suspended");
  //     }
  //   }),
];

exports.changePassword = [
  body("oldPassword")
    .notEmpty()
    .withMessage("old password is required")
    .bail()
    .isLength({ min: 7 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  // .matches(/[!@#$%^&*(),.?":{}|<>]/)
  // .withMessage("Password must contain at least one symbol"),

  body("newPassword")
    .notEmpty()
    .withMessage("new password is required")
    .bail()
    .isLength({ min: 7 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  // .matches(/[!@#$%^&*(),.?":{}|<>]/)
  // .withMessage("Password must contain at least one symbol"),
];

exports.getUser = [
  param("id").isNumeric().withMessage("should have the valid id format"),
];

exports.updateUser = [
  param("id")
    .isNumeric()
    .withMessage("should have the valid id format")
    .bail()
    .custom(async (id) => {
      const result = await User.getUserById(id);
      if (result === null) {
        throw new Error("User does not exists");
      }
    }),
];

exports.deleteUser = [
  param("id")
    .isNumeric()
    .withMessage("should have the valid id format")
    .bail()
    .custom(async (id) => {
      const result = await User.getUserById(id);
      if (result === null) {
        throw new Error("User does not exists");
      }
    }),
];
