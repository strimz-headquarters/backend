const { CheckDBResponse } = require("../../helpers");
const { Plan } = require("../../database/classes");
const { errorResponse } = require("../../helpers/messages/CheckDBStatus");

exports.createPlan = async (data) => {
  try {
    const newPlan = await Plan.createPlan(data);
    return CheckDBResponse.response(newPlan);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

exports.getPlans = async (page, size, query) => {
  try {
    const plans = await Plan.getPlans(page, size, query);
    return CheckDBResponse.response(plans);
  } catch (error) {
    return errorResponse(error);
  }
};

exports.getPlan = async (query) => {
  try {
    const plan = await Plan.getPlan(query);
    return CheckDBResponse.response(plan);
  } catch (error) {
    return CheckDBResponse.errorResponse(error);
  }
};

exports.updatePlan = async (id, data) => {
  try {
    const updatedPlan = await Plan.updatePlan(id, data);
    return CheckDBResponse.response(updatedPlan);
  } catch (error) {
    console.log(error);
    return CheckDBResponse.errorResponse(error);
  }
};

exports.deletePlan = async (id) => {
  try {
    const result = await Plan.deletePlan(id);
    return CheckDBResponse.successResponse(result.message);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};
