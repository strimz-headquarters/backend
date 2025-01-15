const ErrorHandler = (err, req, res, next) => {
    const { status, message, errors } = err;
    let validationError = {};
    let error;
    if (errors) {
        errors.forEach(error => {
            validationError[error.param] = error.msg;
        });
        error = errors[0].msg;
    }
    return res.status(status).json({
        success: false,
        message: error,
        timestamps: Date.now(),
        path: req.originalUrl,
        error: message
    })
}

module.exports = ErrorHandler;