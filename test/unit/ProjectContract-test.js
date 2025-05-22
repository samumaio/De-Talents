const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect, use } = require("chai")
const { baseFee } = require("../../helper-hardhat-config")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

async function getRewardTokenValue() {
    return await ethers.parseEther("0.000000000000001");
}
async function getBaseFee() {
    return await ethers.parseEther("0.000000000001");
}
async function createProject(projectFactory, days) {
    let initialReward = await ethers.parseEther("0.01");
    const tx = await projectFactory.createProject("testProject", "descrizione", days, initialReward);
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
        const projectAddress = await createProject(projectFactory, 1)
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
        const stakedAmount = BigInt(Number(await userNFTApplicant.getUserReputation(tokenID)) * 0.2);
        await expect(projectContractApplicant.stakeNFT(tokenID, stakedAmount)).not.to.be.reverted;
        //asserts the amount staked is correct
        assert.equal(await projectContractApplicant.getUserReputation(signers[2]), stakedAmount);
        //Asserts the owner of the NFT is now the smart contract 
        assert.equal(await userNFT.ownerOf(tokenID), await projectContract.getAddress());
        //Asserts the original owner of the token is approved to receive its NFT back
        assert.equal(await userNFT.getApproved(tokenID), signers[2].address);
    })
    it("Assert applications reverts after project has expired ", async function () {
        const { projectFactory, userNFT, deployer } = await loadFixture(deployProjectFactory);
        let initialReward = await ethers.parseEther("0.01");
        const signers = await ethers.getSigners();
        const projectAddress = await createProject(projectFactory, 1)
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
        const projectAddress = await createProject(projectFactory, 1)
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
        const stakedAmount = BigInt(Number(await userNFTApplicant.getUserReputation(tokenID)) * 0.2);
        await userNFTApplicant.approveForStaking(tokenID, projectAddress);
        //The responsible stakes its NFT 
        await projectContractApplicant.stakeNFT(tokenID, stakedAmount);
        //increase the time until it is expired
        await network.provider.send("evm_increaseTime", [86401]);
        await network.provider.send("evm_mine");
        await expect(projectContractApplicant.completeMilestone(mileIndex)).to.be.reverted;
    })
    // it("Asserts the proper function of the staking algorithm", async function () {
    //     const { projectFactory, userNFT, deployer } = await loadFixture(deployProjectFactory);
    //     let initialReward = await ethers.parseEther("0.0000001");
    //     let days = 7
    //     const signers = await ethers.getSigners();
    //     const projectAddress = await createProject(projectFactory, days)
    //     const projectContract = await ethers.getContractAt("ProjectContract", projectAddress);
    //     const projectContractApplicant = await projectContract.connect(signers[2])
    //     const userNFTApplicant = await userNFT.connect(signers[2]);
    //     //sets the userNFT Contract Address
    //     await projectContractApplicant.setNFTContractAddress(await userNFT.getAddress())
    //     //The responsible mints a userNFT to stake 
    //     console.log(await getBaseFee());
    //     const nftTX = await userNFT.mintNFT(signers[2], "tokenURI", { value: await getBaseFee() })
    //     const nftReceipt = await nftTX.wait();
    //     const tokenID = await nftReceipt.logs[0].args[0];
    //     //The responsible applies for the project
    //     await projectContractApplicant.sendApplication()
    //     //The responsible can retire his previous application 
    //     await expect(projectContractApplicant.retireApplication()).not.to.be.reverted;
    //     //The owner accepts the application (reverted cause the applicant has retired the application)
    //     await expect(projectContract.approveApplication(signers[2])).to.be.reverted;
    //     //The responsible applies for the project
    //     await projectContractApplicant.sendApplication()
    //     await projectContract.approveApplication(signers[2])
    //     const tx = await projectContract.createMilestone("mile1", 2, signers[2], 20);
    //     const receipt = await tx.wait();
    //     const mileIndex = await receipt.logs[0].args[0];
    //     //asserts it cannot retrieveNFT when total amount staked is zero
    //     await expect(projectContractApplicant.retrieveNFT(tokenID)).to.be.reverted;
    //     await userNFTApplicant.approveForStaking(tokenID, projectAddress);
    //     const stakedAmount = BigInt(Number(await userNFTApplicant.getUserReputation(tokenID)) * 0.01);
    //     console.log("Staked Amount: " + stakedAmount)

    //     const contractRewardRate = await projectContractApplicant.getRewardRate();

    //     await projectContractApplicant.stakeNFT(tokenID, stakedAmount);

    //     const daysInSeconds = days * 86400;

    //     // Calcola come fa Solidity (divisione intera)
    //     const rewardRateWei = initialReward / BigInt(daysInSeconds);

    //     console.log("Reward Rate (Contract)", contractRewardRate.toString());
    //     console.log("Reward Rate (JS)", rewardRateWei.toString());

    //     // Assert con valori allineati
    //     assert.equal(contractRewardRate.toString(), rewardRateWei.toString());

    //     //increases the time of 1.5 days
    //     await network.provider.send("evm_increaseTime", [129600]);
    //     await network.provider.send("evm_mine");

    //     console.log("Amount Before Completing " + await projectContractApplicant.getTotalAmountStaked())
    //     await projectContractApplicant.completeMilestone(mileIndex)
    //     console.log("Amount after " + await projectContractApplicant.getTotalAmountStaked())
    //     console.log("Reward Rate " + await projectContract.getRewardRate());
    //     const contractRewardPerToken = await projectContractApplicant.getRewardPerToken()
    //     const rewardPerToken = Number(rewardRate) / (Number(await projectContractApplicant.getTotalAmountStaked())) * (129600)
    //     console.log(rewardPerToken)
    //     console.log(contractRewardPerToken)


    // })

    describe("ProjectContract Staking Algorithm Tests", function () {
        async function deployFixture() {
            const { deployer } = await getNamedAccounts();
            const projectFactory = await ethers.deployContract("ProjectFactory", [await getRewardTokenValue()]);
            const userNFT = await ethers.deployContract("UserNFT", [await getBaseFee(), await projectFactory.getAddress()]);
            return { projectFactory, userNFT, deployer };
        }

        async function setupProjectWithStaker() {
            const { projectFactory, userNFT, deployer } = await loadFixture(deployFixture);
            const signers = await ethers.getSigners();
            const staker = signers[1];

            // Create project with 7 days duration
            const initialReward = await ethers.parseEther("1.0");
            const projectAddress = await createProject(projectFactory, 7, initialReward);
            const project = await ethers.getContractAt("ProjectContract", projectAddress);

            // Setup staker
            await project.connect(staker).setNFTContractAddress(await userNFT.getAddress());
            const userNFTStaker = await userNFT.connect(staker);

            // Mint NFT for staker
            const mintTx = await userNFTStaker.mintNFT(staker, "tokenURI", { value: await getBaseFee() });
            const mintReceipt = await mintTx.wait();
            const tokenId = mintReceipt.logs[0].args[0];

            // Staker applies for the project

            const stakerProject = await project.connect(staker);
            await stakerProject.sendApplication();
            await project.approveApplication(staker);

            // Creates a milestone and assigns it to the contributor
            await project.createMilestone("mile1", 2, staker, 20);

            // Get reputation from NFT
            const reputation = await userNFTStaker.getUserReputation(tokenId);
            const stakedAmount = reputation / 100n; // Stake 1% of reputation

            return { project, userNFT, userNFTStaker, staker, tokenId, stakedAmount, initialReward };
        }

        it("should correctly calculate initial reward rate", async function () {
            const { project, initialReward } = await loadFixture(setupProjectWithStaker);

            const expectedRewardRate = initialReward / (7n * 86400n);
            const actualRewardRate = await project.getRewardRate();

            assert.equal(actualRewardRate.toString(), expectedRewardRate.toString(),
                "Reward rate calculation incorrect");
        });

        it("should update rewards when staking", async function () {
            const { project, userNFTStaker, staker, tokenId, stakedAmount } = await loadFixture(setupProjectWithStaker);

            // Stake NFT
            await userNFTStaker.approveForStaking(tokenId, await project.getAddress());
            await project.connect(staker).stakeNFT(tokenId, stakedAmount);

            // Check staked amount
            const userReputation = await project.getUserReputation(staker);
            assert.equal(userReputation.toString(), stakedAmount.toString(),
                "Staked amount not recorded correctly");

            // Check total staked
            const totalStaked = await project.getTotalAmountStaked();
            assert.equal(totalStaked.toString(), stakedAmount.toString(),
                "Total staked not updated correctly");
        });

        it("should accumulate rewards over time", async function () {
            const { project, userNFTStaker, staker, tokenId, stakedAmount, initialReward } = await loadFixture(setupProjectWithStaker);

            // Stake NFT
            await userNFTStaker.approveForStaking(tokenId, await project.getAddress());
            const stakeTx = await project.connect(staker).stakeNFT(tokenId, stakedAmount);
            const stakeTime = (await ethers.provider.getBlock(stakeTx.blockNumber)).timestamp;

            // Fast forward 1 day
            await network.provider.send("evm_increaseTime", [86400]);
            await network.provider.send("evm_mine");

            // Calculate expected rewards
            const rewardRate = initialReward / (7n * 86400n);
            const timeElapsed = 86400n;
            const expectedRewardPerToken = (rewardRate * timeElapsed) / stakedAmount;

            const actualRewardPerToken = await project.getRewardPerToken();

            // Allow small rounding difference (Solidity does integer division)
            const difference = expectedRewardPerToken - actualRewardPerToken;
            assert.isAtMost(Number(difference), 1, "Reward per token calculation incorrect");

            // Check user rewards
            const expectedUserRewards = stakedAmount * expectedRewardPerToken;
            const userRewards = await ethers.provider.getBalance(await project.getAddress());
            assert.isAtLeast(Number(userRewards), Number(expectedUserRewards) - 1,
                "User rewards not accumulated correctly");
        });

        it("should correctly update rewards when completing milestones", async function () {
            const { project, userNFTStaker, staker, tokenId, stakedAmount } = await loadFixture(setupProjectWithStaker);

            // Stake NFT
            await userNFTStaker.approveForStaking(tokenId, await project.getAddress());
            await project.connect(staker).stakeNFT(tokenId, stakedAmount);

            // Create milestone
            const milestoneTx = await project.createMilestone("test", 1, staker, 100);
            await milestoneTx.wait();

            // Get initial values
            const initialTotalStaked = await project.getTotalAmountStaked();
            const initialUserReputation = await project.getUserReputation(staker);

            // Complete milestone
            await project.connect(staker).completeMilestone(0);

            // Check updated values
            const newTotalStaked = await project.getTotalAmountStaked();
            const newUserReputation = await project.getUserReputation(staker);

            // Reward token value is 1e-15 (from getRewardTokenValue)
            const expectedIncrease = 100n * (await getRewardTokenValue());
            const actualIncrease = newUserReputation - initialUserReputation;

            assert.equal(actualIncrease.toString(), expectedIncrease.toString(),
                "Milestone reward not added correctly to staked amount");
            assert.equal(newTotalStaked.toString(), (initialTotalStaked + expectedIncrease).toString(),
                "Total staked not updated correctly after milestone");
        });

        it("should allow withdrawing rewards", async function () {
            const { project, userNFTStaker, staker, tokenId, stakedAmount } = await loadFixture(setupProjectWithStaker);

            // Stake NFT
            await userNFTStaker.approveForStaking(tokenId, await project.getAddress());
            await project.connect(staker).stakeNFT(tokenId, stakedAmount);

            // Fast forward 3 days to accumulate rewards
            await network.provider.send("evm_increaseTime", [3 * 86400]);
            await network.provider.send("evm_mine");

            // Get balance before withdrawal
            const initialBalance = await ethers.provider.getBalance(staker);

            // Withdraw rewards
            const withdrawTx = await project.connect(staker).withdrawRewards(tokenId);
            const receipt = await withdrawTx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            // Get balance after withdrawal
            const finalBalance = await ethers.provider.getBalance(staker);

            // Check balance changed (exact amount depends on reward calculation)
            assert.isAbove(Number(finalBalance), Number(initialBalance) - Number(gasUsed),
                "Withdrawal didn't increase user balance");
        });

        it("should apply penalty when retrieving NFT with incomplete milestones", async function () {
            const { project, userNFT, userNFTStaker, staker, tokenId, stakedAmount } = await loadFixture(setupProjectWithStaker);

            // Stake NFT
            await userNFTStaker.approveForStaking(tokenId, await project.getAddress());
            await project.connect(staker).stakeNFT(tokenId, stakedAmount);

            // Create milestone but don't complete it
            const milestoneTx = await project.createMilestone("test", 1, staker, 100);
            await milestoneTx.wait();

            // Get initial reputation
            const initialReputation = await userNFTStaker.getUserReputation(tokenId);

            // Retrieve NFT (should apply penalty)
            await project.connect(staker).retrieveNFT(tokenId);

            // Check reputation was reduced
            const finalReputation = await userNFTStaker.getUserReputation(tokenId);
            const expectedPenalty = (100n * (await getRewardTokenValue())) / 2n;

            assert.equal((initialReputation - finalReputation).toString(), expectedPenalty.toString(),
                "Penalty for incomplete milestones not applied correctly");
        });
    });


})