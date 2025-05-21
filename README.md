# UserNFT - Smart Contract ERC721

Questo smart contract permette agli utenti di creare un NFT personale destinato a un indirizzo specifico ed è basato sullo standard ERC721. Ciò significa che gli NFT generati sono non fungibili, ovvero unici e non interscambiabili. Questo standard è stato scelto perché gli NFT rappresentano certificati digitali associati a una persona e non possono essere rivenduti o trasferiti, rendendoli ideali per attestati, identità digitali e membership.
Struttura del contratto

Sono presenti tre variabili principali:

- tokenCounter: tiene traccia del numero di NFT rilasciati. Viene incrementato ogni volta che viene creato un nuovo certificato.
- baseFee: rappresenta la tariffa minima da pagare per coniare un NFT.
- owner: memorizza l'indirizzo del creatore del contratto e viene inizializzato al momento della creazione dello smart contract.

## Mapping:
- tokenURIs: associa ogni tokenId a un URI che contiene i metadati del token (immagini, descrizione, attributi). Per ottenere le informazioni di un NFT, si usa la funzione getTokenURI(tokenId).

## Funzionalità Principali:

mintNFT(address recipient, string memory tokenURI): rilascia il NFT ad un specifico indirizzo. Prende in input l'indirizzo del destinatario, e il tokenURI, ovvero il link ai dati del certificato. 

safeTransferFrom, transferFrom, _safeTransfer: funzioni sovrascritte per impedire il trasferimento degli NFT, e tutte bloccano il trasferimento con un errore soulBoundToken(). Questo è fatto perchè gli NFT sono personali e intrasferibili, garantendo che solo il destinatario possa conservargli.

##Getter:
- getBaseFee(): restituisce la commissione richiesta per il minting.
- getCounter(): restituisce il numero totale di NFT creati.
- getTokenURI(tokenId): restituisce il link ai metadati di un NFT specifico.

** Indirizzo dello smart contract: **0x3e1a9dE3ac110F6b5b5cf043CED6f4c70E08e58f
