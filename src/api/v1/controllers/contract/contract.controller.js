const { RpcProvider, Contract, Account, cairo, CallData } = require("starknet");
const ABI = require("../../database/config/ABI.json");

const CONTRACT_ADDRESS =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_CONTRACT_ADDRESS
    : process.env.NODE_ENV === "test"
    ? process.env.TEST_CONTRACT_ADDRESS
    : process.env.DEV_CONTRACT_ADDRESS;
const get_provider_and_account = () => {
  const RPC_URL = process.env.RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const ACCOUNT_ADDRESS = process.env.ACCOUNT_ADDRESS;

  const provider = new RpcProvider({ nodeUrl: `${RPC_URL}` });
  const account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);

  return { provider, account };
};

const get_contract_instance = () => {
  const { account, provider } = get_provider_and_account();
  const contract = new Contract(ABI, CONTRACT_ADDRESS, provider);
  // Connect account with the contract
  contract.connect(account);

  return contract;
};

const deploy_account = async (account_payload) => {
  try {
    if (!account_payload) {
      return { success: false, data: {}, message: "Invalid call" };
    }

    const { account } = get_provider_and_account();
    const tx = await account.deployAccount(account_payload);
    return { success: true, data: tx, message: "Deployment successful" };
  } catch (error) {
    console.log(error);
    return { success: false, data: {}, message: error.message };
  }
};

module.exports = {
  deploy_account,
};
