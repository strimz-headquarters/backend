const jwt = require("jsonwebtoken");
const { Token } = require("../../database/classes");

const VerifyToken = async (req, res, next) => {
    // const token = req.header("auth");
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token === undefined) return res.status(401).json({
        success: false,
        message: "send a valid token"
    });

    //get the user id    
    const id = req.params.id;

    const userToken = await Token.getUserByToken(token);
    if (!userToken) return res.status(401).json({ success: false, message: "send a valid token" });

    //verify token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: "invalid token" });
        req.user = user;
        next();
    })
}

module.exports = VerifyToken;