const { body, param } = require("express-validator");
const { Plan } = require("../../database/classes");

exports.createPlan = [
  body("plan")
    .notEmpty()
    .withMessage("plan required")
    .bail()
    .custom(async (plan) => {
      const getPlan = await Plan.getPlan({
        plan,
      });
      if (getPlan) {
        throw new Error("Plan already exist");
      }
    }),

  body("limit")
    .notEmpty()
    .withMessage("limit required")
    .bail()
    .custom(async (limit) => {
      if (isNaN(Number(limit))) {
        throw new Error("Invalid Plan");
      }
    }),
  body("duration").notEmpty().withMessage("duration required").bail(),
  // .custom(async (duration) => {
  //   if (isNaN(Number(duration))) {
  //     throw new Error("Invalid duration");
  //   }
  // }),

  body("amount")
    .notEmpty()
    .withMessage("amount required")
    .bail()
    .custom(async (amount) => {
      if (isNaN(Number(amount))) {
        throw new Error("Invalid amount");
      }
    }),
];

exports.getPlan = [
  param("id")
    .notEmpty()
    .withMessage("id required")
    .bail()
    .custom(async (id) => {
      const plan = await Plan.getPlan(id);
      if (!plan) {
        throw new Error("Invalid plan");
      }
    }),
];
