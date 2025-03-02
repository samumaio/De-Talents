// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Certificate ERC 721 NFT
/// @author samumaio
/// @notice This smart contract mints a Certificate NFT on behalf of a certain user from the platform. Furthermore this contract should be a Soul bound token so as to not be transfered.

contract CerticateNFT is ERC721 {
    uint256 public tokenCounter;
    address payable private owner;
    mapping(address => bool) private institutions;
    mapping(uint256 => string) private tokenURIs;
    //modifiers
    /// @notice Only verified istiutitons enabled
    modifier onlyIstitutions() {
        require(institutions[msg.sender], notAnInstitution());
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

    //errors
    error unverifiedInstitution(address institution);
    error verifiedInstitutionAlreadyExist(address institution);
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
        institutions[institution] = true;
    }

    function addNewInstitution(address institution) public {
        require(
            !institutions[institution],
            verifiedInstitutionAlreadyExist(institution)
        );
        institutions[institution] = false;
    }

    function isCertified(address institution) public view returns (bool) {
        return institutions[institution];
    }

    function getCounter() public view returns (uint256) {
        return tokenCounter;
    }
}
