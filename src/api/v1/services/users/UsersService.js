const { CheckDBResponse } = require("../../helpers");
const { User } = require("../../database/classes");
const { errorResponse } = require("../../helpers/messages/CheckDBStatus");

//add a new Partner
exports.createUser = async (data) => {
  try {
    const newUser = await User.createUser(data);
    return CheckDBResponse.response(newUser);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

//get all paginated users
exports.getAllUsers = async (page, size, query) => {
  try {
    //get all the user from the database
    const users = await User.getAllUsers(page, size, query);
    return CheckDBResponse.response(users);
  } catch (error) {
    return errorResponse(error);
  }
};

//get a user based on id
exports.getUser = async (id) => {
  try {
    const user = await User.getUserById(id);

    // const {password,createdAt,updatedAt, ...others} = user.dataValues;
    return CheckDBResponse.response(user);
  } catch (error) {
    return CheckDBResponse.errorResponse(error);
  }
};

exports.exportWallet = async (id) => {
  try {
    const wallet = await User.exportWallet(id);

    return CheckDBResponse.response(wallet);
  } catch (error) {
    return CheckDBResponse.errorResponse(error);
  }
};

exports.withdraw = async (id, body) => {
  try {
    const result = await User.withdraw(id, body);

    return CheckDBResponse.response(result);
  } catch (error) {
    return CheckDBResponse.errorResponse(error);
  }
};

exports.searchUser = async (query, page, size) => {
  try {
    const user = await User.searchUser(query, page, size);

    // const {password,createdAt,updatedAt, ...others} = user.dataValues;
    return CheckDBResponse.response(user);
  } catch (error) {
    return CheckDBResponse.errorResponse(error);
  }
};

//edit a user
exports.updateUser = async (id, data) => {
  try {
    const updatedUser = await User.updateUser(id, data);
    return CheckDBResponse.response(updatedUser);
  } catch (error) {
    console.log(error);
    return CheckDBResponse.errorResponse(error);
  }
};

//delete Partner
exports.deleteUser = async (id) => {
  try {
    const result = await User.deleteUser(id);
    return CheckDBResponse.successResponse(result.message);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};
