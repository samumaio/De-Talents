const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("ProjectContract Staking Algorithm", function () {
    let owner, user1, user2;
    let ProjectContract, UserNFT;
    let project, userNft;
    const DAY_IN_SECONDS = 86400;
    const INITIAL_REWARD = ethers.parseEther("10"); // 10 ETH
    const PROJECT_DURATION = 7; // 7 giorni

    before(async () => {
        [owner, user1, user2] = await ethers.getSigners();

        UserNFT = await ethers.getContractFactory("UserNFT");
        userNft = await UserNFT.deploy();

        ProjectContract = await ethers.getContractFactory("ProjectContract");
    });

    beforeEach(async () => {
        project = await ProjectContract.deploy(
            "Test Project",
            "Test Description",
            PROJECT_DURATION,
            INITIAL_REWARD,
            owner.address,
            ethers.parseEther("1"), // 1 ETH = 1 RWT
            owner.address // Factory address mock
        );
        await project.setNFTContractAddress(userNft.target);
    });
});

describe("Basic Staking Operations", function () {
    it("should stake NFT correctly", async function () {
        // Mint un NFT a user1
        await userNft.connect(user1).mint("User1 NFT");
        const tokenId = 0;

        // Approva e fai stake
        await userNft.connect(user1).approve(project.target, tokenId);
        await project.connect(user1).stakeNFT(tokenId, ethers.parseEther("100"));

        // Verifica
        expect(await userNft.ownerOf(tokenId)).to.equal(project.target);
        expect(await project.getUserReputation(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("should fail if staking without being a contributor", async function () {
        await userNft.connect(user1).mint("User1 NFT");
        await expect(
            project.connect(user1).stakeNFT(0, ethers.parseEther("100"))
        ).to.be.revertedWithCustomError(project, "notAContributor");
    });
});

describe("Reward Calculation", function () {
    beforeEach(async () => {
        // Setup: user1 diventa contributor e fa stake
        await project.connect(owner).approveApplication(user1.address);
        await userNft.connect(user1).mint("User1 NFT");
        await userNft.connect(user1).approve(project.target, 0);
        await project.connect(user1).stakeNFT(0, ethers.parseEther("100"));
    });

    it("should calculate rewards correctly after time passes", async function () {
        const initialRewardPerToken = await project.getRewardPerToken();

        // Avanza il tempo di 1 giorno
        await network.provider.send("evm_increaseTime", [DAY_IN_SECONDS]);
        await network.provider.send("evm_mine");

        const newRewardPerToken = await project.getRewardPerToken();
        expect(newRewardPerToken).to.be.gt(initialRewardPerToken);

        // Calcolo manuale atteso
        const expectedRate = INITIAL_REWARD / BigInt(PROJECT_DURATION * DAY_IN_SECONDS);
        const expectedIncrease = expectedRate * BigInt(DAY_IN_SECONDS) / ethers.parseEther("100");

        expect(newRewardPerToken - initialRewardPerToken).to.be.closeTo(
            expectedIncrease,
            expectedIncrease / 100n // 1% tolerance
        );
    });
});

describe("Unstaking and Penalties", function () {
    beforeEach(async () => {
        // Setup: user1 con NFT staked e milestone assegnata
        await project.connect(owner).approveApplication(user1.address);
        await userNft.connect(user1).mint("User1 NFT");
        await userNft.connect(user1).approve(project.target, 0);
        await project.connect(user1).stakeNFT(0, ethers.parseEther("100"));

        await project.connect(owner).createMilestone(
            "Test Milestone",
            1, // 1 giorno
            user1.address,
            ethers.parseEther("10") // 10 RWT reward
        );
    });

    it("should apply penalty for incomplete milestone", async function () {
        const initialBalance = await userNft.getUserReputation(0);

        // Tentativo di unstake prima del completamento
        await project.connect(user1).retrieveNFT(0);

        const finalBalance = await userNft.getUserReputation(0);
        // Penalità attesa: 50% del reward (10 RWT * 1 ETH/RWT / 2)
        const expectedPenalty = ethers.parseEther("5");
        expect(initialBalance - finalBalance).to.equal(expectedPenalty);
    });

    it("should not apply penalty if milestone completed", async function () {
        // Completa la milestone
        await network.provider.send("evm_increaseTime", [DAY_IN_SECONDS]);
        await project.connect(user1).completeMilestone(0);

        const initialBalance = await userNft.getUserReputation(0);
        await project.connect(user1).retrieveNFT(0);
        const finalBalance = await userNft.getUserReputation(0);

        expect(finalBalance).to.equal(initialBalance + ethers.parseEther("10")); // Reward aggiunto
    });
});


describe("Milestone Completion", function () {
    it("should mint RWT tokens when completing milestone", async function () {
        // Setup
        await project.connect(owner).approveApplication(user1.address);
        await userNft.connect(user1).mint("User1 NFT");
        await userNft.connect(user1).approve(project.target, 0);
        await project.connect(user1).stakeNFT(0, ethers.parseEther("100"));

        await project.connect(owner).createMilestone(
            "Test Milestone",
            1,
            user1.address,
            ethers.parseEther("5") // 5 RWT
        );

        // Mock del factory contract per verificare la mint
        const factoryMock = await ethers.getContractAt("ProjectFactory", owner.address);
        await factoryMock.mintToken.returns();

        // Completa la milestone
        await network.provider.send("evm_increaseTime", [DAY_IN_SECONDS]);
        await expect(project.connect(user1).completeMilestone(0))
            .to.emit(project, "milestoneCompleted")
            .withArgs(0);

        // Verifica che il factory abbia ricevuto la chiamata
        expect(factoryMock.mintToken).to.have.been.calledWith(
            user1.address,
            ethers.parseEther("5")
        );
    });
});

describe("Edge Cases", function () {
    it("should handle zero staking correctly", async function () {
        await expect(
            project.connect(owner).updateStaking(0, 0)
        ).to.be.revertedWithCustomError(project, "totalStakedReputationIsZero");
    });

    it("should prevent double staking", async function () {
        await project.connect(owner).approveApplication(user1.address);
        await userNft.connect(user1).mint("User1 NFT");
        await userNft.connect(user1).approve(project.target, 0);

        await project.connect(user1).stakeNFT(0, ethers.parseEther("100"));
        await expect(
            project.connect(user1).stakeNFT(0, ethers.parseEther("50"))
        ).to.be.revertedWithCustomError(project, "nftNotStaked");
    });

    it("should reject invalid milestone completion", async function () {
        await expect(
            project.connect(user1).completeMilestone(999)
        ).to.be.revertedWithCustomError(project, "invalidMilestoneIndex");
    });
});