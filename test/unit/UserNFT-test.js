const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect, use } = require("chai")
const { baseFee } = require("../../helper-hardhat-config")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

describe("User NFTs Unit Tests", async function () {
    async function deployUserNFT() {
        const { deployer } = await getNamedAccounts();
        userNFT = await ethers.deployContract("UserNFT", [baseFee]);
        console.log("Contract successfully deployed to: " + await userNFT.getAddress())
        return { userNFT, deployer }
    }
    it("Reverts if enough eth are not provided ", async function () {
        const { userNFT, deployer } = await loadFixture(deployUserNFT);
        const tokenURI = "default"
        await expect(userNFT.mintNFT(deployer, tokenURI, { value: 10 })).to.be.reverted;
    })
    it("Sets the base fee properly", async function () {
        const { userNFT, deployer } = await loadFixture(deployUserNFT);
        const base = await userNFT.getBaseFee();
        assert.equal(base, baseFee)
    })
    it("Stores the owner of NFT properly", async function () {
        const { userNFT, deployer } = await loadFixture(deployUserNFT);
        const setTokenURI = "default"
        const fee = await ethers.parseEther("0.1");
        const tx = await userNFT.mintNFT(deployer, setTokenURI, { value: fee })
        const receipt = await tx.wait()
        const tokenID = await receipt.logs[0].args[2]
        assert.equal(fee, userNFT.getUserReputation(tokenID));
        const owner = await userNFT.ownerOf(tokenID)
        assert.equal(owner, deployer)
        const uri = await userNFT.getTokenURI(tokenID)
        assert.equal(uri, setTokenURI)
    })
})