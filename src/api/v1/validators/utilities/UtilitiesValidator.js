const { body, query } = require("express-validator");
const { Utilities } = require("../../helpers");

exports.purchase = [
  body("serviceID").notEmpty().withMessage("serviceID is required").bail(),
  query("type")
    .notEmpty()
    .withMessage("type is required")
    .bail()

    .custom(async (type, { req }) => {
      const { serviceID, billersCode, variation_code, amount, phone } =
        req.body;
      if (type === "airtime") {
        if (!Utilities.airtimeServiceIds[serviceID]) {
          throw new Error("Invalid service ID");
        }
        if (!amount) {
          throw new Error("Amount required");
        }
        if (isNaN(Number(amount))) {
          throw new Error("Invalid Amount");
        }
        if (!phone) {
          throw new Error("Phone required");
        }
        if (!/^0\d{10}$/.test(phone)) {
          throw new Error(
            "Phone number must start with 0 and be exactly 11 digits long"
          );
        }
      } else if (type === "data") {
        if (!Utilities.dataServiceIDs[serviceID]) {
          throw new Error("Invalid service ID");
        }
        if (!phone) {
          throw new Error("Phone required");
        }
        if (!/^0\d{10}$/.test(phone)) {
          throw new Error(
            "Phone number must start with 0 and be exactly 11 digits long"
          );
        }
        if (!billersCode) {
          throw new Error("Billers code required");
        }
        if (!variation_code) {
          throw new Error("Variation code required");
        }
        delete req.body.amount;
      } else if (type === "tv") {
        if (!Utilities.tvServiceIDs[serviceID]) {
          throw new Error("Invalid service ID");
        }
        if (!phone) {
          throw new Error("Phone required");
        }
        if (!/^0\d{10}$/.test(phone)) {
          throw new Error(
            "Phone number must start with 0 and be exactly 11 digits long"
          );
        }
        if (!billersCode) {
          throw new Error("Billers code required");
        }
        if (!variation_code) {
          throw new Error("Variation code required");
        }
        req.body.subscription_type = "change";
        delete req.body.amount;
        delete req.body.quantity;
      } else if (type === "electricity") {
        if (!Utilities.electricityServiceIDs[serviceID]) {
          throw new Error("Invalid service ID");
        }
        if (!amount) {
          throw new Error("Amount required");
        }
        if (isNaN(Number(amount))) {
          throw new Error("Invalid Amount");
        }
        if (!phone) {
          throw new Error("Phone required");
        }
        if (!/^0\d{10}$/.test(phone)) {
          throw new Error(
            "Phone number must start with 0 and be exactly 11 digits long"
          );
        }
        if (!billersCode) {
          throw new Error("Billers code required");
        }
        if (!variation_code) {
          throw new Error("Variation code required");
        }
        if (variation_code !== "prepaid" || variation_code !== "postpaid") {
          throw new Error("Variation code required");
        }
      } else {
        throw new Error("Invalid service type");
      }
    }),
];

exports.verify = [
  body("billersCode").notEmpty().withMessage("billersCode is required").bail(),
  body("serviceID").notEmpty().withMessage("serviceID is required").bail(),
  query("type")
    .notEmpty()
    .withMessage("type is required")
    .bail()

    .custom(async (type, { req }) => {
      const { serviceID, billersCode } = req.body;
      if (type === "data") {
        if (!Utilities.dataServiceIDs[serviceID]) {
          throw new Error("Invalid service ID");
        }

        if (serviceID !== "smile-direct") {
          throw new Error("Invalid service ID");
        }

        if (!billersCode) {
          throw new Error("Billers code required");
        }
      } else if (type === "tv") {
        if (!Utilities.tvServiceIDs[serviceID]) {
          throw new Error("Invalid service ID");
        }

        if (serviceID === "showmax") {
          throw new Error("Invalid service ID");
        }
        if (!billersCode) {
          throw new Error("Billers code required");
        }
      } else if (type === "electricity") {
        if (!Utilities.electricityServiceIDs[serviceID]) {
          throw new Error("Invalid service ID");
        }

        if (!billersCode) {
          throw new Error("Billers code required");
        }
        if (
          !req.body.type ||
          req.body.type !== "prepaid" ||
          req.body.type !== "postpaid"
        ) {
          throw new Error("Invalid type");
        }
      } else {
        throw new Error("Invalid service type");
      }
    }),
];

exports.variations = [
  query("serviceID").notEmpty().withMessage("serviceID is required").bail(),
  query("type")
    .notEmpty()
    .withMessage("username is required")
    .bail()

    .custom(async (type, { req }) => {
      const { serviceID } = req.query;
      if (type === "data") {
        if (!Utilities.dataServiceIDs[serviceID]) {
          throw new Error("Invalid service ID");
        }
      } else if (type === "tv") {
        if (!Utilities.tvServiceIDs[serviceID]) {
          throw new Error("Invalid service ID");
        }
      } else {
        throw new Error("Invalid service type");
      }
    }),
];
