const bcrypt = require("bcryptjs");
const { CheckDBResponse } = require("../../helpers");
const { User, Token } = require("../../database/classes");
const { HashPassword } = require("../../helpers");
const jwt = require("jsonwebtoken");
const mailService = require("../../helpers/email/EmailConfig");
const crypto = require("crypto");
const {
  deploy_account,
} = require("../../controllers/contract/contract.controller");
const GenerateToken = async (uid) => {
  const access = "auth";
  const accessToken = jwt.sign(
    {
      uid,
      access,
    },
    process.env.ACCESS_TOKEN_SECRET
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

exports.signUp = async (data) => {
  try {
    const newUser = await User.createUser(data);

    // const accessToken = await GenerateToken(newUser.id);
    // newUser.dataValues.accessToken = accessToken;

    const randomBytes = crypto.randomBytes(32); // 32 bytes = 256 bits

    // Hash the random value using SHA-256
    const hash = crypto
      .createHash("sha256")
      .update(randomBytes)
      .digest("hex")
      .substring(0, 4);
    await Token.createVerificationToken(hash, newUser.id);
    const emailHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .otp {
        background-color: #f1f1f1;
        padding: 10px 20px;
        font-size: 24px;
        letter-spacing: 4px;
        border-radius: 5px;
        display: inline-block;
        margin: 20px 0;
      }
      .container {
        max-width: 600px;
        margin: 50px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      h1 {
        color: #4CAF50;
      }
      p {
        font-size: 16px;
        line-height: 1.5;
        margin: 20px 0;
      }
      .btn {
        background-color: #4CAF50;
        color: white;
        padding: 15px 25px;
        text-decoration: none;
        border-radius: 5px;
        font-size: 18px;
        display: inline-block;
      }
      .btn:hover {
        background-color: #45a049;
      }
      footer {
        margin-top: 20px;
        font-size: 12px;
        color: #999;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Email Verification</h1>
      <p>Hi there,</p>
      <p>Thanks for signing up! Please verify your email address by entering the OTP below:</p>
     <h1 class="otp">${hash}</h1>
      <p>If you did not sign up for this account, please ignore this email.</p>
      <footer>
        <p>&copy; ${new Date().getFullYear()} strimz. All rights reserved.</p>
      </footer>
    </div>
  </body>
  </html>
  `;
    await mailService.sendMail(newUser.email, ``, emailHTML);
    return CheckDBResponse.successResponse({
      ...newUser.dataValues,
      wallet: undefined,
      password: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      // accessToken,
    });
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

exports.verify = async (id) => {
  try {
    const token = await Token.getVerificationTokenById(id);

    const user = await User.getUser(token.userId);

    if (!user.verified) {
      const account_payload = {
        classHash: user.wallet.classHash,
        constructorCalldata: user.wallet.constructorCallData,
        addressSalt: user.wallet.publicKey,
      };
      await deploy_account(account_payload);
      await user.update({ verified: true });
    }
    const accessToken = await GenerateToken(user.id);
    await Token.deleteVerificationTokens(user.id);
    return CheckDBResponse.successResponse({
      ...user.dataValues,
      password: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      accessToken,
    });
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

exports.sendVerification = async (email) => {
  try {
    const user = await User.getUserByEmail(email);
    const randomBytes = crypto.randomBytes(32); // 32 bytes = 256 bits

    // Hash the random value using SHA-256
    const hash = crypto
      .createHash("sha256")
      .update(randomBytes)
      .digest("hex")
      .substring(0, 4);
    await Token.createVerificationToken(hash, user.id);
    const emailHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .otp {
        background-color: #f1f1f1;
        padding: 10px 20px;
        font-size: 24px;
        letter-spacing: 4px;
        border-radius: 5px;
        display: inline-block;
        margin: 20px 0;
      }
      .container {
        max-width: 600px;
        margin: 50px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      h1 {
        color: #4CAF50;
      }
      p {
        font-size: 16px;
        line-height: 1.5;
        margin: 20px 0;
      }
      .btn {
        background-color: #4CAF50;
        color: white;
        padding: 15px 25px;
        text-decoration: none;
        border-radius: 5px;
        font-size: 18px;
        display: inline-block;
      }
      .btn:hover {
        background-color: #45a049;
      }
      footer {
        margin-top: 20px;
        font-size: 12px;
        color: #999;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Email Verification</h1>
      <p>Hi there,</p>
      <p>We received a request to reset your password. Please enter the OTP below to proceed with resetting your password:</p>
     <h1 class="otp">${hash}</h1>
      <p>If you did not request a password reset, please ignore this email.</p>
      <footer>
        <p>&copy; ${new Date().getFullYear()} strimz. All rights reserved.</p>
      </footer>
    </div>
  </body>
  </html>
  `;
    await mailService.sendMail(user.email, ``, emailHTML);

    return CheckDBResponse.successResponse({
      ...user.dataValues,
      password: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    });
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

exports.signIn = async (data) => {
  try {
    const user = await User.getUserByEmail(data.email);
    // console
    const matchPassword = await bcrypt.compare(
      `${data.password}`,
      user.password
    );
    //check if the user has the correct password
    if (matchPassword) {
      if (!user.verified) {
        const randomBytes = crypto.randomBytes(32); // 32 bytes = 256 bits

        // Hash the random value using SHA-256
        const hash = crypto
          .createHash("sha256")
          .update(randomBytes)
          .digest("hex")
          .substring(0, 4);
        await Token.createVerificationToken(hash, user.id);
        const emailHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .otp {
        background-color: #f1f1f1;
        padding: 10px 20px;
        font-size: 24px;
        letter-spacing: 4px;
        border-radius: 5px;
        display: inline-block;
        margin: 20px 0;
      }
      .container {
        max-width: 600px;
        margin: 50px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      h1 {
        color: #4CAF50;
      }
      p {
        font-size: 16px;
        line-height: 1.5;
        margin: 20px 0;
      }
      .btn {
        background-color: #4CAF50;
        color: white;
        padding: 15px 25px;
        text-decoration: none;
        border-radius: 5px;
        font-size: 18px;
        display: inline-block;
      }
      .btn:hover {
        background-color: #45a049;
      }
      footer {
        margin-top: 20px;
        font-size: 12px;
        color: #999;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Email Verification</h1>
      <p>Hi there,</p>
      <p>To enhance security, please verify your login by entering the OTP below:</p>
     <h1 class="otp">${hash}</h1>
      <p>If you did not attempt to log in, please secure your account immediately.</p>
      <footer>
        <p>&copy; ${new Date().getFullYear()} strimz. All rights reserved.</p>
      </footer>
    </div>
  </body>
  </html>
  `;
        await mailService.sendMail(user.email, ``, emailHTML);

        return CheckDBResponse.errorResponse("Email verification sent");
      }

      if (user.status !== "active") {
        return CheckDBResponse.errorResponse(
          "Your account is blocked. Please contact customer support."
        );
      }

      //update the lastlogin time
      // await User.lastLogin(user.uid);
      // const accessToken = await GenerateToken(user.uid, user.role);
      const accessToken = await Token.getTokenById(user.id);
      // const { password, ...others } = user.dataValues;
      // const result = { accessToken, ...others };
      return CheckDBResponse.successResponse({
        ...user.dataValues,
        accessToken: accessToken?.accessToken ?? undefined,
        password: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      });
    } else {
      return CheckDBResponse.errorResponse("Invalid email or password");
    }
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

exports.inviteAdmin = async (data) => {
  try {
    const user = await User.getUserByEmail(data.email);
    await user.update({ level: 1 });

    const emailHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Upgrade Notification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 50px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      h1 {
        color: #4CAF50;
      }
      p {
        font-size: 16px;
        line-height: 1.5;
        margin: 20px 0;
      }
      .btn {
        background-color: #4CAF50;
        color: white;
        padding: 15px 25px;
        text-decoration: none;
        border-radius: 5px;
        font-size: 18px;
        display: inline-block;
      }
      .btn:hover {
        background-color: #45a049;
      }
      footer {
        margin-top: 20px;
        font-size: 12px;
        color: #999;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Congratulations! You’ve Been Upgraded to Admin</h1>
      <p>Hi ${user.username},</p>
      <p>We are excited to inform you that your account has been upgraded to an Admin role. This upgrade provides you with additional privileges and responsibilities within the platform.</p>
      <p><strong>What this means for you:</strong></p>
      <ul style="text-align: left; margin: 0 auto; display: inline-block;">
        <li>Access to advanced features and settings.</li>
        <li>Ability to manage other users.</li>
        <li>Enhanced control over matches.</li>
      </ul>
      <p>If you have any questions or need assistance with your new role, please don’t hesitate to reach out to us.</p>
      <footer>
        <p>&copy; ${new Date().getFullYear()} strimz. All rights reserved.</p>
      </footer>
    </div>
  </body>
  </html>
  `;
    await mailService.sendMail(
      user.email,
      ``,
      emailHTML,
      "Congratulations! You've Been Upgraded to Admin"
    );

    return CheckDBResponse.successResponse(user);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

exports.ResetPassword = async (data) => {
  try {
    const user = await User.getUserById(data?.id);
    const password = await HashPassword(data?.newPassword);
    const updatedUser = await User.updateUser(user.id, { password });
    return CheckDBResponse.successResponse(updatedUser);
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};

exports.updatePassword = async (userId, data) => {
  try {
    const user = await User.getUser(userId);
    const matchPassword = await bcrypt.compare(
      `${data.oldPassword}`,
      user.password
    );
    if (matchPassword) {
      const password = await HashPassword(data?.newPassword);
      const updatedUser = await User.updateUser(user.id, { password });
      return CheckDBResponse.successResponse(updatedUser);
    } else {
      return CheckDBResponse.errorResponse("Invalid Password");
    }
  } catch (error) {
    console.log(error);
    CheckDBResponse.errorResponse(error);
  }
};
