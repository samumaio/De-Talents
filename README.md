# DeTalents - Introduzione

Prima di illustrare il funzionamento di DeTalents, è necessario introdurre alcuni aspetti tecnici: 

##  Blockchain
Una blockchain è come un grande registro digitale pubblico e condiviso che conserva informazioni in modo sicuro, immutabile e trasparente. Ogni operazione o modifica viene registrata in blocchi, collegati tra loro in ordine cronologico. Una volta scritto qualcosa nella blockchain, non può essere modificato.

## Smart Contract
Gli smart contract (contratti intelligenti) sono programmi che vengono eseguiti automaticamente sulla blockchain garantendo l'esecuzione dinamica di transazioni in base a determinate condizione. Non richiedono intermediari e garantiscono che le regole siano rispettate. Ad esempio, un certificato NFT viene rilasciato solo se l'istituzione è verificata.

## DAO (Organizzazione Autonoma Decentralizzata)
Una DAO è un’organizzazione che funziona in modo democratico attraverso regole codificate in smart contract. Le decisioni (come approvare nuove istituzioni) vengono prese con votazioni effettuate direttamente dagli utenti, in questo caso da altre istituzioni verificate.

## Wallet (Portafoglio digitale)
Un wallet è un'applicazione o dispositivo che permette a un utente di interagire con la blockchain. Serve per conservare in sicurezza criptovalute, NFT e per firmare digitalmente le operazioni, come votazioni o la creazione di certificati. Nel nostro caso, Metamask consente di gestire la chaive privata di un account e firmare delle transazioni sulla blockchain.

## Transazione
Una transazione è qualsiasi azione registrata sulla blockchain, come l’invio di un token, la creazione di un certificato o un voto in una DAO. Ogni transazione è pubblica, tracciabile e non modificabile.

## NFT (Token Non Fungibile)
Un NFT è un certificato digitale unico e verificabile, registrato sulla blockchain. In DeTalents, gli NFT rappresentano certificati di istruzione, competenze e reputazione, garantendo l’autenticità del documento e la proprietà da parte del titolare. Rispetto a piattaforme proprietarie o non verificabili, una qualsiasi azienda può verificare la ownership di un certificato di formazione attraverso la blockchain.

## Token
I token sono asset digitali usati all’interno di una piattaforma blockchain. Possono rappresentare valore (come premi), accesso a funzionalità o potere di voto. In DeTalents, i token vengono usati per premiare la partecipazione attiva e il completamento di progetti open source.


# UserNFT - Smart Contract ERC721

Questo smart contract permette agli utenti di creare un NFT personale destinato a un indirizzo specifico ed è basato sullo standard ERC721. Ciò significa che gli NFT generati sono non fungibili, ovvero unici e non interscambiabili. Questo standard è stato scelto perché gli NFT rappresentano certificati digitali associati a una persona.
Questo NFT garantisce una riserva di ETH quando viene utilizzato per lo svolgimento di progetti.

## Struttura del contratto

Sono presenti le variabili principali:

- tokenCounter: tiene traccia del numero di NFT rilasciati. Viene incrementato ogni volta che viene creato un nuovo certificato.
- baseFee: rappresenta la tariffa minima da pagare per coniare un NFT.
- owner: memorizza l'indirizzo del creatore del contratto e viene inizializzato al momento della creazione dello smart contract.
- tokenURIs: associa ogni tokenId a un URI che contiene i metadati del token (immagini, descrizione, attributi). Per ottenere le informazioni di un NFT, si usa la funzione getTokenURI(tokenId).

## Funzionalità Principali:
- mintNFT(address recipient, string memory tokenURI): rilascia il NFT ad un specifico indirizzo. Prende in input l'indirizzo del destinatario, e il tokenURI, ovvero il link ai dati del certificato. 
- safeTransferFrom, transferFrom, _safeTransfer: funzioni sovrascritte per impedire il trasferimento degli NFT, e tutte bloccano il trasferimento con un errore soulBoundToken(). Questo è fatto perchè gli NFT sono personali e intrasferibili, garantendo che solo il destinatario possa conservargli.

## Getter:
- getBaseFee(): restituisce la commissione richiesta per il minting.
- getCounter(): restituisce il numero totale di NFT creati.
- getTokenURI(tokenId): restituisce il link ai metadati di un NFT specifico.

**Indirizzo dello smart contract:** 0x3e1a9dE3ac110F6b5b5cf043CED6f4c70E08e58f


---

# CertificateNFT - Smart Contract ERC721

Questo smart contract permette alle istituzioni di registrarsi alla piattaforma, e generare Certificate NFT unici e non trasferibili per gli utenti. 

## Struttura del Contratto

Variabili principali:

- tokenCounter: tiene traccia del numero di NFT rilasciati e viene incrementato ogni volta che viene creato un nuovo certificato.

- owner: memorizza l’indirizzo del creatore del contratto, inizializzato durante la fase di deploy.

- institutions: memorizza tutte le istituzioni registrate e il loro stato(NOTANINSTITUTION, UNVERIFIED, VERIFIED).

- institutionNames: associa il nome dell’istituzione al suo indirizzo.

- tokenURIs, associa ogni tokenId a un URI che contiene i metadati del token.

## Funzionalità Principali:
- addNewInstitution(address institution, string memory name): permette di creare una nuova istituzione, e prende in input l'indirizzo dell'istituzione e il nome. Viene fatto un controllo se l'istituzione non è già presente nel mapping, e se così non fosse, salva l'indirizzo e il nome, e pone lo stato dell'istituzione a UNVERIFIED.
- mintNFT(address recipient, string memory tokenURI): solo le istituzioni possono emanare NFT ad un specifico indirizzo. Prende in input l'indirizzo del destinatario, e il tokenURI, ovvero il link ai dati del certificato.
- safeTransferFrom, transferFrom, _safeTransfer: funzioni sovrascritte per impedire il trasferimento degli NFT, e tutte bloccano il trasferimento con un errore soulBoundToken(). Questo è fatto perchè gli NFT sono personali e intrasferibili, garantendo che solo il destinatario possa conservargli.

