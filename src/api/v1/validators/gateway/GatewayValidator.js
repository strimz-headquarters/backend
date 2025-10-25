const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

// Merchant Validators
const merchantValidators = {
  register: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be 2-100 characters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),
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
    handleValidationErrors,
  ],

  getMerchantById: [
    param("merchantId").isUUID().withMessage("Invalid merchant ID format"),
    handleValidationErrors,
  ],
};

// Subscription Validators
const subscriptionValidators = {
  create: [
    body("userId")
      .notEmpty()
      .withMessage("User ID is required")
      .isUUID()
      .withMessage("Invalid user ID format"),
    body("price")
      .notEmpty()
      .withMessage("Plan ID is required")
      .isNumeric()
      .withMessage("Invalid plan ID format"),
    body("months")
      .optional()
      .isInt({ min: 1, max: 120 })
      .withMessage("Months must be between 1-120"),
    body("autoRenew")
      .optional()
      .isBoolean()
      .withMessage("autoRenew must be a boolean"),
    handleValidationErrors,
  ],

  getById: [
    param("id").isUUID().withMessage("Invalid subscription ID format"),
    handleValidationErrors,
  ],

  getUserSubscriptions: [
    param("userId").isUUID().withMessage("Invalid user ID format"),
    query("status")
      .optional()
      .isIn(["active", "expired", "cancelled", "pending"])
      .withMessage("Invalid status"),
    handleValidationErrors,
  ],

  getMerchantSubscriptions: [
    param("merchantId").isUUID().withMessage("Invalid merchant ID format"),
    query("status")
      .optional()
      .isIn(["active", "expired", "cancelled", "pending"])
      .withMessage("Invalid status"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1-100"),
    handleValidationErrors,
  ],

  cancel: [
    param("id").isUUID().withMessage("Invalid subscription ID format"),
    body("userId")
      .notEmpty()
      .withMessage("User ID is required for verification")
      .isUUID()
      .withMessage("Invalid user ID format"),
    handleValidationErrors,
  ],

  updateAutoRenew: [
    param("id").isUUID().withMessage("Invalid subscription ID format"),
    body("autoRenew")
      .notEmpty()
      .withMessage("autoRenew is required")
      .isBoolean()
      .withMessage("autoRenew must be a boolean"),
    handleValidationErrors,
  ],
};

// Payment Validators
const paymentValidators = {
  getBySubscription: [
    param("subscriptionId")
      .isUUID()
      .withMessage("Invalid subscription ID format"),
    handleValidationErrors,
  ],

  getByUser: [
    param("userId").isUUID().withMessage("Invalid user ID format"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1-100"),
    handleValidationErrors,
  ],

  getByMerchant: [
    param("merchantId").isUUID().withMessage("Invalid merchant ID format"),
    query("status")
      .optional()
      .isIn(["pending", "confirmed", "failed"])
      .withMessage("Invalid status"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid start date format"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid end date format"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1-100"),
    handleValidationErrors,
  ],
};

// Common Validators
const commonValidators = {
  uuidParam: (paramName) => [
    param(paramName).isUUID().withMessage(`Invalid ${paramName} format`),
    handleValidationErrors,
  ],
};

module.exports = {
  merchantValidators,
  planValidators,
  userValidators,
  subscriptionValidators,
  paymentValidators,
  commonValidators,
  handleValidationErrors,
};
