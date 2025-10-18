const router = require("express").Router();

//All the routes that where created
const AuthRoute = require("./auth/AuthRoute");
const UserRoute = require("./user/UserRoute");
const UtilitiesRoute = require("./utilities/UtilitiesRoute");
const PayrollRoute = require("./payroll/PayrollRoute");
const MerchantRoute = require("./gateway/MerchantRoute");
const PaymentRoute = require("./gateway/PaymentRoute");
const TransactionRoute = require("./gateway/TransactionRoute");
const WebhookRoute = require("./gateway/WebhookRoute");
// const PlanRoute = require("./plan/PlanRoute");

router.use("/auth", AuthRoute);
router.use("/users", UserRoute);
router.use("/utilities", UtilitiesRoute);
router.use("/payroll", PayrollRoute);
router.use("/merchant", MerchantRoute);
router.use("/payment", PaymentRoute);
router.use("/transaction", TransactionRoute);
router.use("/webhook", WebhookRoute);
// router.use("/plan", PlanRoute);

module.exports = router;
