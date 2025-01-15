const { UtilitiesService } = require("../../services");
const { CheckBadRequest } = require("../../validations");
const { MessageResponse } = require("../../helpers");

exports.purchase = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = req.body;
  try {
    const subscription = await UtilitiesService.purchase(data);
    const { success, ...result } = subscription;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Subscription Successfull",
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

exports.verify = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const data = { ...req.body, type: req.query.type };
  try {
    const verification = await UtilitiesService.verify(data);
    const { success, ...result } = verification;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Verification Successfull",
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

exports.getVariationCodes = async (req, res, next) => {
  //check for errors
  const errors = CheckBadRequest(req, res, next);
  if (errors) return next(errors);
  const { serviceID } = req.query;
  try {
    const variation = await UtilitiesService.getDataVariations(serviceID);
    const { success, ...result } = variation;
    if (success) {
      MessageResponse.successResponse(
        res,
        "Subscription Successfull",
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
