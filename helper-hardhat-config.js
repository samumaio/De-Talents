//Parametri di configurazione custom degli smart contracts
const baseFee = 40000 //40000 Wei
const networkConfig = {
    11155111: {
        name: "sepolia",
    },
    31337: {
        name: "hardhat",
    }
}

module.exports = {
    networkConfig, baseFee
}