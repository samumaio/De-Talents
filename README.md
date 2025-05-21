# UserNFT - Smart Contract ERC721

Questo smart contract permette agli utenti di creare un NFT personale destinato a un indirizzo specifico ed è basato sullo standard ERC721. Ciò significa che gli NFT generati sono non fungibili, ovvero unici e non interscambiabili. Questo standard è stato scelto perché gli NFT rappresentano certificati digitali associati a una persona e non possono essere rivenduti o trasferiti.

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

# Funzionalità Principali:
- addNewInstitution(address institution, string memory name): permette di creare una nuova istituzione, e prende in input l'indirizzo dell'istituzione e il nome. Viene fatto un controllo se l'istituzione non è già presente nel mapping, e se così non fosse, salva l'indirizzo e il nome, e pone lo stato dell'istituzione a UNVERIFIED.
- mintNFT(address recipient, string memory tokenURI): solo le istituzioni possono emanare NFT ad un specifico indirizzo. Prende in input l'indirizzo del destinatario, e il tokenURI, ovvero il link ai dati del certificato.
- safeTransferFrom, transferFrom, _safeTransfer: funzioni sovrascritte per impedire il trasferimento degli NFT, e tutte bloccano il trasferimento con un errore soulBoundToken(). Questo è fatto perchè gli NFT sono personali e intrasferibili, garantendo che solo il destinatario possa conservargli.

# Getter:
- getTokenURI(tokenId): restituisce il link ai metadati di un NFT.
- getCounter(): restituisce il numero totale di NFT creati.
- getInstitutionStatus(address institution): mostra lo stato di un’istituzione.
- getInstitutionName(address institution): restituisce il nome dell’istituzione.
- getAllInstitutions(): restituisce la lista delle istituzioni registrate.
- getOwner(): restituisce l’indirizzo del proprietario del contratto.

**Indirizzo dello smart contract:** 0x1909ad6726Af1DAa6dcBf9610b07dCaD98642C12
