// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import "./ProjectContract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title ProjectFactory
/// @author samumaio
/// @notice This smart contract allows users to create their own projects and to mint RewardTokens on behalf of the users that work on their projects

contract ProjectFactory is ERC20 {
    mapping(address => bool) private s_projectAddresses;
    mapping(address => address[]) private s_ownerProjects;
    uint256 private s_rewardTokenValue;

    event projectCreated(address indexed projectAddress);
    event rewardTokensMinted(address indexed recipient, uint256 indexed amount);

    error notAllowedToMint();

    constructor(uint256 rewardTokenValue) ERC20("RewardToken", "RWT") {
        s_rewardTokenValue = rewardTokenValue;
    }

    function createProject(
        string memory name,
        string memory description,
        uint256 duration,
        uint256 initialReward
    ) external {
        ProjectContract newProject = new ProjectContract(
            name,
            description,
            duration,
            initialReward,
            msg.sender,
            s_rewardTokenValue,
            address(this)
        );
        s_projectAddresses[address(newProject)] = true;
        s_ownerProjects[msg.sender].push(address(newProject));
        emit projectCreated(address(newProject));
    }

    function mintToken(address recipient, uint256 amount) public {
        //this function can be invoked only by ProjectContract Objects
        require(s_projectAddresses[msg.sender], notAllowedToMint());
        _mint(recipient, amount);
        emit rewardTokensMinted(recipient, amount);
    }

    function getOwnerProjects(
        address owner
    ) public view returns (address[] memory) {
        return s_ownerProjects[owner];
    }

    function isProjectAddress(
        address addressToBeVerified
    ) public view returns (bool) {
        return s_projectAddresses[addressToBeVerified];
    }

    function getRewardTokenValue() public view returns (uint256) {
        return s_rewardTokenValue;
    }
}
