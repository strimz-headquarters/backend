const router = require("express").Router();

//All the routes that where created
const AuthRoute = require("./auth/AuthRoute");
const UserRoute = require("./user/UserRoute");
const UtilitiesRoute = require("./utilities/UtilitiesRoute");

router.use("/auth", AuthRoute);
router.use("/users", UserRoute);
router.use("/utilities", UtilitiesRoute);

module.exports = router;
