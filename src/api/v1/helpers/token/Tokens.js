const jwt = require("jsonwebtoken");
const { Token } = require("../../database/classes");

//Generate user token
const GenerateToken = async (uid, role) => {
  const access = "auth";
  const accessToken = jwt.sign(
    {
      uid,
      access,
      role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    // { expiresIn: process.env.JWT_EXPIRE }
  );
  try {
    const userToken = await Token.getTokenById(uid);
    // check if the token is valid
    if (userToken) {
      userToken.accessToken = accessToken;
      await userToken.save();
      return accessToken;
    } else {
      await Token.createToken({ userId: uid, accessToken });
      return accessToken;
    }
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
};

//Delete user token
// const DestroyToken = async(id) => {
//     const userToken = await Token.findAll({where: {userId: id}});
//     console.log(userToken);
//     if(userToken){
//         userToken.destroy();
//         return {success: true, message: "token successfully deleted"};
//     }else{
//         return {success: false, message: "token has expired"}
//     }
// }

module.exports = GenerateToken;
