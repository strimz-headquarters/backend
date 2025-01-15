const crypto = require("crypto");
const {
  Account,
  constants,
  ec,
  json,
  stark,
  RpcProvider,
  hash,
  CallData,
} = require("starknet");
// Function to encrypt text
exports.encryptPvKey = (pvkey, password) => {
  const algorithm = "aes-256-cbc";
  const salt = crypto.randomBytes(16);

  // Derive a key and IV from the password using PBKDF2
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(pvkey, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return the encrypted data along with the salt and IV
  return {
    encryptedData: encrypted,
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
  };
};

// Function to decrypt text
exports.decryptPvKey = (encryptedData, password, saltHex, ivHex) => {
  const algorithm = "aes-256-cbc";
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");

  // Derive the key using the same salt and password
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

exports.computeAddress = () => {
  // new Open Zeppelin account v0.8.1
  // Generate public and private key pair.
  const privateKey = stark.randomAddress();
  const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);

  const OZaccountClassHash =
    "0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f";
  // Calculate future address of the account
  const OZaccountConstructorCallData = CallData.compile({
    publicKey: starkKeyPub,
  });
  const OZcontractAddress = hash.calculateContractAddressFromHash(
    starkKeyPub,
    OZaccountClassHash,
    OZaccountConstructorCallData,
    0
  );

  return {
    publicKey: starkKeyPub,
    accountClassHash: OZaccountClassHash,
    accountConstructorCallData: OZaccountConstructorCallData,
    address: OZcontractAddress,
    privateKey,
  };
};