## Getter:
- getTokenURI(tokenId): restituisce il link ai metadati di un NFT.
- getCounter(): restituisce il numero totale di NFT creati.
- getInstitutionStatus(address institution): mostra lo stato di un’istituzione.
- getInstitutionName(address institution): restituisce il nome dell’istituzione.
- getAllInstitutions(): restituisce la lista delle istituzioni registrate.
- getOwner(): restituisce l’indirizzo del proprietario del contratto.

**Indirizzo dello smart contract:** 0x1909ad6726Af1DAa6dcBf9610b07dCaD98642C12

---
# CertificateNFTGovernance - Smart Contract ERC721
Questo smart contract introduce un meccanismo di governance decentralizzato per la gestione delle istituzioni che vogliono verificarsi e coniare Certificate NFT. Le istituzioni possono proporre la propria verifica, votare sulle proposte e viene fatta la gestione della blacklist per quelle rifiutate.
## Struttura del Contratto
Variabili principali
- s_proposalCounter: Contatore delle proposte di verifica create.
- s_proposals: Mapping che memorizza tutte le proposte di verifica delle istituzioni.
- s_rejectedInstitutions: Associa un indirizzo di un’istituzione rifiutata al timestamp in cui è stata rifiutata.
- s_hasVoted: Mapping che tiene traccia degli istituti che hanno già votato una proposta.
- REJECT_DURATION: Durata (90 giorni) della blacklist per istituzioni rifiutate.



## Funzionalità Principali:

- createProposal(uint256 duration, bool isDay): funzione che permette ad una istituzione registrata e non verificata di creare una proposta per la propria verifica. La durata massima di elezione è di 90 giorni. Quando è l'ultimo giorno di votazione, la durata viene converita da giorni a secondi automaticamente.
- vote(uint256 proposalId, bool voteFor): funzione che permette alle istituzioni verificate di votare per una istituzione in via di verifica. Vengono fatti dei controlli se la proposta è ancora valida, e se l'istituzione votante è verificata o meno.
- executeProposal(uint256 proposalId): funzione che può essere eseguita solo dall'owner, e la proposta deve essere già conclusa. Se i voti favorevoli sono maggiori rispetto a quelli sfavorevoli, l'istituzione viene verificata. In caso contrario, se i voti sono identici, l'istituzione può ricreare la proposta, altrimenti viene inserita nella blacklist. 
- getDaysLeft(address institution): restituisce i giorni mancanti alla riammissione. Infatti, dopo di che l'istituzione può ricreare la proposta. 

## Getter:
- getProposal(uint256 proposalId): Restituisce i dettagli di una proposta.
- getAllProposals(): Restituisce tutte le proposte esistenti.
- getProposalCounter(): Mostra il numero totale di proposte create.
- hasVoted(uint256 proposalId): Verifica se un'istituzione ha già votato.
- getRejectDuration(): Restituisce la durata della blacklist.

# Project Factory 

Questo Smart Contract permette di creare in maniera trasparente nuovi progetti open-source. Attraverso un factory pattern, un utente può lanciare un progetto e regolare i contribuenti che vi possono partecipare. Il principio alla base di questa interazione consiste nel garantire lo sviluppo di codice open-source in maniera trasperente e priva di intermediari tra proprietario e contribuenti. 

## Struttura del contratto
- mapping(address => bool) private s_projectAddresses - Mapping di tutti i progetti creati a partire da questo smart contract;
- uint256 private s_rewardTokenValue   - Valore iniziale dei Reward Tokens (RWT);

- function createProject(string memory name,string memory description,uint256 duration) -> Funzione che permette la creazione di un progetto, esegue il deploy di un nuovo smart contract ProjectContract. Il creatore del progetto deposita una quantità di ETH iniziale divisa in modo proporzionale tra i contribuenti. 

- function mintTokens(address recipient, uint256 amount) -> Funzione che permette di coniare un certo di numero di token di Reputazione (RWT) per aumentare la reputazione di un contribuente al progetto. Invocabile solo ad un indirizzo di uno smart contract di tipo ProjectContract

# Project Contract 

Questo smart contract permette di regolare lo sviluppo di un progetto open-source. 

Smart Contract in cui è implementato l'algoritmo di staking e la relativa logica di ricompensa. I contribuenti del progetto depositano una quantità di denaro sul contratto UserNFT, dopodiché mettono in gioco il proprio NFT nello smart contract di progetto in modo da assicurare il proprio contributo allo sviluppo del codice.

La quantità di liquidità depositata nello contratto userNFT è prelevabile esclusivamente dal proprietario del relativo NFT associato. In caso di rimborso a causa di un mancata azione svolta dal contribuente, il committente può prelevare una parte di liquidità dal userNFT firmando una transazione tramite l'indirizzo del contratto da lui posseduto.

Al fine di minimizzare il costo del gas di ciascuna operazione, il contratto implementa una logica di esecuzione priva di iterazioni calcolando accumulando dinamicamente le ricompense in qualsiasi istante il contribuente si unisca al progetto.

## Struttura del contratto 

- uint256 private s_rewardPerToken -> Rappresenta la ricompensa ;
- 


  
**Indirizzo dello smart contract:**  0xE7dF2b925764a2a7474F9a9F35082FB10686D886

---
Nel seguente repository è possibile trovare il front-end della piattaforma.

Repository De-Talents-Front-End: https://github.com/samumaio/De-Talents-Front-End.git
