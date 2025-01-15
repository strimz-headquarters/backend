const bcrypt = require("bcryptjs");

//hash user password
const HashPassword = async (password) => {
  try {
    if (password !== undefined) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } else {
      return "";
    }
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
};

module.exports = HashPassword;
