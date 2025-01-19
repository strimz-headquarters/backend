const { PlanService } = require("../../services");
const { CheckBadRequest } = require("../../validations");
const { MessageResponse } = require("../../helpers");

exports.createPlan = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = req.body;
  try {
    const newPlan = await PlanService.createPlan({
      ...data,
    });
    const { success, ...result } = newPlan;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Plan created Successfully",
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

exports.updatePlan = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedPlan = await PlanService.updatePlan(id, {
      ...data,
    });
    const { success, ...result } = updatedPlan;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Plan Updated Successfully",
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

exports.deletePlan = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { id } = req.params;

  try {
    const deletedPlan = await PlanService.deletePlan(id);
    const { success, ...result } = deletedPlan;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Plan Deleted Successfully",
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

exports.getPlans = async (req, res, next) => {
  const { page, size } = req.pagination;
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);

  try {
    const plans = await PlanService.getPlans(page, size, {
      ...req.query,
    });
    return MessageResponse.successResponse(
      res,
      "all plans by page and size",
      200,
      plans.data
    );
  } catch (error) {
    console.log(error);
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};

exports.getPlan = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  try {
    const plan = await PlanService.getPlan(req.query);
    return MessageResponse.successResponse(res, "plan found", 200, plan.data);
  } catch (error) {
    return MessageResponse.errorResponse(res, "server error", 500, error);
  }
};
