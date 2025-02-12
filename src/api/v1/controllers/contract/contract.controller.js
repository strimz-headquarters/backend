const { RpcProvider, Contract, Account, cairo } = require("starknet");
const ethers = require("ethers");
const ABI = require("../../database/config/ABI.json");
const ERC20_ABI = require("../../database/config/ERC20_ABI.json");
const { Wallet } = require("../../helpers");

const ENV = process.env.NODE_ENV;

/**
 * Utility function to get environment-specific variables
 */
const getEnvVar = (prod, test, dev) =>
  ENV === "production" ? prod : ENV === "test" ? test : dev;

/**
 * Contract Addresses
 */
const CONTRACT_ADDRESSES = {
  eth: getEnvVar(
    process.env.PROD_ETH_CONTRACT_ADDRESS,
    process.env.TEST_ETH_CONTRACT_ADDRESS,
    process.env.DEV_ETH_CONTRACT_ADDRESS
  ),
  strk: getEnvVar(
    process.env.PROD_STRK_CONTRACT_ADDRESS,
    process.env.TEST_STRK_CONTRACT_ADDRESS,
    process.env.DEV_STRK_CONTRACT_ADDRESS
  ),
};

const RPC_URLS = {
  eth: process.env.ETH_RPC_URL,
  strk: process.env.STRK_RPC_URL,
};

const PRIVATE_KEYS = {
  eth: process.env.ETH_PRIVATE_KEY,
  strk: process.env.STRK_PRIVATE_KEY,
};

const ACCOUNT_ADDRESSES = {
  eth: process.env.ETH_ACCOUNT_ADDRESS,
  strk: process.env.STRK_ACCOUNT_ADDRESS,
};

const ERC20_CONTRACT_ADDRESS = process.env.ERC20_CONTRACT_ADDRESS;

/**
 * Retrieves contract address based on type
 */
const getContractAddress = (type) => CONTRACT_ADDRESSES[type];

/**
 * Returns the provider and account for a given type (eth or strk)
 * Handles both user-specific and general cases
 */
const getProviderAndAccount = async (type, user = null) => {
  try {
    if (user) {
      const rpcUrl = RPC_URLS[user.type];

      if (user.type === "eth") {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const account = ethers.Wallet.fromEncryptedJsonSync(
          user.wallet.encryptedData,
          user.wallet.encryptionKey
        ).connect(provider);
        return { provider, account };
      }

      // Decrypt private key for Starknet
      const privateKey = await Wallet.decryptPvKey(
        user.wallet.encryptedData.encryptedData,
        user.wallet.encryptionKey.toString("hex"),
        user.wallet.encryptedData.salt,
        user.wallet.encryptedData.iv
      );

      const provider = new RpcProvider({ nodeUrl: rpcUrl });
      const account = new Account(provider, user.wallet.address, privateKey);

      return { provider, account };
    }

    // General case (non-user specific)
    const rpcUrl = RPC_URLS[type];
    const privateKey = PRIVATE_KEYS[type];
    const accountAddress = ACCOUNT_ADDRESSES[type];

    if (type === "eth") {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const account = new ethers.Wallet(privateKey, provider);
      return { provider, account };
    }

    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    const account = new Account(provider, accountAddress, privateKey);
    return { provider, account };
  } catch (error) {
    console.error(`Error in getProviderAndAccount: ${error.message}`);
    throw error;
  }
};

/**
 * Returns contract instance based on type (eth or strk)
 * Supports both user-specific and non-user-specific instances
 */
const getContractInstance = async (type, user = null) => {
  try {
    const { account, provider } = await getProviderAndAccount(type, user);
    const contractAddress = getContractAddress(type);

    if (type === "eth") {
      return new ethers.Contract(contractAddress, ABI, account);
    }

    const contract = new Contract(ABI, contractAddress, provider);
    contract.connect(account);
    return contract;
  } catch (error) {
    console.error(`Error in getContractInstance: ${error.message}`);
    throw error;
  }
};

/**
 * Returns an instance of the Starknet ERC-20 contract
 */
const getStrkErc20ContractInstance = async () => {
  try {
    const { account, provider } = await getProviderAndAccount("strk");
    const contract = new Contract(ERC20_ABI, ERC20_CONTRACT_ADDRESS, provider);
    contract.connect(account);
    return { contract, provider };
  } catch (error) {
    console.error(`Error in getStrkErc20ContractInstance: ${error.message}`);
    throw error;
  }
};

/**
 * Transfers deployment fee using the Starknet ERC-20 contract
 */
const transferDeploymentFee = async (recipient, amount) => {
  try {
    const { contract, provider } = await getStrkErc20ContractInstance();

    if (!contract) throw new Error("Contract instance not set");

    const tx = await contract.transfer(
      recipient,
      cairo.uint256(Number(amount))
    );
    console.log("Transaction: ", tx);

    await provider.waitForTransaction(tx.transaction_hash);
    return true;
  } catch (error) {
    console.error(`Error in transferDeploymentFee: ${error.message}`);
    return false;
  }
};

module.exports = {
  transferDeploymentFee,
};
