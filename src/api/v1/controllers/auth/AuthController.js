const { AuthService } = require("../../services");
const { CheckBadRequest } = require("../../validations");
const { MessageResponse } = require("../../helpers");
const { User, Token } = require("../../database/classes");
//sign up new user
exports.signUp = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = req.body;

  try {
    const newUser = await AuthService.signUp({
      ...data,
      verified: undefined,
    });
    const { success, ...result } = newUser;
    if (success) {
      MessageResponse.successResponse(
        res,
        "user successfully signed up",
        201,
        result.message
      );
    } else {
      MessageResponse.errorResponse(res, result.message, 422, result.message);
    }
  } catch (error) {
    console.log(error);
    MessageResponse.errorResponse(
      res,
      "internal server error",
      500,
      error.message
    );
  }
};

exports.verify = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const id = req.params.id;

  try {
    const user = await AuthService.verify(id);
    const { success, ...result } = user;
    if (success) {
      MessageResponse.successResponse(
        res,
        "user successfully verified",
        201,
        result.message
      );
    } else {
      MessageResponse.errorResponse(res, result.message, 422, result.message);
    }
  } catch (error) {
    console.log(error);
    MessageResponse.errorResponse(
      res,
      "internal server error",
      500,
      error.message
    );
  }
};

exports.sendVerification = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { email } = req.body;

  try {
    await AuthService.sendVerification(email);
    MessageResponse.successResponse(res, "Email verification sent", 201, {});
  } catch (error) {
    console.log(error);
    MessageResponse.errorResponse(
      res,
      "internal server error",
      500,
      error.message
    );
  }
};

//sign in user
exports.signIn = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = req.body;
  try {
    const authenticatedUser = await AuthService.signIn(data);
    const { success, ...result } = authenticatedUser;

    if (success) {
      MessageResponse.successResponse(
        res,
        "user successfully signed in",
        200,
        result.message
      );
    } else {
      console.log(result);
      MessageResponse.errorResponse(res, result.error, 422, result.error);
    }
  } catch (error) {
    console.log(error);
    MessageResponse.errorResponse(
      res,
      "internal server error",
      500,
      error.message
    );
  }
};

exports.inviteAdmin = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = req.body;
  try {
    const invitation = await AuthService.inviteAdmin(data);
    const { success, ...result } = invitation;

    if (success) {
      MessageResponse.successResponse(
        res,
        "New Admin added",
        200,
        result.message
      );
    } else {
      console.log(result);
      MessageResponse.errorResponse(res, result.error, 422, result.error);
    }
  } catch (error) {
    console.log(error);
    MessageResponse.errorResponse(
      res,
      "internal server error",
      500,
      error.message
    );
  }
};

//check if username or email exists
exports.EmailOrUsernameExist = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { cred } = req.body;
  try {
    const userExist = await User.getUserByUsernameOrEmail(cred);
    if (userExist) {
      MessageResponse.successResponse(res, "success", 200, userExist);
      // MessageResponse.errorResponse(
      //   res,
      //   "username already exist",
      //   400,
      //   `${username} already exists`
      // );
    } else {
      MessageResponse.errorResponse(
        res,
        "no data found",
        400,
        `$no data found`
      );
      // MessageResponse.successResponse(
      //   res,
      //   "does not exists",
      //   200,
      //   "username and email does not exist"
      // );
    }
  } catch (error) {
    console.log(error);
    MessageResponse.errorResponse(
      res,
      "internal server error",
      500,
      error.message
    );
  }
};

//reset user password
exports.ResetPassword = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = req.body;
  try {
    const updatedUser = await AuthService.ResetPassword({
      ...data,
      id: req.user.uid,
    });
    const { success, ...result } = updatedUser;
    if (success) {
      MessageResponse.successResponse(
        res,
        "password updated successfully",
        200,
        result.message
      );
    } else {
      console.log(result);
      MessageResponse.errorResponse(res, result.message, 422, result.error);
    }
  } catch (error) {
    console.log(error);
    MessageResponse.errorResponse(
      res,
      "internal server error",
      500,
      error.message
    );
  }
};

exports.changePassword = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = req.body;
  const userId = req.user.uid;
  try {
    const updatedUser = await AuthService.updatePassword(userId, data);
    const { success, ...result } = updatedUser;
    if (success) {
      MessageResponse.successResponse(
        res,
        "password updated successfully",
        200,
        result.message
      );
    } else {
      console.log(result);
      MessageResponse.errorResponse(
        res,
        result.error ?? "unprocessible entity",
        422,
        result.error
      );
    }
  } catch (error) {
    console.log(error);
    MessageResponse.errorResponse(
      res,
      "internal server error",
      500,
      error.message
    );
  }
};
