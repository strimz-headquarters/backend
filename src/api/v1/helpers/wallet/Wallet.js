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

// PBKDF2 parameters
const ITERATIONS = 100000; // Number of iterations for PBKDF2
const KEY_LENGTH = 32; // Key length for AES-256 (32 bytes)
const DIGEST = "sha256"; // Hashing algorithm for PBKDF2
const IV_LENGTH = 16; // AES block size for IV

// Derive a key using PBKDF2 from the bcrypt hash of the password
exports.deriveKeyFromPassword = (passwordHash) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(IV_LENGTH);

    // Use PBKDF2 to derive a 256-bit key from the password hash
    crypto.pbkdf2(
      passwordHash,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      DIGEST,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey);
      }
    );
  });
};

// Function to encrypt text
exports.encryptPvKey = async (pvkey, password) => {
  const algorithm = "aes-256-cbc";
  const salt = crypto.randomBytes(IV_LENGTH);

  // Derive a key from the password and salt using PBKDF2
  const key = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, "sha256", (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });

  const iv = crypto.randomBytes(IV_LENGTH); // Generate random IV

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(pvkey, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return the encrypted data along with the salt and IV (in hex format)
  return {
    encryptedData: encrypted,
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
  };
};

// Function to decrypt text
exports.decryptPvKey = async (encryptedData, password, saltHex, ivHex) => {
  const algorithm = "aes-256-cbc";

  // Convert the salt and iv from hex back to Buffer
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");

  // Derive the key from the password and salt using PBKDF2
  const key = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, "sha256", (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });

  // Create the decipher using the derived key and IV
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  // Decrypt the data
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted; // Return the decrypted data
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
    classHash: OZaccountClassHash,
    constructorCallData: OZaccountConstructorCallData,
    address: OZcontractAddress,
    privateKey,
  };
};
