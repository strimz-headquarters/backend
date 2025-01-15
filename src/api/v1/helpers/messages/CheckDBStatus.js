const errorResponse = (error) => {
    return {
        success: false,
        error
    }
};

const successResponse = (data) => {
    return { success: true, message: data }
};

const response = (data) => {


    if (data) {
        return { success: data.success ?? true, data }
    } else {
        return { success: false, data: "no record found", message: "no record found" }
    }
}

module.exports = { errorResponse, successResponse, response };