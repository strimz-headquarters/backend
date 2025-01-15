const MessageResponse = require("./MessageResponse");

//check of there was a success while saving data to database
const DatabaseResponse = (res,data)=> {
    const {success} = data;
    if(success){
        return MessageResponse.successResponse(res,"user successfully created",201,data);     
    }else{
        return MessageResponse.errorResponse(res,"unproccessible",422,"error occurred while interracting with db");      
    }
};

const UsersResponse = (res,data)=> {
    const {success} = data;
    if(success){
        return MessageResponse.successResponse(res,"user successfully created",200,data);     
    }else{
        return MessageResponse.errorResponse(res,"unproccessible",422,"error occurred while interracting with db");      
    }
};

module.exports = {UsersResponse,DatabaseResponse};
