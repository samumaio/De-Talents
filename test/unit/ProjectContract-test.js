const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect, use } = require("chai")
const { baseFee } = require("../../helper-hardhat-config")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

async function getRewardTokenValue() {
    return await ethers.parseEther("0.00000001");
}
async function getBaseFee() {
    return await ethers.parseEther("0.00000000001");
}
async function createProject(projectFactory) {
    let initialReward = await ethers.parseEther("0.01");
    const tx = await projectFactory.createProject("testProject", "descrizione", 1, initialReward);
    const receipt = await tx.wait();
    const projectAddress = await receipt.logs[0].args[0];
    return projectAddress;
}

describe("ProjectContract's Unit Tests", async function () {
    async function deployProjectFactory() {
        const { deployer } = await getNamedAccounts();
        projectFactory = await ethers.deployContract("ProjectFactory", [await getRewardTokenValue()]);
        userNFT = await ethers.deployContract("UserNFT", [await getBaseFee(), await projectFactory.getAddress()]);
        console.log("Contract successfully deployed to: " + await projectFactory.getAddress())
        console.log("Contract successfully deployed to: " + await userNFT.getAddress())
        return { projectFactory, userNFT, deployer }
    }
    it("Asserts milestone and applications are stored properly", async function () {
        const { projectFactory, userNFT, deployer } = await loadFixture(deployProjectFactory);
        let initialReward = await ethers.parseEther("0.01");
        const signers = await ethers.getSigners();
        const projectAddress = await createProject(projectFactory)
        const projectContract = await ethers.getContractAt("ProjectContract", projectAddress);
        const projectContractApplicant = await projectContract.connect(signers[2])
        const userNFTApplicant = await userNFT.connect(signers[2]);
        //sets the userNFT Contract Address
        await projectContractApplicant.setNFTContractAddress(await userNFT.getAddress())
        //The responsible mints a userNFT to stake 
        const nftTX = await userNFT.mintNFT(signers[2], "tokenURI", { value: await ethers.parseEther("0.0000000001") })
        const nftReceipt = await nftTX.wait();
        const tokenID = await nftReceipt.logs[0].args[0];
        //The responsible applies for the project
        await projectContractApplicant.sendApplication()
        //The responsible can retire his previous application 
        await expect(projectContractApplicant.retireApplication()).not.to.be.reverted;
        //The owner accepts the application (reverted cause the applicant has retired the application)
        await expect(projectContract.approveApplication(signers[2])).to.be.reverted;
        //The responsible applies for the project
        await projectContractApplicant.sendApplication()
        await projectContract.approveApplication(signers[2])
        //The owner creates a milestone 
        const tx = await projectContract.createMilestone("mile1", 2, signers[2], 20);
        const receipt = await tx.wait();
        const mileIndex = await receipt.logs[0].args[0];
        //The responsible approves his nft to be staked 
        await userNFTApplicant.approveForStaking(tokenID, projectAddress);
        //The responsible stakes its NFT 
        await expect(projectContractApplicant.stakeNFT(tokenID)).not.to.be.reverted;

    })
    it("Assert applications reverts after project has expired ", async function () {
        const { projectFactory, userNFT, deployer } = await loadFixture(deployProjectFactory);
        let initialReward = await ethers.parseEther("0.01");
        const signers = await ethers.getSigners();
        const projectAddress = await createProject(projectFactory)
        const projectContract = await ethers.getContractAt("ProjectContract", projectAddress);
        const projectContractApplicant = await projectContract.connect(signers[2])
        //increase the time until it is expired
        await network.provider.send("evm_increaseTime", [86401]);
        await network.provider.send("evm_mine");
        //The responsible applies for the project after the project has expired 
        await expect(projectContractApplicant.sendApplication()).to.be.reverted;
    })
    it("Asserts milestone reverts after project has expired", async function () {
        const { projectFactory, userNFT, deployer } = await loadFixture(deployProjectFactory);
        const signers = await ethers.getSigners();
        const userNFTApplicant = await userNFT.connect(signers[2]);
        const nftTX = await userNFT.mintNFT(signers[2], "tokenURI", { value: await ethers.parseEther("0.0000000001") })
        const nftReceipt = await nftTX.wait();
        const tokenID = await nftReceipt.logs[0].args[0];
        const projectAddress = await createProject(projectFactory)
        const projectContract = await ethers.getContractAt("ProjectContract", projectAddress);
        await projectContract.setNFTContractAddress(await userNFT.getAddress());
        const projectContractApplicant = await projectContract.connect(signers[2])
        //The applicant applies and is accepted
        await projectContractApplicant.sendApplication()
        await projectContract.approveApplication(signers[2])
        //The owner creates a milestone 
        const tx = await projectContract.createMilestone("mile1", 2, signers[2], 20);
        const receipt = await tx.wait();
        const mileIndex = await receipt.logs[0].args[0];
        //The applicant stakes and is assigned a milestone
        await userNFTApplicant.approveForStaking(tokenID, projectAddress);
        //The responsible stakes its NFT 
        await projectContractApplicant.stakeNFT(tokenID);
        //increase the time until it is expired
        await network.provider.send("evm_increaseTime", [86401]);
        await network.provider.send("evm_mine");
        await expect(projectContractApplicant.completeMilestone(mileIndex)).to.be.reverted;
    })


})