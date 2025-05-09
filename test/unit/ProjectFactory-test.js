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
    const tx = await projectFactory.createProject("testProject", "descrizione", 30, initialReward);
    const receipt = await tx.wait();
    const projectAddress = await receipt.logs[0].args[0];
    return projectAddress;
}

describe("Project Factory Unit Tests", async function () {
    async function deployProjectFactory() {
        const { deployer } = await getNamedAccounts();
        projectFactory = await ethers.deployContract("ProjectFactory", [await getRewardTokenValue()]);
        console.log("Contract successfully deployed to: " + await projectFactory.getAddress())
        return { projectFactory, deployer }
    }
    async function deployUserNFT(factoryAddress) {
        const { deployer } = await getNamedAccounts();
        userNFT = await ethers.deployContract("userNFT", [await getBaseFee(), factoryAddress]);
        console.log("Contract userNFT successully deployed to: " + await userNFT.getAddress())
        return { userNFT, deployer }
    }
    it("Asserts it creates a project properly", async function () {
        const { projectFactory, deployer } = await loadFixture(deployProjectFactory);
        let initialReward = await ethers.parseEther("0.01");
        const projectAddress = await createProject(projectFactory)
        const projectContract = await ethers.getContractAt("ProjectContract", projectAddress);
        const result = await projectContract.getProjectInfo()
        assert.equal(result[0], "testProject")
        assert.equal(result[2], initialReward)
        assert.equal(result[4], deployer)
        //controllo della deadline 
        assert.equal(result[3], BigInt(BigInt((await ethers.provider.getBlock('latest')).timestamp) + BigInt(30 * 86400)))
        //assers the address in now added on the mapping
        assert.equal(true, await projectFactory.isProjectAddress(projectAddress))
    })
    it("Asserts the owner can fetch his projects", async function () {
        const { projectFactory, deployer } = await loadFixture(deployProjectFactory);
        let initialReward = await ethers.parseEther("0.01");
        const tx = await projectFactory.createProject("testProject1", "descrizione", 30, initialReward);
        const receipt = await tx.wait();
        const projectAddress1 = await receipt.logs[0].args[0];
        const tx2 = await projectFactory.createProject("testProject2", "descrizione", 30, initialReward);
        const receipt2 = await tx2.wait();
        const projectAddress2 = await receipt2.logs[0].args[0];
        const result = await projectFactory.getOwnerProjects(deployer)
        assert.equal(result[0], projectAddress1)
        assert.equal(result[1], projectAddress2)
    })
    it("Mints Reward Tokens properly", async function () {
        const { projectFactory, deployer } = await loadFixture(deployProjectFactory);
        userNFT = await ethers.deployContract("UserNFT", [await getBaseFee(), await projectFactory.getAddress()]);
        const signers = await ethers.getSigners();
        const userNFTApplicant = await userNFT.connect(signers[2]);
        const projectAddress = await createProject(projectFactory)
        const projectContract = await ethers.getContractAt("ProjectContract", projectAddress)
        const projectContractApplicant = await projectContract.connect(signers[2]);
        await projectContractApplicant.setNFTContractAddress(await userNFT.getAddress())
        //The responsible mints a userNFT to stake 
        const nftTX = await userNFT.mintNFT(signers[2], "tokenURI", { value: await ethers.parseEther("0.0000000001") })
        const nftReceipt = await nftTX.wait();
        const tokenID = await nftReceipt.logs[0].args[0];
        //The responsible applies for the project
        await projectContractApplicant.sendApplication()
        //The owner accepts the application
        await projectContract.approveApplication(signers[2]);
        //The owner creates a milestone 
        const tx = await projectContract.createMilestone("mile1", 2, signers[2], 20);
        const receipt = await tx.wait();
        const mileIndex = await receipt.logs[0].args[0];
        //The responsible approves his nft to be staked 
        await userNFTApplicant.approveForStaking(tokenID, projectAddress);
        //The responsible stakes its NFT 
        await projectContractApplicant.stakeNFT(tokenID)
        //The responsible completes the milestone
        await projectContractApplicant.completeMilestone(mileIndex);
        //asserts the RWTs are now owned by the responsible
        assert.equal(await projectFactory.balanceOf(signers[2]), 20)
    })

})