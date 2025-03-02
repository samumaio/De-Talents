const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect, use } = require("chai")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

const baseFee = 40000 //40000 Wei
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
        const owner = await userNFT.ownerOf(tokenID)
        assert.equal(owner, deployer)
        const uri = await userNFT.getTokenURI(tokenID)
        assert.equal(uri, setTokenURI)
    })
    it("Only allows the owner to withdraw funds ", async function () {
        const { userNFT, deployer } = await loadFixture(deployUserNFT)
        const signers = await ethers.getSigners();
        const notOwner = signers[1];
        // Connects the contract to a notOwner user
        const userNFTWithNotOwner = await userNFT.connect(notOwner)
        await expect(userNFTWithNotOwner.withdraw()).to.be.reverted;
    })

    it("owner can withdraw funds properly ", async function () {
        const { userNFT, deployer } = await loadFixture(deployUserNFT)
        const signers = await ethers.getSigners();
        const notOwner = signers[1];

        // Other user mint a NFT and pays a fee
        const userNFTWithNotOwner = await userNFT.connect(notOwner)
        const fee = await ethers.parseEther("0.1");
        await userNFTWithNotOwner.mintNFT(notOwner, "URI", { value: fee });

        let ownerInitialBalance = await ethers.provider.getBalance(deployer)
        //This function will cost some gas, hence eth earned by the owner will be less than 0.1 ETH
        await userNFT.withdraw();
        let ownerFinalBalance = await ethers.provider.getBalance(deployer)
        assert.isAbove(ownerFinalBalance - ownerInitialBalance, 0)
    })
})