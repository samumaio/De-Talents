const CONTRACT_ADDRESS = "0x44D02689910920d71354215931ecEC1A04C2156d"; // Inserisci l'indirizzo del contratto
import { CONTRACT_ABI } from '../abiCertificateNFT.js'

async function ottieniListaIstituzioni() {
    if (!window.ethereum) {
      alert("Please connect to MetaMask first!");
      return;
    }
  
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const istituzioni = await contract.getAllInstitutions();
  
      const listaIstituzioni = [];
      for (const indirizzo of istituzioni) {
        const nome = await contract.getInstitutionName(indirizzo);
        const stato = await contract.getInstitutionStatus(indirizzo);

        let statusMessage = "";
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
        //console.log(`Stato dell'istituzione ${statusMessage}:`, stato);
        listaIstituzioni.push({ address: indirizzo, name: nome, state: statusMessage});
      }
    

      const outputElement = document.getElementById("elencoIstituzioni");
      outputElement.innerHTML = ""; // Pulisce il contenitore

      listaIstituzioni.forEach((istituzione) => {
        const card = document.createElement("div");
        card.className = "card";
    
        // Determina il colore dello stato in base al suo valore
        const statoColorClass = istituzione.state === "VERIFIED" ? "stato-verde" : "stato-rosso";
    
        card.innerHTML = `
            <h3>${istituzione.name}</h3>
            <p><strong>Indirizzo:</strong> ${istituzione.address}</p>
            <p><strong>Stato:</strong> <span class="${statoColorClass}">${istituzione.state}</span></p>
        `;
        outputElement.appendChild(card);
    });
    
    } catch (error) {
      console.error("Errore durante l'interazione con il contratto:", error);
      document.getElementById("output").innerText = "Errore durante l'interazione con il contratto.";
    }
  }
  
  /*async function verificaIstituzioneSelezionata() {
    if (!window.ethereum) {
      alert("Please connect to MetaMask first!");
      return;
    }
  
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  
      const dropdown = document.getElementById("istituzioniDropdown");
      const indirizzoSelezionato = dropdown.value;
  
      if (!indirizzoSelezionato) {
        alert("Seleziona un'istituzione dal menu a tendina.");
        return;
      }
  
      // Verifica l'istituzione selezionata
      const tx = await contract.verifyInstitution(indirizzoSelezionato);
      await tx.wait(); // Aspetta che la transazione venga confermata
      alert("Istituzione verificata con successo!");
  
      // Aggiorna il menu a tendina
      caricaIstituzioniNonVerificate();
    } catch (error) {
      console.error("Errore durante la verifica dell'istituzione:", error);
      alert("Errore durante la verifica dell'istituzione.");
    }
  }*/
  
  async function stampaIstituzioneNonVerificata(){
    if (!window.ethereum) {
      alert("Please connect to MetaMask first!");
      return;
    }
  
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const istituzioni = await contract.getAllInstitutions();
      const lista = [];
      for (const indirizzo of istituzioni) {
        try {
          const stato = await contract.getInstitutionStatus(indirizzo);  
          if (stato === 1) { // Stato "UNVERIFIED"
            const nome = await contract.getInstitutionName(indirizzo);
            lista.push(nome + " " + indirizzo);
          }
        } catch (error) {
          console.error(`Errore durante il recupero dei dati per ${indirizzo}:`, error);
        }
      }

      //const dropdown = document.createElement("select");
      const options = lista;

      const menu = document.getElementById("selezionaIstituzione");

      menu.innerHTML = ""; // Pulisce il menu prima di rigenerarlo
  
      options.forEach(options => {
          const elemento = document.createElement("option");
          elemento.value = options;
          elemento.textContent = options;
          menu.appendChild(elemento);
      });
      
    } catch (error) {
      console.error("Errore durante il caricamento delle istituzioni non verificate:", error);
    }
  }

  async function verifica(){
    if (!window.ethereum) {
      alert("Please connect to MetaMask first!");
      return;
    }
  
    try {
      const selezionato = document.getElementById("selezionaIstituzione").value;
      const s = selezionato.split(" ");
      const indirizzoSelezionato = s[s.length - 1];
      console.log(`Hai selezionato: ${indirizzoSelezionato}`);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  
      if (!indirizzoSelezionato) {
        alert("Seleziona un'istituzione dal menu a tendina.");
        return;
      }
  
      // Verifica l'istituzione selezionata
      const tx = await contract.verifyInstitution(indirizzoSelezionato);
      await tx.wait(); 
      alert("Istituzione verificata con successo!");
  
      ottieniListaIstituzioni();
      stampaIstituzioneNonVerificata();
    } catch (error) {
      console.error("Errore durante la verifica dell'istituzione:", error);
      alert("Errore durante la verifica dell'istituzione.");
    }

  }



  window.onload = async function () {
    await ottieniListaIstituzioni();
    await stampaIstituzioneNonVerificata();
  };

  window.verifica = verifica;

  
  