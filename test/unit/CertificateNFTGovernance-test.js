// const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
// const { assert, expect, use } = require("chai")
// const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

// describe("CertificateNFTGovernance Test", async function () {
//     async function deployCertificateGovernanceNFT() {
//         const { deployer } = await getNamedAccounts();
//         certificateNFTGov = await ethers.deployContract("CertificateNFTGovernance", []);
//         console.log("Contract successfully deployed to: " + await certificateNFTGov.getAddress())
//         return { certificateNFTGov, deployer }
//     }
//     it("Reverts if proposed institution is not an institution ", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         //signers[1] is not an institution 
//         const notInstitutionContract = await certificateNFTGov.connect(signers[1])
//         assert.equal(await certificateNFTGov.getInstitutionStatus(signers[1]), 0)
//         await expect(notInstitutionContract.createProposal(30, true)).to.be.reverted;
//     })
//     it("Reverts if the endTime is exceeded ", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         const institution = signers[1];
//         await certificateNFTGov.addNewInstitution(institution, "testInstitution")
//         const institutionContract = await certificateNFTGov.connect(institution)
//         //controlla endTime quando la durata inserita e' in secondi 
//         await expect(institutionContract.createProposal(7776001, false)).to.be.reverted,
//             await expect(institutionContract.createProposal(4000, false)).not.to.be.reverted,
//             //controlla endTime quando la durata inserita e' in giorni 
//             await expect(institutionContract.createProposal(94, true)).to.be.reverted;
//         await expect(institutionContract.createProposal(3, true)).not.to.be.reverted;
//     })
//     it("Creates proposals properly ", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         const institution = signers[1];
//         const institutionContract = await certificateNFTGov.connect(institution)
//         const proposalCounter = await certificateNFTGov.getProposalCounter()
//         await certificateNFTGov.addNewInstitution(institution, "testInstitution")
//         const tx = await institutionContract.createProposal(10, true)
//         const receipt = await tx.wait()
//         //duration is returned in seconds 
//         const duration = await receipt.logs[0].args[1]
//         assert.equal(BigInt(duration / BigInt(86400)), BigInt(10))
//         const institutionAddressFromEvent = await receipt.logs[0].args[0]
//         assert.equal(institutionAddressFromEvent, institution.address)
//         const proposal = await certificateNFTGov.getProposal(proposalCounter);
//         //asserts the proposal is correct 
//         assert.equal(proposal[0], institution.address)
//         assert.equal(proposal[1], 0)
//         assert.equal(proposal[2], 0)
//         assert.equal(proposal[3], BigInt(BigInt((await ethers.provider.getBlock('latest')).timestamp) + BigInt(10 * 86400)))
//         assert.equal(proposal[4], false)
//         // await ethers.provider.getBlock('latest')).timestamp
//     })

//     it("Allows only the verified institutions to vote ", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         const verifiedInstitution = signers[1];
//         const unverifiedInstitution = signers[2];
//         const verifiedInstitutionContract = await certificateNFTGov.connect(verifiedInstitution)
//         const unverifiedInstitutionContract = await certificateNFTGov.connect(unverifiedInstitution)
//         // setting institutions state
//         await certificateNFTGov.addNewInstitution(verifiedInstitution, "verifiedTestInstitution")
//         await certificateNFTGov.addNewInstitution(unverifiedInstitution, "unverifiedTestInstitution")
//         await certificateNFTGov.verifyInstitution(verifiedInstitution);
//         // creating a proposal 
//         const proposalCounter = await certificateNFTGov.getProposalCounter()
//         await unverifiedInstitutionContract.createProposal(10, true);
//         await expect(verifiedInstitutionContract.vote(proposalCounter, true)).not.to.be.reverted;
//         await expect(unverifiedInstitutionContract.vote(proposalCounter, true)).to.be.reverted;
//     })

