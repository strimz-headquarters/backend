const router = require("express").Router();
const { AuthController } = require("../../controllers");
const { VerifyToken } = require("../../middlewares");
const AuthValidator = require("../../validators/auth/AuthValidator");
const UserValidator = require("../../validators/user/UserValidator");

router.post("/sign-up", AuthValidator.addUser, AuthController.signUp);
router.post("/sign-in", AuthValidator.loginUser, AuthController.signIn);

router.get(
  "/verify/:id",
  UserValidator.getVerificationToken,
  AuthController.verify
);
router.post(
  "/send-verification",
  AuthValidator.emailExists,
  AuthController.sendVerification
);
router.post(
  "/reset-password",
  VerifyToken,
  AuthValidator.ResetUserPassword,
  AuthController.ResetPassword
);
router.post(
  "/change-password",
  AuthValidator.changePassword,
  VerifyToken,
  AuthController.changePassword
);

module.exports = router;
