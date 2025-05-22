const { network, ethers } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")
const { fs } = require("fs")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const certificateNFTGovernance = await deploy("ProjectFactory", {
        from: deployer,
        args: [20000],
        log: true,
    })
}