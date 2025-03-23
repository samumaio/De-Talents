import { CONTRACT_ABI } from '../abiCertificateNFT.js';

const CONTRACT_ADDRESS = "0x44D02689910920d71354215931ecEC1A04C2156d"; // Inserisci l'indirizzo del contratto

async function fetchInstitutionInfo() {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const institutionName = await contract.getInstitutionName(userAddress);
    const institutionStatus = await contract.getInstitutionStatus(userAddress);

    document.getElementById("institutionName").innerText = `Nome Istituzione: ${institutionName}`;
    let statusText;
    switch (institutionStatus) {
      case 0:
        statusText = "NOT AN INSTITUTION";
        break;
      case 1:
        statusText = "UNVERIFIED";
        break;
      case 2:
        statusText = "VERIFIED";
        break;
      default:
        statusText = "UNKNOWN STATUS";
    }
    document.getElementById("institutionStatus").innerText = `Stato Istituzione: ${statusText}`;
  } catch (error) {
    console.error("Error fetching institution info:", error);
    //document.getElementById("output").innerText = "Error fetching institution info.";
  }
}

window.onload = fetchInstitutionInfo;