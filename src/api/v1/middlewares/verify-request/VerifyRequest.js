const {body} = require("express-validator");


const VerifyRequest = () => {
    body("username").notEmpty().withMessage("Username should not be empty")
.bail()
.isLength({min: 5, max: 32}).withMessage("It should have a min value of 6 and a max of 32"),
body("email").isEmail().withMessage("It should be a valid email")
.bail()
.custom(async(email) => {
    const user = await User.findByEmail(email)
    if(user){
        throw new Error("this email is already in use");
    }
}),
body("password").notEmpty().withMessage("Password should not be empty")
}