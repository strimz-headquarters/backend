const {validationResult} = require("express-validator")
const ValidationException = require("../../validations/error/ValidationException");


const CheckError = (req,next) => {
    const errors = validationResult(req);
    console.log("working");
    if(!errors.isEmpty()){
        return next(new ValidationException(errors.array()));
    }
}


module.exports = CheckError;