//     it("reverts if the proposal id is not defined ", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         const verifiedInstitution = signers[1];
//         //this id is not defined 
//         await expect(certificateNFTGov.vote(12, false)).to.be.reverted
//     })

//     it("reverts if an istitution tries to vote twice", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         const verifiedInstitution = signers[1];
//         const unverifiedInstitution = signers[2];
//         const verifiedInstitutionContract = await certificateNFTGov.connect(verifiedInstitution)
//         const unverifiedInstitutionContract = await certificateNFTGov.connect(unverifiedInstitution)
//         // setting institutions state
//         await certificateNFTGov.addNewInstitution(verifiedInstitution, "verifiedTestInstitution")
//         await certificateNFTGov.addNewInstitution(unverifiedInstitution, "unverifiedTestInstitution")
//         await certificateNFTGov.verifyInstitution(verifiedInstitution);
//         const proposalCounter = await certificateNFTGov.getProposalCounter()
//         await unverifiedInstitutionContract.createProposal(10, true);
//         await verifiedInstitutionContract.vote(proposalCounter, true)
//         await expect(verifiedInstitutionContract.vote(proposalCounter, true)).to.be.reverted;
//     })

//     it("Reverts if an institution tries to vote after the proposal ended", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         const verifiedInstitution = signers[1];
//         const verifiedInstitution2 = signers[2];
//         const unverifiedInstitution = signers[3]
//         const unverifiedInstitutionContract = await certificateNFTGov.connect(unverifiedInstitution)
//         const verifiedInstitutionContract = await certificateNFTGov.connect(verifiedInstitution)
//         const verifiedInstitution2Contract = await certificateNFTGov.connect(verifiedInstitution2)
//         // setting institutions state
//         await certificateNFTGov.addNewInstitution(verifiedInstitution, "verifiedTestInstitution")
//         await certificateNFTGov.addNewInstitution(verifiedInstitution2, "verifiedTestInstitution2")
//         await certificateNFTGov.addNewInstitution(unverifiedInstitution, "unverifiedTestInstitution")
//         await certificateNFTGov.verifyInstitution(verifiedInstitution);
//         await certificateNFTGov.verifyInstitution(verifiedInstitution2);
//         const proposalCounter = await certificateNFTGov.getProposalCounter()
//         await unverifiedInstitutionContract.createProposal(300, false);
//         await verifiedInstitutionContract.vote(proposalCounter, true)
//         //increment the time by one hour
//         await network.provider.send("evm_increaseTime", [3600])
//         //mine an extra block
//         await network.provider.send("evm_mine", [])
//         await expect(verifiedInstitution2Contract.vote(proposalCounter, false)).to.be.reverted
//     })

//     it("the proposal must be ended before execution", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         const verifiedInstitution = signers[1];
//         const unverifiedInstitution = signers[2];
//         const unverifiedInstitutionContract = await certificateNFTGov.connect(unverifiedInstitution)
//         const verifiedInstitutionContract = await certificateNFTGov.connect(verifiedInstitution)
//         const verifiedInstitutionContract2 = await certificateNFTGov.connect(signers[3])
//         const verifiedInstitutionContract3 = await certificateNFTGov.connect(signers[4])
//         const verifiedInstitutionContract4 = await certificateNFTGov.connect(signers[5])
//         // setting institutions state
//         await certificateNFTGov.addNewInstitution(verifiedInstitution, "verifiedTestInstitution")
//         await certificateNFTGov.addNewInstitution(unverifiedInstitution, "unverifiedTestInstitution")
//         await certificateNFTGov.addNewInstitution(signers[3], "signer3")
//         await certificateNFTGov.addNewInstitution(signers[4], "signer4")
//         await certificateNFTGov.addNewInstitution(signers[5], "signer5")
//         // veryfing institutions
//         await certificateNFTGov.verifyInstitution(verifiedInstitution);
//         await certificateNFTGov.verifyInstitution(signers[3]);
//         await certificateNFTGov.verifyInstitution(signers[4]);
//         await certificateNFTGov.verifyInstitution(signers[5]);
//         // creating a proposal 
//         const proposalCounter = await certificateNFTGov.getProposalCounter()
//         await unverifiedInstitutionContract.createProposal(1800, false);
//         await expect(verifiedInstitutionContract.vote(proposalCounter, true)).not.to.be.reverted;
//         await verifiedInstitutionContract2.vote(proposalCounter, true)
//         await verifiedInstitutionContract3.vote(proposalCounter, false)
//         await verifiedInstitutionContract4.vote(proposalCounter, true)
//         // only the owner can execute the proposal
//         await expect(verifiedInstitutionContract2.executeProposal(proposalCounter)).to.be.revertedWith("ownerOnly");
//         // the proposal cannot be executed until time has expired
//         await expect(certificateNFTGov.executeProposal(proposalCounter)).to.be.revertedWithCustomError(certificateNFTGov, "proposalNotEnded")
//         //increment the time by one hour, endTime expires
//         await network.provider.send("evm_increaseTime", [3600])
//         //mine an extra block
//         await network.provider.send("evm_mine", [])
//         await expect(certificateNFTGov.executeProposal(proposalCounter)).not.to.be.reverted;
//     })

