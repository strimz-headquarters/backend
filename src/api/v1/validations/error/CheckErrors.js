const {validationResult} = require("express-validator");
const ValidationException = require("./ValidationException");

const CheckErrors = (req,) => {
    //checking for errors from the request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
     return new ValidationException(errors.array());
    }
    return false;
}



module.exports = CheckErrors;