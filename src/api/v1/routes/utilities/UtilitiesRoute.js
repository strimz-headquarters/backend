const router = require("express").Router();
const { UtilitiesController } = require("../../controllers");
const { pagination, VerifyToken, verifyAdmin } = require("../../middlewares");
const UtilityValidator = require("../../validators/utilities/UtilitiesValidator");

// add verification on token middleware

router.post(
  "/purchase",
  // VerifyToken,
  UtilityValidator.purchase,
  UtilitiesController.purchase
);

router.post(
  "/verify",
  // VerifyToken,
  UtilityValidator.verify,
  UtilitiesController.verify
);

router.get(
  "/variations",
  UtilityValidator.variations,
  UtilitiesController.getVariationCodes
);

module.exports = router;
