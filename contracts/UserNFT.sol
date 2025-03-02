// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title User's ERC 721 NFT
/// @author samumaio
/// @notice This smart contract mints a personal NFT on behalf of the sender of this contract. Furthermore this contract should be a Soul bound token so as to not be transfered

contract UserNFT is ERC721 {
    uint256 public tokenCounter;
    uint256 public baseFee;
    address payable private owner;
    mapping(uint256 => string) private tokenURIs;
    //modifiers
    /// @notice Only verified istiutitons enabled
    // modifier onlyIstitutions() {
    //     require(institutions[msg.sender], notAnInstitution());
    //     _;
    // }
    modifier onlyOwner() {
        require(msg.sender == owner, notAllowed());
        _;
    }
    //events
    event mintedUserNFT(address indexed recipient, uint256 indexed tokenId);
    //errors
    error notEnoughETHProvided();
    error withdrawFailed();
    error notAllowed();

    constructor(uint256 fee) ERC721("USERNFT", "UFT") {
        tokenCounter = 0;
        baseFee = fee;
        owner = payable(msg.sender);
    }

    function mintNFT(address recipient, string memory tokenURI) public payable {
        require(msg.value >= baseFee, notEnoughETHProvided());
        _mint(recipient, tokenCounter);
        //Sets the tokenURI for the newly minted NFT
        tokenURIs[tokenCounter] = tokenURI;
        //Writes the recipient and the token Id for the new NFT on the logs
        emit mintedUserNFT(recipient, tokenCounter);
        tokenCounter++;
    }

    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, withdrawFailed());
    }

    function getBaseFee() public view returns (uint256) {
        return baseFee;
    }

    function getCounter() public view returns (uint256) {
        return tokenCounter;
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURIs[tokenId];
    }
}
