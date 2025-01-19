const { CheckDBResponse } = require("../../helpers");
const { Payroll } = require("../../database/classes");
const { errorResponse } = require("../../helpers/messages/CheckDBStatus");

exports.createPayroll = async (data) => {
  try {
    const newPayroll = await Payroll.createPayroll(data);
    return CheckDBResponse.response(newPayroll);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

exports.getUserPayrolls = async (page, size, query) => {
  try {
    if (!query.owner) {
      return errorResponse("Owner required");
    }
    const payrolls = await Payroll.getUserPayrolls(page, size, query);
    return CheckDBResponse.response(payrolls);
  } catch (error) {
    return errorResponse(error);
  }
};

exports.getPayroll = async (query) => {
  try {
    let stop_execution = false;
    for (let i = 0; i < Object.keys(query).length; i++) {
      const element = Object.keys(query)[i];
      if (element !== "name" && element !== "id") {
        stop_execution = true;
        break;
      }
    }
    if (stop_execution) {
      return CheckDBResponse.errorResponse("Invalid query");
    }

    const payroll = await Payroll.getPayroll(query);
    return CheckDBResponse.response(payroll);
  } catch (error) {
    return CheckDBResponse.errorResponse(error);
  }
};

exports.updatePayroll = async (id, data) => {
  try {
    const updatedPayroll = await Payroll.updatePayroll(id, data);
    return CheckDBResponse.response(updatedPayroll);
  } catch (error) {
    console.log(error);
    return CheckDBResponse.errorResponse(error);
  }
};

exports.deletePayroll = async (id) => {
  try {
    const result = await Payroll.deletePayroll(id);
    return CheckDBResponse.successResponse(result.message);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};
