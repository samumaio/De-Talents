const CONTRACT_ADDRESS = "0xe85AC63cf124590679F8F9885c8aBc8985dE9e77"; // Inserisci l'indirizzo del contratto
import { CONTRACT_ABI } from '../abiCertificateNFT.js'

async function connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        await ethereum.request({ method: "eth_requestAccounts" });
        document.getElementById("connectButton").innerHTML = "Connected";
        const accounts = await ethereum.request({ method: "eth_accounts" });
        console.log(accounts);
      } catch (error) {
        console.log(error);
      }
    } else {
      document.getElementById("connectButton").innerHTML = "Please install MetaMask";
    }
  }