const router = require("express").Router();
const { PayrollController } = require("../../controllers");
const { pagination, VerifyToken, verifyAdmin } = require("../../middlewares");
const PayrollValidator = require("../../validators/payroll/PayrollValidator");

// add verification on token middleware
router.post(
  "/",
  VerifyToken,
  PayrollValidator.createPayroll,
  PayrollController.createPayroll
);
router.get("/", VerifyToken, pagination, PayrollController.getUserPayrolls);
router.get(
  "/",
  VerifyToken,
  PayrollValidator.getPayrollQuery,
  PayrollController.getPayroll
);
router.put(
  "/:id",
  VerifyToken,
  PayrollValidator.getPayroll,
  PayrollController.updatePayroll
);

router.delete(
  "/:id",
  VerifyToken,
  PayrollValidator.getPayroll,
  PayrollController.deletePayroll
);

module.exports = router;
