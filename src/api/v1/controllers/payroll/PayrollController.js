const { PayrollService } = require("../../services");
const { CheckBadRequest } = require("../../validations");
const { MessageResponse } = require("../../helpers");

exports.createPayroll = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = req.body;
  try {
    const newPayroll = await PayrollService.createPayroll({
      ...data,
      status: "active",
      owner: req.user.uid,
      id: undefined,
      last_payroll: undefined,
    });
    const { success, ...result } = newPayroll;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Payroll created Successfully",
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

exports.updatePayroll = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedPayroll = await PayrollService.updatePayroll(id, {
      ...data,
      plan: undefined,
      last_payroll: undefined,
      owner: undefined,
    });
    const { success, ...result } = updatedPayroll;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Payroll Updated Successfully",
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

exports.deletePayroll = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { id } = req.params;

  try {
    const deletedPayroll = await PayrollService.deletePayroll(id);
    const { success, ...result } = deletedPayroll;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Payroll Deleted Successfully",
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

exports.getUserPayrolls = async (req, res, next) => {
  const { page, size } = req.pagination;
  const owner = req.user.uid;
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);

  try {
    const payrolls = await PayrollService.getUserPayrolls(page, size, {
      ...req.query,
      owner,
    });
    return MessageResponse.successResponse(
      res,
      "all payrolls by page and size",
      200,
      payrolls.data
    );
  } catch (error) {
    console.log(error);
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};

exports.getPayroll = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  try {
    const payroll = await PayrollService.getPayroll(req.query);
    return MessageResponse.successResponse(
      res,
      "payroll found",
      200,
      payroll.data
    );
  } catch (error) {
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};
