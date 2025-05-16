const router = require("express").Router();
const { UserController } = require("../../controllers");
const { pagination, VerifyToken, verifyAdmin } = require("../../middlewares");
const UserValidator = require("../../validators/user/UserValidator");

// add verification on token middleware

router.get(
  "/",
  VerifyToken,
  verifyAdmin,
  pagination,
  UserController.getAllUsers
);
router.get("/name/:query", pagination, VerifyToken, UserController.searchUser);
router.post(
  "/export-wallet",
  VerifyToken,
  UserValidator.exportWallet,
  UserController.exportWallet
);

router.post(
  "/withdraw",
  VerifyToken,
  UserValidator.withdraw,
  UserController.withdraw
);
router.get("/:id", VerifyToken, UserValidator.getUser, UserController.getUser);
router.put("/", VerifyToken, UserController.updateUser);
router.put(
  "/block",
  VerifyToken,
  verifyAdmin,
  UserValidator.getBlockParams,
  UserController.blockUser
);
// router.delete(
//   "/",
//   VerifyToken,
//   // UserValidator.getUser,
//   UserController.deleteUser
// );

module.exports = router;
