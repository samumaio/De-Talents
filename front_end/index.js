const CONTRACT_ADDRESS = "0x44D02689910920d71354215931ecEC1A04C2156d"; // Inserisci l'indirizzo del contratto
import { CONTRACT_ABI } from './abiCertificateNFT.js'


async function connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        await ethereum.request({ method: "eth_requestAccounts" });
        document.getElementById("connectButton").innerHTML = "Connected";
        const accounts = await ethereum.request({ method: "eth_accounts" });
        console.log(accounts);
        verificaOwner();
        verificaStatoIstituzione();
      } catch (error) {
        console.log(error);
      }
    } else {
      document.getElementById("connectButton").innerHTML = "Please install MetaMask";
    }
}

async function verificaOwner() {
  if (!window.ethereum) {
    alert("Please connect to MetaMask first!");
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const userAddress = await signer.getAddress();
    console.log("User Address:", userAddress);

    const ownerAddress = await contract.getOwner();
    console.log("Owner Address:", ownerAddress);

    if (userAddress.toLowerCase() === ownerAddress.toLowerCase()) {
      window.location.href = "admin/admin.html";
    } else {
      console.log("L'utente non è il proprietario del contratto.");
    }
  } catch (error) {
    console.error("Error interacting with contract:", error);
    document.getElementById("output").innerText = "Error interacting with contract.";
  }
}

async function ottieniStatoIstituzione() {
  if (!window.ethereum) {
    alert("Please connect to MetaMask first!");
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const userAddress = await signer.getAddress();
    console.log("User Address:", userAddress);

    const stato = await contract.getInstitutionStatus(userAddress);

    let statusMessage;
    switch (stato) {
      case 0:
        statusMessage = "NOT AN INSTITUTION";
        break;
      case 1:
        statusMessage = "UNVERIFIED";
        break;
      case 2:
        statusMessage = "VERIFIED";
        break;
      default:
        statusMessage = "UNKNOWN STATUS";
    }
    return statusMessage;
  } catch (error) {
    console.error("Error interacting with contract:", error);
    document.getElementById("output").innerText = "Error interacting with contract.";
  }
}

async function verificaStatoIstituzione() {
  const statusMessage = await ottieniStatoIstituzione();
  if(statusMessage === "UNVERIFIED" || statusMessage === "VERIFIED"){
    window.location.href = "login/login.html";
  }else{
    window.location.href = "registrazione/registra.html";
  }
}


window.connect = connect;
window.verificaStatoIstituzione = verificaStatoIstituzione;