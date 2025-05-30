const { network, ethers } = require("hardhat")
const { baseFee, networkConfig } = require("../helper-hardhat-config")
const { fs } = require("fs")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const factoryAddress = "0x3980A6b23011CDa21B0B1e801a991C97023ea95f";
    const args = [baseFee, factoryAddress]
    const userNFT = await deploy("UserNFT", {
        from: deployer,
        args: args,
        log: true,
        blockConfirmations: 1
    })
}