const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect, use } = require("chai")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

describe("Certificate NFTs Unit Tests", async function () {
    async function deployCertificateNFT() {
        const { deployer } = await getNamedAccounts();
        certificateNFT = await ethers.deployContract("CertificateNFT", []);
        console.log("Contract successfully deployed to: " + await certificateNFT.getAddress())
        return { certificateNFT, deployer }
    }

    it("Adds new institutions properly ", async function () {
        const { certificateNFT, } = await loadFixture(deployCertificateNFT);
        const signers = await ethers.getSigners();
        const institution = signers[1];
        await certificateNFT.addNewInstitution(institution)
        //asserts the institution exists
        expect(await certificateNFT.getInstitutionStatus(institution.getAddress())).not.to.be.reverted;
        //Asserts the institution is added as unverified
        assert.equal(await certificateNFT.getInstitutionStatus(institution.getAddress()), 1);
    })
    it("Verifies institutions properly ", async function () {
        const { certificateNFT, deployer } = await loadFixture(deployCertificateNFT);
        const signers = await ethers.getSigners();
        const institution = signers[1];
        const notOwner = signers[1];
        const certificateNFTWithNotOwner = await certificateNFT.connect(notOwner)

        await certificateNFT.addNewInstitution(institution)
        //asserts the institution exists
        await expect(await certificateNFT.verifyInstitution(institution)).not.to.be.reverted;
        //Asserts only that only the owner can verify insitution
        await expect(certificateNFTWithNotOwner.verifyInstitution(institution)).to.be.reverted;
        //Verifies the institution 
        assert.equal(await certificateNFT.getInstitutionStatus(institution), 2);
    })
    it("Stores the owner of NFT properly", async function () {
        const { certificateNFT, deployer } = await loadFixture(deployCertificateNFT);
        const setTokenURI = "default";
        const signers = await ethers.getSigners();
        const institution = signers[1];
        await certificateNFT.addNewInstitution(institution);
        const notOwner = signers[7];
        const certificateNFTWithNotOwner = await certificateNFT.connect(notOwner)
        //Connects the contract to a notOwner user
        const insitutionCertificateNFT = certificateNFT.connect(institution)
        //Asserts only institutions can mint Certificate NFT's
        await expect(certificateNFTWithNotOwner.mintNFT(deployer, setTokenURI)).to.be.reverted;

        const tx = await insitutionCertificateNFT.mintNFT(deployer, setTokenURI)
        const receipt = await tx.wait()
        const tokenID = await receipt.logs[0].args[2]
        const owner = await certificateNFT.ownerOf(tokenID)
        assert.equal(owner, deployer)
        const uri = await certificateNFT.getTokenURI(tokenID)
        assert.equal(uri, setTokenURI)
    })
})