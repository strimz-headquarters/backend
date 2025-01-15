//if an error occurred while saving the user
const errorResponse = (res, msg, statusCode, err) => {
    return res.status(statusCode).json({
        success: false,
        message: msg,
        error: err
    });
};

//if success occurred on saving user
const successResponse = (res, msg, statusCode, data) => {
    return res.status(statusCode).header("auth", data?.accessToken).json({
        success: true,
        message: msg,
        data: data,
    });
};

module.exports = { errorResponse, successResponse };