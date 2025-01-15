const { CheckDBResponse, Utilities } = require("../../helpers");
const { errorResponse } = require("../../helpers/messages/CheckDBStatus");
const axios = require("axios");
const apiClient = axios.create({
  baseURL: process.env.VTPASS_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const API_KEY = process.env.VTPASS_API_KEY;
const PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;
const SECRET_KEY = process.env.VTPASS_SECRET_KEY;

const GET_HEADER = {
  "api-key": API_KEY,
  "public-key": PUBLIC_KEY,
};

const POST_HEADER = {
  "api-key": API_KEY,
  "secret-key": SECRET_KEY,
};
exports.purchase = async (data) => {
  try {
    const response = await apiClient.post(
      "/pay",
      {
        ...data,
        request_id: Utilities.generateRequestId(),
      },
      {
        headers: POST_HEADER,
      }
    );
    return CheckDBResponse.response(response.data);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

exports.getDataVariations = async (serviceID) => {
  try {
    const response = await apiClient.get(
      `/service-variations?serviceID=${serviceID}`,
      {
        headers: GET_HEADER,
      }
    );
    return CheckDBResponse.response(response.data);
  } catch (error) {
    return errorResponse(error);
  }
};

exports.verify = async (data) => {
  try {
    let url =
      data.type !== "data" ? "merchant-verify" : "merchant-verify/smile/email";
    const response = await apiClient.post(url, data, {
      headers: POST_HEADER,
    });
    return CheckDBResponse.response(response.data);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};
