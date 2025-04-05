import { CONTRACT_ABI } from '../abiCertificateNFT.js';

const CONTRACT_ADDRESS = "0x44D02689910920d71354215931ecEC1A04C2156d"; // Inserisci l'indirizzo del contratto

async function registraIstituzione() {
  if (!window.ethereum) {
    alert("Please connect to MetaMask first!");
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    
    console.log("User Address:", userAddress);
    
    const name = document.getElementById("institutionName").value;

    
  } catch (error) {
    console.error("Error registering institution:", error);
    document.getElementById("output").innerText = "Error registering institution.";
  }
}

async function verificaNome() {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }

  try {
    const name = (document.getElementById("institutionName").value).trim();
    const a = name.toLowerCase();
    if (name.length > 0) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const allInstitutions = await contract.getAllInstitutions(); 

      let nomeUguale = false;

      for (const institutionAddress of allInstitutions) {
        const institutionName = ((await contract.getInstitutionName(institutionAddress)).trim()).toLowerCase(); 
        if (institutionName === a) {
          console.log(`Trovata corrispondenza: ${institutionName}`);
          nomeUguale = true;
        }
      }


      if (nomeUguale) {
        alert(`Nome già utilizzato. Scegli un altro nome.`);
      } else {
        const userAddress = await signer.getAddress();
        const tx = await contract.addNewInstitution(userAddress, name);
        await tx.wait();

        document.getElementById("output").innerText = "Institution registered successfully!";
      }
    } else {
      alert(`Il campo nome non può essere vuoto o composto da soli spazi.`);
    }
  } catch (error) {
    console.error("Error fetching institution info:", error);
  }
}




window.verificaNome = verificaNome;