const {badRequest,notFound,invalidToken} = require("../../validations")
const {DataTypes} = require("sequelize");

const checkValidId =  (req,res,next) => {
    // console.log(req.user);
    const id = req.params.id;
    if(req.user.id !== id){
            throw new invalidToken();
        }
        next();
};

module.exports = checkValidId;
