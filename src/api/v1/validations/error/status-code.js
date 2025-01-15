function badRequest() {
    this.status = 400;
    this.message = "Invalid Id";
};

function invalidToken() {
    this.status = 400;
    this.message = "invalid user token";
};

function notFound(){
    this.status = 404;
    this.message = "not found";
};

function serverError(){
    this.status = 500;
    this.message = "server error";
};



module.exports = {badRequest,notFound,serverError,invalidToken};