// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Certificate ERC 721 NFT
/// @author samumaio
/// @notice This smart contract mints a Certificate NFT on behalf of a certain user from the platform. Furthermore this contract should be a Soul bound token so as to not be transfered.

contract CertificateNFT is ERC721 {
    uint256 public tokenCounter;
    address payable private owner;
    mapping(address => institutionStatus) private institutions;
    mapping(uint256 => string) private tokenURIs;
    //modifiers
    /// @notice Only verified istiutitons enabled
    modifier onlyIstitutions() {
        require(
            institutions[msg.sender] != institutionStatus.NOTANINSTITUTION,
            notAnInstitution()
        );
        _;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, ownerOnly());
        _;
    }
    //events
    event mintedCertificateNFT(
        address indexed recipient,
        uint256 indexed tokenId
    );
    event verifiedInstitution(address institution);
    //enum
    enum institutionStatus {
        NOTANINSTITUTION, // default value
        UNVERIFIED,
        VERIFIED
    }
    //errors
    error unverifiedInstitution(address institution);
    error enteredInstitutionDoesNotExist();
    error verifiedInstitutionAlreadyExist(address institution);
    //The searched address is not found on institutions mapping
    error notAnInstitution();
    error ownerOnly();

    constructor() ERC721("CERTICATENFT", "CRT") {
        tokenCounter = 0;
        owner = payable(msg.sender);
    }

    function mintNFT(
        address recipient,
        string memory tokenURI
    ) public onlyIstitutions {
        _mint(recipient, tokenCounter);
        //Sets the tokenURI for the newly minted NFT
        tokenURIs[tokenCounter] = tokenURI;
        emit mintedCertificateNFT(recipient, tokenCounter);
        tokenCounter++;
    }

    function verifyInstitution(address institution) public onlyOwner {
        require(
            institutions[institution] != institutionStatus.NOTANINSTITUTION,
            notAnInstitution()
        );
        institutions[institution] = institutionStatus.VERIFIED;
    }

    function addNewInstitution(address institution) public {
        require(
            !(institutions[institution] == institutionStatus.VERIFIED),
            verifiedInstitutionAlreadyExist(institution)
        );
        institutions[institution] = institutionStatus.UNVERIFIED;
    }

    function getInstitutionStatus(
        address institution
    ) public view returns (institutionStatus) {
        require(
            institutions[institution] != institutionStatus.NOTANINSTITUTION,
            notAnInstitution()
        );
        return (institutions[institution]);
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURIs[tokenId];
    }

    function getCounter() public view returns (uint256) {
        return tokenCounter;
    }
}
