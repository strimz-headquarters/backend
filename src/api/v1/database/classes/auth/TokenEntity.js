const { Token, VerificationToken } = require("../../models");

class TokenEntity {
  static async createToken(data) {
    try {
      const newToken = await Token.create(data);
      return newToken;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async createVerificationToken(hash, userId) {
    try {
      const newToken = await VerificationToken.create({ token: hash, userId });
      return newToken;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async updateToken(uid, data) {
    try {
      const updatedToken = await Token.findByPk(uid);
      await updatedToken.update(data);
      return updatedToken;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async deleteToken(userId) {
    try {
      const deletedToken = await Token.findOne({ where: { userId } });
      await deletedToken.destroy();
      return { success: true, message: "Token successfully deleted" };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async deleteVerificationTokens(userId) {
    try {
      await VerificationToken.destroy({ where: { userId } });
      return { success: true, message: "Token successfully deleted" };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getTokenById(userId) {
    try {
      const userToken = await Token.findOne({ where: { userId } });
      return userToken;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getVerificationTokenById(id) {
    try {
      const token = await VerificationToken.findOne({ where: { token: id } });
      return token;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getUserByToken(accessToken) {
    try {
      const userToken = await Token.findOne({ where: { accessToken } });
      return userToken;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }
}

module.exports = TokenEntity;
