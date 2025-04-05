import { CONTRACT_ABI } from '../abiCertificateNFT.js';

const CONTRACT_ADDRESS = "0x44D02689910920d71354215931ecEC1A04C2156d"; // Inserisci l'indirizzo del contratto

async function fetchInstitutionInfo() {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }

  try {
    // Richiedi l'accesso agli account di MetaMask
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    // Instanzia il contratto e chiama le funzioni
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const institutionName = await contract.getInstitutionName(userAddress);
    const institutionStatus = await contract.getInstitutionStatus(userAddress);

    // Aggiorna il nome dell'istituzione con grassetto
    const nomeElemento = document.getElementById("institutionName");
    nomeElemento.innerHTML = `Nome Istituzione: <strong>${institutionName}</strong>`;

    // Determina e applica il colore dello stato
    const statoElemento = document.getElementById("institutionStatus");
    let statusText;
    switch (institutionStatus) {
      case 0:
        statusText = "NOT AN INSTITUTION";
        statoElemento.innerHTML = `Stato Istituzione: ${statusText}`;
        statoElemento.style.color = "#555"; // Grigio per uno stato non definito
        break;
      case 1:
        statusText = "UNVERIFIED";
        statoElemento.innerHTML = `Stato Istituzione: <span class="stato-rosso">${statusText}</span>`;
        break;
      case 2:
        statusText = "VERIFIED";
        statoElemento.innerHTML = `Stato Istituzione: <span class="stato-verde">${statusText}</span>`;
        break;
      default:
        statusText = "UNKNOWN STATUS";
        statoElemento.innerHTML = `Stato Istituzione: ${statusText}`;
        statoElemento.style.color = "#555"; // Grigio per stati sconosciuti
    }
  } catch (error) {
    console.error("Error fetching institution info:", error);
  }
}

window.onload = fetchInstitutionInfo;
