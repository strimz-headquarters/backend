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
 */
const getProviderAndAccountEth = async (user = null) => {
  const rpcUrl = RPC_URLS.eth;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  if (user) {
    const account = ethers.Wallet.fromEncryptedJsonSync(
      user.wallet.encryptedData,
      user.wallet.encryptionKey
    ).connect(provider);
    return { provider, account };
  }
  const privateKey = PRIVATE_KEYS.eth;
  const account = new ethers.Wallet(privateKey, provider);
  return { provider, account };
};

const getProviderAndAccountStrk = async (user = null) => {
  const rpcUrl = RPC_URLS.strk;
  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  if (user) {
    const privateKey = await Wallet.decryptPvKey(
      user.wallet.encryptedData.encryptedData,
      user.wallet.encryptionKey.toString("hex"),
      user.wallet.encryptedData.salt,
      user.wallet.encryptedData.iv
    );
    const account = new Account(provider, user.wallet.address, privateKey);
    return { provider, account };
  }
  const privateKey = PRIVATE_KEYS.strk;
  const account = new Account(provider, ACCOUNT_ADDRESSES.strk, privateKey);
  return { provider, account };
};

/**
 * Estimates gas for Ethereum
 */
const estimateGasEth = async (entrypoint, args, receipient) => {
  try {
    const { account, provider } = await getProviderAndAccountEth();

    const { contract } = await getContractInstanceEth();
    const tx = {
      to: CONTRACT_ADDRESSES.eth,
      data: contract.interface.encodeFunctionData(entrypoint, args),
    };
    const gasLimit = await provider.estimateGas(tx);
    console.log("Estimated gas limit:", gasLimit.toString());

    const feeData = await provider.getFeeData();
    const gasPrice =
      feeData.gasPrice || feeData.maxFeePerGas || feeData.maxPriorityFeePerGas;
    const gasCost = Number(gasPrice) * Number(gasLimit);

    const transaction = await account.sendTransaction({
      to: receipient,
      value: gasCost,
      gasLimit: 21000,
      gasPrice: gasPrice,
    });

    const receipt = await transaction.wait();
    return receipt.hash;
  } catch (error) {
    throw error;
  }
};

/**
 * Estimates gas for Starknet
 */
const estimateGasStrk = async (entrypoint, args, receipient) => {
  try {
    const { account, provider } = await getProviderAndAccountStrk();

    const function_call = {
      contractAddress: CONTRACT_ADDRESSES.strk,
      entrypoint,
      calldata: args,
    };

    const tx_fee = await account.estimateInvokeFee(function_call);
    const gasCost = Number(tx_fee.gas_price) * Number(tx_fee.suggestedMaxFee);

    const tx = await account.execute([
      {
        contractAddress: ERC20_CONTRACT_ADDRESS,
        entrypoint: "transfer",
        calldata: [receipient, cairo.uint256(Number(gasCost))],
      },
    ]);

    await provider.waitForTransaction(tx.transaction_hash);
    return tx.transaction_hash;
  } catch (error) {
    throw error;
  }
};

/**
 * Main function to estimate gas and send the fee based on type (eth or strk)
 */
const estimateGas = async (entrypoint, args, type, receipient) => {
  try {
    if (type === "eth") {
      return await estimateGasEth(entrypoint, args, receipient);
    } else if (type === "strk") {
      return await estimateGasStrk(entrypoint, args, receipient);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Returns contract instance based on type (eth or strk)
 */
const getContractInstanceEth = async () => {
  const { account, provider } = await getProviderAndAccountEth();
  const contract = new ethers.Contract(CONTRACT_ADDRESSES.eth, ABI, account);
  return { contract, provider };
};

const invokeFunctionEth = async (entrypoint, args, user = null) => {
  try {
    const { account } = await getProviderAndAccountEth(user);
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.eth, ABI, account);
    const call = {
      to: CONTRACT_ADDRESSES.eth,
      data: contract.interface.encodeFunctionData(entrypoint, args),
    };

    const tx = await account.sendTransaction(call);
    const receipt = await tx.wait();

    return receipt.hash;
  } catch (error) {
    throw error;
  }
};

const getContractInstanceStrk = async () => {
  const { account, provider } = await getProviderAndAccountStrk();
  const contract = new Contract(ABI, CONTRACT_ADDRESSES.strk, provider);
  contract.connect(account);
  return { contract, provider };
};

const invokeFunctionStrk = async (entrypoint, args, user = null) => {
  try {
    const { account, provider } = await getProviderAndAccountStrk(user);
    const contract = new Contract(ABI, CONTRACT_ADDRESSES.strk, provider);
    contract.connect(account);
    const call = contract.populate(entrypoint, args);
    const tx = await account.execute([call]);
    await provider.waitForTransaction(tx.transaction_hash);
    return tx.transaction_hash;
  } catch (error) {
    throw error;
  }
};

const invokeFunction = async (entrypoint, args, type, user = null) => {
  try {
    if (type === "eth") {
      return await invokeFunctionEth(entrypoint, args, user);
    }
    return invokeFunctionStrk(entrypoint, args, user);
  } catch (error) {
    throw error;
  }
};

/**
 * Transfer the deployment fee using Starknet ERC-20 contract
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

/**
 * Returns an instance of the Starknet ERC-20 contract
 */
// const getStrkErc20ContractInstance = async () => {
//   try {
//     const { account, provider } = await getProviderAndAccountStrk();
//     const contract = new Contract(ERC20_ABI, ERC20_CONTRACT_ADDRESS, provider);
//     contract.connect(account);
//     return { contract, provider };
//   } catch (error) {
//     console.error(`Error in getStrkErc20ContractInstance: ${error.message}`);
//     throw error;
//   }
// };

module.exports = {
  transferDeploymentFee,
  // getContractInstanceEth,
  // getContractInstanceStrk,
  estimateGas,
  invokeFunction,
};
