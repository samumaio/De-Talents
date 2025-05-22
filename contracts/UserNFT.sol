// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ProjectFactory.sol";

/// @title User's ERC 721 NFT
/// @author samumaio
/// @notice This smart contract mints a personal NFT on behalf of the sender of this contract. Furthermore this contract should be a Soul bound token so as to not be transfered

contract UserNFT is ERC721 {
    uint256 private tokenCounter;
    uint256 private baseFee;
    address payable private owner;
    ProjectFactory public factory;
    mapping(address => string) public userNames;
    mapping(uint256 => string) private tokenURIs;
    mapping(uint256 => uint256) private reputation;
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
    modifier onlyNFTOwner(uint256 tokenId) {
        require(msg.sender == ownerOf(tokenId), notAllowed());
        _;
    }
    //events
    event mintedUserNFT(address indexed recipient, uint256 indexed tokenId);
    //errors
    error notEnoughETHProvided();
    error withdrawFailed();
    error notAllowed();
    error notAProject();
    //each is user is allowed to own only one NFT
    error alreadyOwner();

    constructor(
        uint256 fee,
        address projectFactoryAddress
    ) ERC721("USERNFT", "UFT") {
        tokenCounter = 0;
        baseFee = fee;
        owner = payable(msg.sender);
        factory = ProjectFactory(projectFactoryAddress);
    }

    function mintNFT(address recipient, string memory tokenURI) public payable {
        require(msg.value >= baseFee, notEnoughETHProvided());
        //each user can own only one userNFT
        require(balanceOf(recipient) == 0, alreadyOwner());
        _mint(recipient, tokenCounter);
        //Sets the tokenURI for the newly minted NFT
        tokenURIs[tokenCounter] = tokenURI;
        reputation[tokenCounter] = msg.value;
        //Writes the recipient and the token Id for the new NFT on the logs
        emit mintedUserNFT(recipient, tokenCounter);
        tokenCounter++;
    }

    function approveForStaking(
        uint256 tokenId,
        address projectAddress
    ) public onlyNFTOwner(tokenId) {
        //approves the project smart contract to own temporarily the nft, an Approval event is emitted: emit Approval(owner, to, tokenId);
        _approve(projectAddress, tokenId, msg.sender, true);
    }

    // function incrementReputation(uint256 tokenId,uint256 amount) external  {
    //     //only a ProjectContract can invoke this function
    //     require(factory.isProjectAddress(msg.sender),notAProject());
    //     reputation[tokenId] += amount;
    // }
    // function decrementReputation(uint256 tokenId,uint256 amount) external {
    //     //only a ProjectContract can invoke this function
    //     require(factory.isProjectAddress(msg.sender),notAProject());
    //     //the userNFT reputation cannot be negative
    //     require(reputation[tokenId]-amount>0,notAllowed());
    //     reputation[tokenId] -= amount;
    // }

    function addLiquidity(uint256 tokenId) external payable {
        //only an approved ProjectContract or the owner of the NFT can add liquidity
        require(
            getApproved(tokenId) == msg.sender ||
                ownerOf(tokenId) == msg.sender,
            notAllowed()
        );
        reputation[tokenId] += msg.value;
    }

    function withdrawLiquidity(uint256 tokenId, uint256 amount) external {
        //only an approved ProjectContract or the owner of the NFT can withdraw liquidity
        require(ownerOf(tokenId) == msg.sender, notAllowed());
        require(amount <= reputation[tokenId], withdrawFailed());
        (bool callSuccess, ) = payable(msg.sender).call{value: amount}("");
        require(callSuccess, withdrawFailed());
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

    function getUserReputation(uint256 tokenId) public view returns (uint256) {
        return reputation[tokenId];
    }
}
