const { UsersService } = require("../../services");
const { CheckBadRequest } = require("../../validations");
const { MessageResponse } = require("../../helpers");
const { Blocked } = require("../../database/models");

//sign up new user
exports.createUsers = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = req.body;
  // console.log()
  try {
    const newUser = await UsersService.createUser(data);
    const { success, ...result } = newUser;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Account created Successfully",
        201,
        result.data
      );
    } else {
      MessageResponse.errorResponse(
        res,
        "unprocessible entity",
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

//sign in user
exports.updateUser = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  // const { notificationId } = req.params
  const data = req.body;
  const userId = req.user.uid;
  function filterNullProperties(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([key, value]) =>
          value !== null &&
          value !== undefined &&
          value.toString().trim() !== ""
      )
    );
  }

  try {
    const updatedUser = await UsersService.updateUser(
      userId,
      filterNullProperties({
        ...data,
        level: undefined,
        verified: undefined,
        password: undefined,
        email: undefined,
        username: undefined,
        firstname: undefined,
        lastname: undefined,
      })
    );
    const { success, ...result } = updatedUser;
    if (success) {
      MessageResponse.successResponse(
        res,
        "User Updated Successfully",
        200,
        result.data
      );
    } else {
      console.log(result);
      MessageResponse.errorResponse(
        res,
        "unprocessible entity",
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

exports.blockUser = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { userId, reason, status } = req.body;

  try {
    const updatedUser = await UsersService.updateUser(userId, { status });
    const { success, ...result } = updatedUser;
    if (success) {
      if (status === "active") {
        await Blocked.destroy({
          where: {
            userId,
          },
        });
      } else {
        await Blocked.create({ userId, reason });
      }
      MessageResponse.successResponse(
        res,
        "User Updated Successfully",
        200,
        result.data
      );
    } else {
      console.log(result);
      MessageResponse.errorResponse(
        res,
        "unprocessible entity",
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

exports.deleteUser = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  // const { id } = req.params;
  const id = req.user.uid;

  try {
    const deletedUser = await UsersService.deleteUser(id);
    const { success, ...result } = deletedUser;
    if (success) {
      MessageResponse.successResponse(
        res,
        "User Deleted Successfully",
        200,
        result.data
      );
    } else {
      console.log(result);
      MessageResponse.errorResponse(
        res,
        "unprocessible entity",
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

//get all users
exports.getAllUsers = async (req, res, next) => {
  const { page, size } = req.pagination;

  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);

  try {
    const users = await UsersService.getAllUsers(page, size, req.query);
    return MessageResponse.successResponse(
      res,
      "all users by page and size",
      200,
      users.data
    );
  } catch (error) {
    console.log(error);
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};

//get single user based on the parameter id
exports.getSingleUser = async (req, res, next) => {
  const id = req.params.id;
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  try {
    const user = await UsersService.getUser(id);
    return MessageResponse.successResponse(res, "user found", 200, user.data);
  } catch (error) {
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};

exports.exportWallet = async (req, res, next) => {
  const userId = req.user.uid;
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  try {
    const wallet = await UsersService.exportWallet(userId);
    return MessageResponse.successResponse(
      res,
      "Wallet found",
      200,
      wallet.data
    );
  } catch (error) {
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};

exports.withdraw = async (req, res, next) => {
  const userId = req.user.uid;
  const body = req.body;
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  try {
    const wallet = await UsersService.withdraw(userId, body);
    return MessageResponse.successResponse(
      res,
      "Wallet found",
      200,
      wallet.data
    );
  } catch (error) {
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};

//get user  based on their access token
exports.getUser = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { id } = req.params;
  try {
    const user = await UsersService.getUser(id);
    return MessageResponse.successResponse(res, "user found", 200, user.data);
  } catch (error) {
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};

exports.searchUser = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { query } = req.params;
  const { page, size } = req.pagination;

  try {
    const user = await UsersService.searchUser(query, page, size);
    if (user.success) {
      return MessageResponse.successResponse(res, "user found", 200, user.data);
    }
    return MessageResponse.errorResponse(res, user.message, 200, user.data);
  } catch (error) {
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};
