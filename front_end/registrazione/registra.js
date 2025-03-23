import { CONTRACT_ABI } from '../abiCertificateNFT.js';

const CONTRACT_ADDRESS = "0x44D02689910920d71354215931ecEC1A04C2156d"; // Inserisci l'indirizzo del contratto

async function registraIstituzione() {
  if (!window.ethereum) {
    alert("Please connect to MetaMask first!");
    return;
  }

  try {
    // Inizializza il provider e il signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const userAddress = await signer.getAddress();
    console.log("User Address:", userAddress);
    
    const name = document.getElementById("institutionName").value;

    const tx = await contract.addNewInstitution(userAddress, name);
    await tx.wait();

    document.getElementById("output").innerText = "Institution registered successfully!";
  } catch (error) {
    console.error("Error registering institution:", error);
    document.getElementById("output").innerText = "Error registering institution.";
  }
}

window.registraIstituzione = registraIstituzione;