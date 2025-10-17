// validators/paymentValidators.js
const { body, param, query, validationResult } = require("express-validator");

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// Merchant registration validation
const merchantRegistrationValidator = [
  body("businessName")
    .trim()
    .notEmpty()
    .withMessage("Business name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Business name must be 2-255 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("walletAddress")
    .trim()
    .notEmpty()
    .withMessage("Wallet address is required")
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Invalid Ethereum wallet address"),

  body("phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),

  body("country")
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage("Country code must be 2 characters")
    .isAlpha()
    .withMessage("Country code must be alphabetic"),

  handleValidationErrors,
];

// Payment session creation validation
const createPaymentSessionValidator = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.000001 })
    .withMessage("Amount must be greater than 0")
    .custom((value) => {
      if (!/^\d+(\.\d{1,8})?$/.test(value.toString())) {
        throw new Error("Amount can have maximum 8 decimal places");
      }
      return true;
    }),

  body("orderId")
    .trim()
    .notEmpty()
    .withMessage("Order ID is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Order ID must be 1-255 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Order ID can only contain alphanumeric characters, dashes and underscores"
    ),

  body("currency")
    .optional()
    .isIn(["ETH", "MATIC", "BNB", "USDT", "USDC"])
    .withMessage("Invalid currency"),

  body("successUrl")
    .optional()
    .isURL()
    .withMessage("Success URL must be a valid URL"),

  body("cancelUrl")
    .optional()
    .isURL()
    .withMessage("Cancel URL must be a valid URL"),

  body("metadata")
    .optional()
    .isObject()
    .withMessage("Metadata must be an object"),

  handleValidationErrors,
];

// Process payment validation
const processPaymentValidator = [
  body("sessionId")
    .trim()
    .notEmpty()
    .withMessage("Session ID is required")
    .isLength({ min: 5 })
    .withMessage("Invalid session ID"),

  body("txHash")
    .trim()
    .notEmpty()
    .withMessage("Transaction hash is required")
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage("Invalid transaction hash"),

  handleValidationErrors,
];

// Refund validation
const refundValidator = [
  body("paymentId")
    .trim()
    .notEmpty()
    .withMessage("Payment ID is required")
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage("Invalid payment ID"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason must be less than 500 characters"),

  handleValidationErrors,
];

// Webhook configuration validation
const webhookConfigValidator = [
  body("url")
    .trim()
    .notEmpty()
    .withMessage("Webhook URL is required")
    .isURL({ protocols: ["https"] })
    .withMessage("Webhook URL must be HTTPS"),

  body("events")
    .optional()
    .isArray()
    .withMessage("Events must be an array")
    .custom((events) => {
      const validEvents = [
        "payment.completed",
        "payment.failed",
        "payment.refunded",
        "withdrawal.completed",
      ];
      const invalid = events.filter((e) => !validEvents.includes(e));
      if (invalid.length > 0) {
        throw new Error(`Invalid events: ${invalid.join(", ")}`);
      }
      return true;
    }),

  handleValidationErrors,
];

// Query parameter validation for pagination
const paginationValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sort")
    .optional()
    .isIn(["created_at", "-created_at", "amount", "-amount"])
    .withMessage("Invalid sort parameter"),

  handleValidationErrors,
];

// Transaction query validation
const transactionQueryValidator = [
  query("status")
    .optional()
    .isIn(["pending", "processing", "completed", "failed", "cancelled"])
    .withMessage("Invalid status"),

  query("type")
    .optional()
    .isIn(["payment", "refund", "withdrawal", "fee", "adjustment"])
    .withMessage("Invalid transaction type"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be ISO 8601 format"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be ISO 8601 format")
    .custom((endDate, { req }) => {
      if (
        req.query.startDate &&
        new Date(endDate) < new Date(req.query.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  ...paginationValidator,
];

// UUID parameter validation
const uuidParamValidator = (paramName) => [
  param(paramName).isUUID().withMessage(`${paramName} must be a valid UUID`),

  handleValidationErrors,
];

module.exports = {
  merchantRegistrationValidator,
  createPaymentSessionValidator,
  processPaymentValidator,
  refundValidator,
  webhookConfigValidator,
  paginationValidator,
  transactionQueryValidator,
  uuidParamValidator,
  handleValidationErrors,
};
