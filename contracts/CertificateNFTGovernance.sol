// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import "./CertificateNFT.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CertificateNFTGovernance is CertificateNFT, ReentrancyGuard {
    struct Proposal {
        address institutionAddress;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 endTime;
        bool executed;
    }
    mapping(uint256 => Proposal) public s_proposals;
    //durata di inserimento nella blacklist in secondi (90 giorni)
    uint256 constant REJECT_DURATION = 7776000;
    //associa un indirizzo di un istituzione rifiutata al timestamp in cui è stata rifiutata
    mapping(address => uint256) public s_rejectedInstitutions;
    //associa un hash crittografico univoco (dato dall'unione di id della proposta e indirizzo del votante) ad un booleano che indica se l'utente ha gia votato la proposta
    mapping(bytes32 => bool) private s_hasVoted;
    uint256 private s_proposalCounter;

    //events
    //durata del proposal in secondi
    event proposalCreated(
        address indexed institution,
        uint256 indexed duration
    );
    //il voto di un istituzione non è mostrato nei logs
    event proposalVoted(uint256 indexed proposalId);
    event proposalExecuted(address indexed institution, bool indexed approved);
    //errors
    error notUnverifiedInstitution(address institution);
    error rejectedInstitution(address institution);
    error invalidDuration();
    error proposalIdNotFound(uint256 proposalId);
    error proposalEnded(uint256 proposalId);
    error proposalNotEnded(uint256 proposalId);
    error proposalAlreadyExecuted(uint256 proposalId);
    error institutionHasAlreadyVoted();

    //modifiers
    // compie il revert della transazione se l'istituzione è stata rifiutata in precedenza
    modifier notRejected() {
        uint256 lastRejection = s_rejectedInstitutions[msg.sender];
        require(
            lastRejection == 0 ||
                block.timestamp > lastRejection + REJECT_DURATION,
            rejectedInstitution(msg.sender)
        );
        _;
    }

    constructor() CertificateNFT() {
        s_proposalCounter = 0;
    }

    //se isDay == true allora l'unita di misura di duration e' in giorni altrimenti in secondi
    function createProposal(uint256 duration, bool isDay) public notRejected {
        //Controllo che l'istituzione da verificare sia presente nel mapping e che il proprio status sia UNVERIFIED
        //funzione del contatto padre, viene pagato il gas anche se si tratta di una view function
        require(
            getInstitutionStatus(msg.sender) == institutionStatus.UNVERIFIED,
            notUnverifiedInstitution(msg.sender)
        );
        //Si imposta come durata massima di elezione di una proposta 90 giorni
        require(
            (!isDay && duration <= 7776000) || (isDay && duration <= 90),
            invalidDuration()
        );
        if (isDay) {
            duration *= 86400; //si converte la durata da giorni a secondi
        }
        s_proposals[s_proposalCounter] = Proposal({
            institutionAddress: msg.sender,
            votesFor: 0,
            votesAgainst: 0,
            endTime: block.timestamp + duration,
            executed: false
        });
        emit proposalCreated(msg.sender, duration);
        s_proposalCounter++;
    }

    //funzione che autorizza il voto solo delle istituzioni approvate
    function vote(
        uint256 proposalId,
        bool voteFor
    ) public onlyVerifiedInstitutions nonReentrant {
        Proposal memory proposal = s_proposals[proposalId];
        //controlla se il proposalId esiste
        require(proposal.endTime != 0, proposalIdNotFound(proposalId));
        //controlla se la proposta è ancora in fase di voto
        require(block.timestamp <= proposal.endTime, proposalEnded(proposalId));
        //keccak è algoritmo di hashing standard per solidity
        bytes32 keyHash = keccak256(abi.encodePacked(proposalId, msg.sender));
        //controlla se l'istituzione ha già votato
        require(s_hasVoted[keyHash] == false, institutionHasAlreadyVoted());
        if (voteFor) {
            s_proposals[proposalId].votesFor++;
        } else {
            s_proposals[proposalId].votesAgainst++;
        }
        s_hasVoted[keyHash] = true;
        emit proposalVoted(proposalId);
    }

    function executeProposal(uint256 proposalId) public onlyOwner {
        Proposal memory proposal = s_proposals[proposalId];
        // id della proposta deve esistere
        require(proposal.endTime != 0, proposalIdNotFound(proposalId));
        // la proposta deve essere già conclusa
        require(
            block.timestamp > proposal.endTime,
            proposalNotEnded(proposalId)
        );
        //la proposta non deve essere già eseguita
        require(!proposal.executed, proposalAlreadyExecuted(proposalId));
        s_proposals[proposalId].executed = true;
        bool approved = false;
        if (proposal.votesFor > proposal.votesAgainst) {
            verifyInstitution(proposal.institutionAddress);
            approved = true;
        } else {
            //se i voti sono uguali l'istituzione può farsi votare nuovamente senza essere inserita nella blacklist
            if (proposal.votesFor != proposal.votesAgainst) {
                s_rejectedInstitutions[proposal.institutionAddress] = block
                    .timestamp;
            }
        }
        emit proposalExecuted(proposal.institutionAddress, approved);
    }

    //getters
    function getProposal(
        uint256 proposalId
    ) public view returns (Proposal memory) {
        Proposal memory proposal = s_proposals[proposalId];
        // id della proposta deve esistere
        require(proposal.endTime != 0, proposalIdNotFound(proposalId));
        return (proposal);
    }

    function getAllProposals() public view returns (Proposal[] memory) {
        Proposal[] memory proposals = new Proposal[](s_proposalCounter);
        for (uint256 i = 0; i < s_proposalCounter; i++) {
            proposals[i] = s_proposals[i];
        }
        return proposals;
    }

    //restituisce il numero di giorni mancanti alla riammissione
    function getDaysLeft(address institution) public view returns (uint256) {
        uint256 lastRejection = s_rejectedInstitutions[institution];
        if (
            lastRejection == 0 ||
            block.timestamp > lastRejection + REJECT_DURATION
        ) {
            return 0;
        }
        return (lastRejection + REJECT_DURATION - block.timestamp) / 86400;
    }

    function getProposalCounter() public view returns (uint256) {
        return s_proposalCounter;
    }

    function hasVoted(uint256 proposalId) public view returns (bool) {
        bytes32 keyHash = keccak256(abi.encodePacked(proposalId, msg.sender));
        return s_hasVoted[keyHash];
    }

    function getRejectDuration() public pure returns (uint256) {
        return REJECT_DURATION;
    }
}