//     it("The proposal must be executed properly", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         const verifiedInstitution = signers[1];
//         const unverifiedInstitution = signers[2];
//         const unverifiedInstitutionContract = await certificateNFTGov.connect(unverifiedInstitution)
//         const verifiedInstitutionContract = await certificateNFTGov.connect(verifiedInstitution)
//         const verifiedInstitutionContract2 = await certificateNFTGov.connect(signers[3])
//         const verifiedInstitutionContract3 = await certificateNFTGov.connect(signers[4])
//         const verifiedInstitutionContract4 = await certificateNFTGov.connect(signers[5])
//         // setting institutions state
//         await certificateNFTGov.addNewInstitution(verifiedInstitution, "verifiedTestInstitution")
//         await certificateNFTGov.addNewInstitution(unverifiedInstitution, "unverifiedTestInstitution")
//         await certificateNFTGov.addNewInstitution(signers[3], "signer3")
//         await certificateNFTGov.addNewInstitution(signers[4], "signer4")
//         await certificateNFTGov.addNewInstitution(signers[5], "signer5")
//         // veryfing institutions
//         await certificateNFTGov.verifyInstitution(verifiedInstitution);
//         await certificateNFTGov.verifyInstitution(signers[3]);
//         await certificateNFTGov.verifyInstitution(signers[4]);
//         await certificateNFTGov.verifyInstitution(signers[5]);
//         // creating a proposal 
//         const proposalCounter = await certificateNFTGov.getProposalCounter()
//         await unverifiedInstitutionContract.createProposal(1800, false);
//         await expect(verifiedInstitutionContract.vote(proposalCounter, true)).not.to.be.reverted;
//         await verifiedInstitutionContract2.vote(proposalCounter, true)
//         await verifiedInstitutionContract3.vote(proposalCounter, false)
//         await verifiedInstitutionContract4.vote(proposalCounter, true)
//         //increment the time by one hour, endTime expires
//         await network.provider.send("evm_increaseTime", [3600])
//         //mine an extra block
//         await network.provider.send("evm_mine", [])
//         const tx = await certificateNFTGov.executeProposal(proposalCounter);
//         const receipt = await tx.wait()
//         const newVerifiedInstitution = await receipt.logs[1].args[0];
//         const approved = await receipt.logs[1].args[1]
//         //checks the indexed params in the logs
//         assert.equal(newVerifiedInstitution, unverifiedInstitution.address)
//         assert.equal(approved, true)
//         //checks the proposal 
//         const proposal = await certificateNFTGov.getProposal(proposalCounter)
//         assert.equal(proposal[0], unverifiedInstitution.address)
//         assert.equal(proposal[1], BigInt(3))
//         assert.equal(proposal[2], BigInt(1))
//         assert.equal(proposal[4], true)
//         // asserts the institution is now verified 
//         assert.equal(await certificateNFTGov.getInstitutionStatus(unverifiedInstitution), 2)
//         // reverts if the owner tries to execute the proposal again 
//         await expect(certificateNFTGov.executeProposal(proposalCounter)).to.be.revertedWithCustomError(certificateNFTGov, "proposalAlreadyExecuted")
//     })

