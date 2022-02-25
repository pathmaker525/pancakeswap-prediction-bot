require("dotenv").config()
const CGPredictionV3Abi = require("./abis/CandleGeniePredictionV3.json")
const PCSPredictionV2Abi = require("./abis/PancakePredictionV2.json")

const ADDRESSES = {
  PCSPV2: {
    ADDRESS: "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA",
    EXPLORER_URL: "https://bscscan.com/address/0x18b2a687610328590bc8f2e5fedde3b582a49cda",
  },
  CGPV3: {
    ADDRESS: "0x995294CdBfBf7784060BD3Bec05CE38a5F94A0C5",
    EXPLORER_URL: "https://bscscan.com/address/0x995294CdBfBf7784060BD3Bec05CE38a5F94A0C5",
  },
}

const CUSTOM_SETTING = {
  RPC_URL: "https://bsc-dataseed.binance.org/", // Default RPC URL
  // RPC_URL: "https://data-seed-prebsc-1-s1.binance.org:8545/", // Default RPC URL
  BET_AMOUNT: "0.01", // in BNB
  PREPARATION_TIME: 5, // Waiting for 270sec = 4min 30sec
  PRIVATE_KEY: process.env.PRIVATE_KEY, // Wallet private key
  GAS_PRICE: "10",
  GAS_LIMIT: "12",
}

module.exports = { CGPredictionV3Abi, PCSPredictionV2Abi, ADDRESSES, CUSTOM_SETTING }
