const { ethers } = require('ethers');
const fs = require("fs");
require("dotenv").config();

async function deployUserNFT() {

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // collegamento al wallet
  const abi = fs.readFileSync("../artifacts/contracts/UserNFT.sol/UserNFT.json", "utf8"); // lettura file abi del contract
  const bin = fs.readFileSync("../artifacts/contracts/UserNFT.sol/UserNFT.bin", "utf8"); // lettura file bin del contract

  const contractFactory = new ethers.ContractFactory(abi, bin, wallet); // creazione del creatore del contratto
  console.log("Contract is ready to be deployed.");
  const contract = await contractFactory.deploy(); // inizializzazione del contratto
  console.log("Contract is deployed.");
  const deploymentReceipt = await contract.deployTransaction.wait(1); //aspetta che sia confermato da un blocco

  console.log(num.toString());
}


deployUserNFT()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
