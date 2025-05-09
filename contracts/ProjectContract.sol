// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./ProjectFactory.sol";
import "./UserNFT.sol";

/// @title User's ERC 721 NFT
/// @author samumaio
/// @notice This smart contract represents a project on DeTalents. The Staking rewards algorithm is made efficient in order not to make iterations
/// @notice Rather than the tradional staking algorithm. Instead of liquidity, users deposit their UserNFT to this smart contract and receive rewards for their work. The time is measured as days

contract ProjectContract is IERC721Receiver {
    UserNFT public userNft;
    ProjectFactory public factory;

    uint256 private s_rewardTokenValue;

    uint256 private s_rewardPerToken;
    uint256 private s_stakingDuration;
    uint256 private s_rewardRate;
    uint256 private s_totalStakedReputation;
    uint256 private s_lastUpdateTime;

    mapping(address => uint256) private s_userRewards;
    // amount of rewardPerToken since the last time the user has staked or withdrawn
    mapping(address => uint256) private s_lastUserRewardPerToken;
    //amount staked by each user in term of reputation (UserNFT reputation + the amount of RWT tokens)
    mapping(address => uint256) private s_userReputation;

    mapping(address => uint256) private s_contributorsTokenID;

    address private s_owner;
    string private s_name;
    string private s_description;
    uint256 private s_reward;
    mapping(address => bool) private s_hasApplied;
    mapping(address => bool) private s_hasStaked;
    address[] private s_applicants;
    mapping(address => bool) private s_contributors;
    address[] private s_contributorsAddress;
    mapping(address => uint256) private s_fundersAmount;
    address[] private s_funders;
    mapping(uint256 => Milestone) private s_milestones;
    uint256 private s_deadline;
    bool private s_success;
    uint256 private s_milestoneCounter;
    uint256 private s_contributorCounter;

    error notOwner(address);
    error projectEnded();
    error invalidFundValue();
    error totalStakedReputationIsZero();
    error alreadyAContributor(address);
    error notAssignedContributor(address);
    error insufficientRewardRate();
    error invalidMilestoneIndex();
    error notAllowedToStake();
    error withdrawalFailed();
    error nftNotStaked();
    error noRewardsToWithdraw();
    error notAContributor();
    error projectNotEnded();
    error applicationNotSent();
    error applicationAlreadySent(address);

    event rewardIncreased(
        address indexed funder,
        uint256 indexed increasedAmount
    );
    event applicationSent(address indexed applicant);
    event contributorAdded(address indexed contributor);
    event milestoneCreated(uint256 indexed milestoneIndex);
    event milestoneDisabled(uint256 indexed milestoneIndex);
    event milestoneCompleted(uint256 indexed milestoneIndex);
    event nftStaked(uint256 indexed tokenId);
    modifier onlyOwner() {
        require(msg.sender == s_owner, notOwner(msg.sender));
        _;
    }
    modifier notEnded() {
        require(block.timestamp < s_deadline, projectEnded());
        _;
    }
    modifier onlyAssignedContributor(address contributor) {
        require(msg.sender == contributor, notAssignedContributor(contributor));
        _;
    }

    struct Milestone {
        string milestoneName;
        bool completed;
        bool active;
        uint256 deadline;
        uint256 rewardTokens; //number of reward tokens returned by the milestone
        address responsible;
    }

    function setNFTContractAddress(address nftContractAddress) public {
        userNft = UserNFT(nftContractAddress);
    }

    //duration è passato a funzione come durata in giorni
    constructor(
        string memory name,
        string memory description,
        uint256 duration,
        uint256 initialReward,
        address ownerAddress,
        uint256 rewardTokenValue,
        address factoryAddress
    ) {
        s_reward = initialReward;
        s_rewardRate = (s_reward) / (duration * 86400);
        //since solidity cannot handle floating point values, if the rewardRate is low it may be truncated to 0
        require(s_rewardRate != 0, insufficientRewardRate());
        s_owner = ownerAddress;
        s_rewardTokenValue = rewardTokenValue;
        s_name = name;
        s_description = description;
        s_deadline = block.timestamp + (duration * 86400);
        s_success = false;
        s_milestoneCounter = 0;
        s_contributorCounter = 0;
        s_totalStakedReputation = 0;
        s_lastUpdateTime = 0;
        factory = ProjectFactory(factoryAddress);
    }

    function retrieveNFT(uint256 tokenId) external {
        //this function is invoked to unstake an NFT. It checks if the milestone assigned to the staker are completed otherwise it decrease the staked NFT reputation
        require(s_contributors[msg.sender], notAContributor());
        require(userNft.ownerOf(tokenId) == msg.sender, notAllowedToStake());
        require(s_hasStaked[msg.sender], nftNotStaked());
        Milestone memory milestone;
        uint256 penality = 0;
        uint256 benefits = 0;
        // uint256 i=0;
        // while (milestonesCompleted && i<s_milestoneCounter){
        //     milestonesCompleted = s_milestones[i].responsible == msg.sender && s_milestones[i].completed;
        //     i++;
        // }
        for (uint256 i = 0; i < s_milestoneCounter; i++) {
            milestone = s_milestones[i];
            if ((milestone.responsible == msg.sender) && !milestone.completed) {
                penality += (milestone.rewardTokens / 2) * s_rewardTokenValue;
            }
        }
        if (penality != 0) {
            userNft.withdrawLiquidity(tokenId, penality);
        }
        //update rewardPerToken
        s_rewardPerToken +=
            (s_rewardRate / s_totalStakedReputation) *
            (block.timestamp - s_lastUpdateTime);
        //users reward are calculated
        s_userRewards[msg.sender] +=
            s_userReputation[msg.sender] *
            (s_rewardPerToken - s_userReputation[msg.sender]);
        //updates the last updated time
        s_lastUpdateTime = block.timestamp;
        uint256 amount = s_userReputation[msg.sender];
        s_userReputation[msg.sender] -= amount;
        s_totalStakedReputation -= amount;
        userNft.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    function stakeNFT(uint256 tokenId) external notEnded {
        require(s_contributors[msg.sender], notAContributor());
        require(userNft.ownerOf(tokenId) == msg.sender, notAllowedToStake());
        s_contributorsTokenID[msg.sender] = tokenId;
        userNft.safeTransferFrom(msg.sender, address(this), tokenId);
        uint256 reputation = userNft.getUserReputation(tokenId);
        s_totalStakedReputation += reputation;
        s_userReputation[msg.sender] += reputation;
        s_hasStaked[msg.sender] = true;
        emit nftStaked(tokenId);
    }

    function updateStaking(
        uint256 tokenId,
        uint256 amount,
        address previousOwner
    ) public notEnded {
        require(s_contributors[previousOwner], notAContributor());
        require(s_hasStaked[previousOwner], nftNotStaked());
        require(s_totalStakedReputation > 0, totalStakedReputationIsZero());
        //update rewardPerToken
        s_rewardPerToken +=
            (s_rewardRate / s_totalStakedReputation) *
            (block.timestamp - s_lastUpdateTime);
        //users reward are calculated
        s_userRewards[msg.sender] +=
            s_userReputation[msg.sender] *
            (s_rewardPerToken - s_userReputation[msg.sender]);
        //updates the last updated time
        s_lastUpdateTime = block.timestamp;
        s_userReputation[msg.sender] += amount;
        s_totalStakedReputation += amount;
    }

    // function updateStaking(uint256 amount) internal {
    //     require(s_totalStakedReputation>0,totalStakedReputationIsZero());
    //     //update rewardPerToken
    //     s_rewardPerToken += (s_rewardRate/s_totalStakedReputation) * (block.timestamp - s_lastUpdateTime);
    //     //users reward are calculated
    //     s_userRewards[msg.sender] += s_userReputation[msg.sender] * (s_rewardPerToken - s_userReputation[msg.sender]);
    //     //updates the last updated time
    //     s_lastUpdateTime = block.timestamp;
    //     s_userReputation[msg.sender] += amount;
    //     s_totalStakedReputation += amount;
    // }

    function withdrawRewards(uint256 tokenId) public {
        require(userNft.ownerOf(tokenId) == msg.sender, notAllowedToStake());
        require(s_hasStaked[msg.sender], nftNotStaked());
        require(s_contributors[msg.sender], notAContributor());

        uint256 amount = s_userRewards[msg.sender];
        require(amount > 0, noRewardsToWithdraw());
        s_userRewards[msg.sender] = 0;
        (bool callSuccess, ) = payable(msg.sender).call{value: amount}("");
        require(callSuccess, "transactionFailed");
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function createMilestone(
        string memory milestoneName,
        uint256 duration,
        address responsible,
        uint256 rewardTokens
    ) external onlyOwner notEnded {
        require(s_contributors[responsible], notAContributor());
        s_milestones[s_milestoneCounter] = Milestone(
            milestoneName,
            false,
            true,
            block.timestamp + (duration * 86400),
            rewardTokens,
            responsible
        );
        emit milestoneCreated(s_milestoneCounter);
        s_milestoneCounter++;
    }

    function disableMilestone(uint256 index) external onlyOwner notEnded {
        require(
            index >= 0 && index < s_milestoneCounter,
            invalidMilestoneIndex()
        );
        s_milestones[index].active = false;
        emit milestoneDisabled(index);
    }

    function setMilestone(
        uint256 index,
        string memory milestoneName,
        uint256 duration,
        address responsible,
        uint256 rewardToken
    ) external onlyOwner notEnded {
        require(
            index >= 0 && index < s_milestoneCounter,
            invalidMilestoneIndex()
        );
        s_milestones[index] = Milestone(
            milestoneName,
            false,
            true,
            block.timestamp + (duration * 86400),
            rewardToken,
            responsible
        );
    }

    function completeMilestone(
        uint256 index
    )
        external
        onlyAssignedContributor(getMilestoneResponsible(index))
        notEnded
    {
        require(
            index >= 0 && index < s_milestoneCounter,
            invalidMilestoneIndex()
        );
        uint256 tokenID = s_contributorsTokenID[getMilestoneResponsible(index)];
        require(userNft.ownerOf(tokenID) == address(this), notAllowedToStake());
        require(s_milestones[index].responsible == msg.sender);
        require(s_contributors[msg.sender], notAContributor());
        s_milestones[index].completed = true;
        updateStaking(
            tokenID,
            s_milestones[index].rewardTokens * s_rewardTokenValue,
            s_milestones[index].responsible
        );
        //mints the RWTs for the responsible of the milestone
        factory.mintToken(msg.sender, s_milestones[index].rewardTokens);
        emit milestoneCompleted(index);
    }

    function setName(string memory name) public onlyOwner notEnded {
        s_name = name;
    }

    function postpone(uint256 duration) public onlyOwner notEnded {
        s_deadline += (duration * 86400);
    }

    function sendApplication() external notEnded {
        require(!s_hasApplied[msg.sender], applicationAlreadySent(msg.sender));
        require(!s_contributors[msg.sender], alreadyAContributor(msg.sender));
        s_hasApplied[msg.sender] = true;
        s_applicants.push(msg.sender);
        emit applicationSent(msg.sender);
    }

    function retireApplication() external notEnded {
        require(s_hasApplied[msg.sender], applicationNotSent());
        require(!s_contributors[msg.sender], alreadyAContributor(msg.sender));
        s_hasApplied[msg.sender] = false;
    }

    function approveApplication(address applicant) external onlyOwner notEnded {
        require(!s_contributors[applicant], alreadyAContributor(applicant));
        require(s_hasApplied[applicant], applicationNotSent());
        s_contributors[applicant] = true;
        s_contributorsAddress.push(applicant);
        emit contributorAdded(applicant);
    }

    function setDescription(
        string memory description
    ) public onlyOwner notEnded {
        s_description = description;
    }

    function setOutcome(bool success) public onlyOwner notEnded {
        s_success = success;
    }

    function addFunds() external payable notEnded {
        require(msg.value > 0, invalidFundValue());
        s_reward += msg.value;
        s_rewardRate = s_reward / ((s_deadline - block.timestamp));
        if (s_fundersAmount[msg.sender] == 0) {
            s_funders.push(msg.sender);
        }
        s_fundersAmount[msg.sender] += msg.value;
        emit rewardIncreased(msg.sender, msg.value);
    }

    function withdrawFunds() public onlyOwner {
        //if the project is ended or expired, the owner can withdraw the funds left
        require(!s_success && block.timestamp > s_deadline, projectNotEnded());
        (bool callSuccess, ) = payable(msg.sender).call{value: s_reward}("");
        require(callSuccess, withdrawalFailed());
    }

    function getProjectInfo()
        public
        view
        returns (
            string memory name,
            string memory description,
            uint256 initialReward,
            uint256 deadline,
            address owner,
            bool success
        )
    {
        return (
            s_name,
            s_description,
            s_reward,
            s_deadline,
            s_owner,
            s_success
        );
    }

    function getAllApplicants() public view returns (address[] memory) {
        return s_applicants;
    }

    function getMilestoneResponsible(
        uint256 index
    ) public view returns (address) {
        return s_milestones[index].responsible;
    }

    function getAllContributors() public view returns (address[] memory) {
        return s_contributorsAddress;
    }

    function getAllFunders() public view returns (address[] memory) {
        return s_funders;
    }

    function getRewardRate() public view returns (uint256) {
        return s_rewardRate;
    }

    function getFundersAmount(address funder) public view returns (uint256) {
        return s_fundersAmount[funder];
    }

    function getMilestone(
        uint256 milestoneID
    ) public view returns (Milestone memory) {
        return s_milestones[milestoneID];
    }

    function getTotalAmountStaked() public view returns (uint256) {
        return s_totalStakedReputation;
    }
}
