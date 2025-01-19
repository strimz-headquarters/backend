const router = require("express").Router();
const { PlanController } = require("../../controllers");
const { pagination, VerifyToken, verifyAdmin } = require("../../middlewares");
const PlanValidator = require("../../validators/plan/PlanValidator");

// add verification on token middleware
router.post(
  "/",
  VerifyToken,
  verifyAdmin,
  PlanValidator.createPlan,
  PlanController.createPlan
);
router.get("/", VerifyToken, pagination, PlanController.getPlans);
router.get("/:id", VerifyToken, PlanValidator.getPlan, PlanController.getPlan);
router.put(
  "/:id",
  VerifyToken,
  verifyAdmin,
  PlanValidator.getPlan,
  PlanController.updatePlan
);

router.delete(
  "/:id",
  VerifyToken,
  verifyAdmin,
  PlanValidator.getPlan,
  PlanController.deletePlan
);

module.exports = router;