//     it("Reverts if a rejected institution tries to be voted again", async function () {
//         const { certificateNFTGov, deployer } = await loadFixture(deployCertificateGovernanceNFT);
//         const signers = await ethers.getSigners();
//         const verifiedInstitution = signers[1];
//         const unverifiedInstitution = signers[2];
//         const unverifiedInstitutionContract = await certificateNFTGov.connect(unverifiedInstitution)
//         const verifiedInstitutionContract = await certificateNFTGov.connect(verifiedInstitution)
//         const verifiedInstitutionContract2 = await certificateNFTGov.connect(signers[3])
//         const verifiedInstitutionContract3 = await certificateNFTGov.connect(signers[4])
//         const verifiedInstitutionContract4 = await certificateNFTGov.connect(signers[5])
//         // setting institutions state
//         await certificateNFTGov.addNewInstitution(verifiedInstitution, "verifiedTestInstitution")
//         await certificateNFTGov.addNewInstitution(unverifiedInstitution, "unverifiedTestInstitution")
//         await certificateNFTGov.addNewInstitution(signers[3], "signer3")
//         await certificateNFTGov.addNewInstitution(signers[4], "signer4")
//         await certificateNFTGov.addNewInstitution(signers[5], "signer5")
//         // veryfing institutions
//         await certificateNFTGov.verifyInstitution(verifiedInstitution);
//         await certificateNFTGov.verifyInstitution(signers[3]);
//         await certificateNFTGov.verifyInstitution(signers[4]);
//         await certificateNFTGov.verifyInstitution(signers[5]);
//         // creating a proposal 
//         const proposalCounter = await certificateNFTGov.getProposalCounter()
//         await unverifiedInstitutionContract.createProposal(1800, false);
//         await expect(verifiedInstitutionContract.vote(proposalCounter, false)).not.to.be.reverted;
//         await verifiedInstitutionContract2.vote(proposalCounter, false)
//         await verifiedInstitutionContract3.vote(proposalCounter, false)
//         await verifiedInstitutionContract4.vote(proposalCounter, true)
//         //increment the time by one hour, endTime expires
//         await network.provider.send("evm_increaseTime", [3600])
//         //mine an extra block
//         await network.provider.send("evm_mine", [])
//         const tx = await certificateNFTGov.executeProposal(proposalCounter);
//         const receipt = await tx.wait()
//         const approved = await receipt.logs[0].args[1]
//         //checks the indexed params in the logs
//         assert.equal(approved, false)
//         //checks the proposal 
//         const proposal = await certificateNFTGov.getProposal(proposalCounter)
//         assert.equal(proposal[0], unverifiedInstitution.address)
//         assert.equal(proposal[1], BigInt(1))
//         assert.equal(proposal[2], BigInt(3))
//         assert.equal(proposal[4], true)
//         // asserts the institution is still unverified
//         assert.equal(await certificateNFTGov.getInstitutionStatus(unverifiedInstitution), 1)
//         // asserts the rejected duration time is correct 
//         assert.equal(await certificateNFTGov.getDaysLeft(unverifiedInstitution), BigInt(BigInt(await certificateNFTGov.getRejectDuration()) / BigInt(86400)));
//         // expects the rejected institution not to be voted again 
//         await expect(unverifiedInstitutionContract.createProposal(10, true)).to.be.revertedWithCustomError(unverifiedInstitutionContract, "rejectedInstitution")
//     })
// })