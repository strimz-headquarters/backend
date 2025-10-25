const crypto = require("crypto");

exports.getTokenAddress = (currency) => {
  // Mainnet addresses - change for testnet
  const addresses = {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  };
  return addresses[currency];
};

exports.generateRequestId = () => {
  // Define the timezone offset for Africa/Lagos (GMT+1)
  const lagosTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );

  // Format the date as YYYYMMDDHHmm
  const year = lagosTime.getFullYear();
  const month = String(lagosTime.getMonth() + 1).padStart(2, "0");
  const day = String(lagosTime.getDate()).padStart(2, "0");
  const hour = String(lagosTime.getHours()).padStart(2, "0");
  const minute = String(lagosTime.getMinutes()).padStart(2, "0");
  const formattedDate = `${year}${month}${day}${hour}${minute}`;

  // Generate a random alphanumeric string
  const randomString = crypto.randomBytes(6).toString("hex"); // 12 characters long

  // Concatenate the formatted date with the random string
  const requestId = `${formattedDate}${randomString}`;

  return requestId;
};

exports.airtimeServiceIds = {
  mtn: "mtn",
  glo: "glo",
  airtel: "airtel",
  etisalat: "etisalat",
};

exports.dataServiceIDs = {
  "mtn-data": "mtn-data",
  "airtel-data": "airtel-data",
  "glo-data": "glo-data",
  "glo-sme-data": "glo-sme-data",
  "etisalat-data": "etisalat-data",
  "9mobile-sme-data": "9mobile-sme-data",
  "smile-direct": "smile-direct",
  spectranet: "spectranet",
};

exports.tvServiceIDs = {
  dstv: "dstv",
  gotv: "gotv",
  startimes: "startimes",
  showmax: "showmax",
};

exports.electricityServiceIDs = {
  "ikeja-electric": "ikeja-electric",
  "eko-electric": "eko-electric",
  "kano-electric": "kano-electric",
  "portharcourt-electric": "portharcourt-electric",
  "jos-electric": "jos-electric",
  "ibadan-electric": "ibadan-electric",
  "kaduna-electric": "kaduna-electric",
  "abuja-electric": "abuja-electric",
  "enugu-electric": "enugu-electric",
  "benin-electric": "benin-electric",
  "aba-electric": "aba-electric",
  "yola-electric": "yola-electric",
};
