// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Certificate ERC 721 NFT
/// @author samumaio
/// @notice This smart contract mints a Certificate NFT on behalf of a certain user from the platform. Furthermore this contract should be a Soul bound token so as to not be transfered.

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CertificateNFT is ERC721 {
    uint256 public tokenCounter;
    address payable private owner;
    mapping(address => institutionStatus) private institutions;
    mapping(address => string) private institutionNames; // Mappatura per i nomi delle istituzioni
    mapping(uint256 => string) private tokenURIs;
    address[] private institutionAddresses;

    modifier onlyIstitutions() {
        require(
            institutions[msg.sender] != institutionStatus.NOTANINSTITUTION,
            "notAnInstitution"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "ownerOnly");
        _;
    }

    event mintedCertificateNFT(
        address indexed recipient,
        uint256 indexed tokenId
    );

    event verifiedInstitution(address institution);

    enum institutionStatus {
        NOTANINSTITUTION,
        UNVERIFIED,
        VERIFIED
    }
    //errors
    error unverifiedInstitution(address institution);
    error enteredInstitutionDoesNotExist();
    error verifiedInstitution();
    error InstitutionAlreadyExist(address institution);
    //The searched address is not found on institutions mapping
    error notAnInstitution();
    error soulBoundToken();
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
        tokenURIs[tokenCounter] = tokenURI;
        emit mintedCertificateNFT(recipient, tokenCounter);
        tokenCounter++;
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override {
        require(false, "soulBoundToken");
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        require(false, "soulBoundToken");
    }

    function _safeTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal virtual override {
        require(false, "soulBoundToken");
    }

    function verifyInstitution(address institution) public onlyOwner {
        require(
            institutions[institution] != institutionStatus.NOTANINSTITUTION,
            "notAnInstitution"
        );
        institutions[institution] = institutionStatus.VERIFIED;
        emit verifiedInstitution(institution);
    }

    function addNewInstitution(address institution, string memory name) public {
        require(
            !(institutions[institution] == institutionStatus.VERIFIED),
            verifiedInstitutionAlreadyExist(institution)
        );
        if (institutions[institution] == institutionStatus.NOTANINSTITUTION) {
            institutionAddresses.push(institution);
        }
        institutions[institution] = institutionStatus.UNVERIFIED;
        institutionNames[institution] = name; // Salva il nome dell'istituzione
    }

    function getInstitutionStatus(
        address institution
    ) public view returns (institutionStatus) {
        if (institutions[institution] == institutionStatus.NOTANINSTITUTION) {
            return institutionStatus.NOTANINSTITUTION;
        }
        return institutions[institution];
    }

    function getInstitutionName(
        address institution
    ) public view returns (string memory) {
        return institutionNames[institution];
    }

    function getAllInstitutions() public view returns (address[] memory) {
        return institutionAddresses;
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURIs[tokenId];
    }

    function getCounter() public view returns (uint256) {
        return tokenCounter;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}
