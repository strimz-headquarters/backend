const router = require("express").Router();

//All the routes that where created
const AuthRoute = require("./auth/AuthRoute");
const UserRoute = require("./user/UserRoute");

router.use("/auth", AuthRoute);
router.use("/users", UserRoute);

module.exports = router;
