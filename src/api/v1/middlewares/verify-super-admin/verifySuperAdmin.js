const { User } = require("../../database/classes");
const verifyAdmin = async (req, res, next) => {
  const userId = req.user.uid;
  if (!userId)
    return res.status(401).json({
      success: false,
      message: "send a valid token",
    });

  const user = await User.getUser(userId);
  if (!user)
    return res.status(401).json({
      success: false,
      message: "send a valid token",
    });
  // if (!user.level)
  //   return res.status(403).json({
  //     success: false,
  //     message: "UNAUTHORIZED",
  //   });
  // if (user.level < 2)
  //   return res.status(403).json({
  //     success: false,
  //     message: "UNAUTHORIZED",
  //   });

  next();
};

module.exports = verifyAdmin;
