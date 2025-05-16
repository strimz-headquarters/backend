const { body, param, query } = require("express-validator");
const { Payroll } = require("../../database/classes");

exports.createPayroll = [
  body("name")
    .notEmpty()
    .withMessage("name required")
    .bail()
    .custom(async (name, { req }) => {
      const getPayroll = await Payroll.getPayroll({
        name,
        owner: req.user.uid,
      });
      if (getPayroll) {
        throw new Error("Name already exist");
      }
    }),

  // body("receipient")
  //   .optional()
  //   .custom((value) => {
  //     // Ensure it's an array
  //     if (!Array.isArray(value)) {
  //       throw new Error("receipients must be an array");
  //     }

  //     value.forEach((item, index) => {
  //       if (typeof item !== "object" || item === null || Array.isArray(item)) {
  //         throw new Error(`receipient at index ${index} must be an object`);
  //       }

  //       // Example: Required fields in each object
  //       if (!item.address) {
  //         throw new Error(
  //           `receipient at index ${index} is missing required field: address`
  //         );
  //       }
  //       if (!item.amount) {
  //         throw new Error(
  //           `receipient at index ${index} is missing required field: amount`
  //         );
  //       }
  //       if (!item.name) {
  //         throw new Error(
  //           `receipient at index ${index} is missing required field: name`
  //         );
  //       }

  //       // if (!item.name || typeof item.name !== "string") {
  //       //   throw new Error(`Item at index ${index} must have a 'name' string`);
  //       // }

  //       // Add more field-specific validations here
  //     });

  //     return true;
  //   }),

  // body("plan")
  //   .notEmpty()
  //   .withMessage("plan required")
  //   .bail()
  //   .custom(async (_plan) => {
  //     const plan = await Plan.getPlan({
  //       planId: _plan,
  //     });
  //     if (!plan) {
  //       throw new Error("Invalid Plan");
  //     }
  //   }),

  body("frequency")
    .notEmpty()
    .withMessage("frequency required")
    .bail()
    .custom(async (frequency) => {
      const frequencies = ["daily", "weekly", "monthly", "yearly"];
      if (!frequencies.includes(frequency)) {
        throw new Error("Invalid frequency");
      }
    }),

  body("token").notEmpty().withMessage("token required").bail(),
  // .custom((token) => {
  //   if (!token.startsWith("0x0")) {
  //     throw new Error("Token must have 0x0 prefix");
  //   }
  //   if (token.length !== 66) {
  //     throw new Error("Token must have be 66 in length");
  //   }
  //   return true;
  // }),

  body("start_date")
    .notEmpty()
    .withMessage("start_date required")
    .bail()
    .custom(async (start_date, { req }) => {
      const date = new Date(start_date);
      const isValid = date instanceof Date && !isNaN(date);
      if (!isValid) {
        throw new Error("Invalid start_date");
      }

      req.body.start_date = date.toISOString();
    }),
];

exports.getPayroll = [
  param("id")
    .notEmpty()
    .withMessage("id required")
    .bail()
    .custom(async (id, { req }) => {
      const userId = req.user.uid;
      const payroll = await Payroll.getPayroll({
        id,
      });
      if (!payroll) {
        throw new Error("Invalid payroll");
      }

      if (payroll.owner !== userId) {
        throw new Error("UNAUTHORIZED");
      }
    }),
];

exports.getPayrollQuery = [
  query("id")
    .notEmpty()
    .withMessage("id required")
    .bail()
    .custom(async (id, { req }) => {
      const userId = req.user.uid;
      const payroll = await Payroll.getPayroll({
        id,
      });
      if (!payroll) {
        throw new Error("Invalid payroll");
      }

      if (payroll.owner !== userId) {
        throw new Error("UNAUTHORIZED");
      }
    }),
];
