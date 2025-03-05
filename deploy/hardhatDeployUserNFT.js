const { network, ethers } = require("hardhat")
const { baseFee, networkConfig } = require("../helper-hardhat-config")
const { fs } = require("fs")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [baseFee]
    const userNFT = await deploy("UserNFT", {
        from: deployer,
        args: args,
        log: true,
        blockConfirmations: 1
    })
}