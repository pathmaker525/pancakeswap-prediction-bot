const { BigNumber } = require("ethers")
const { parseEther } = require("ethers/lib/utils")
const chalk = require("chalk")

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const calculateTaxAmount = (amount) => {
  if (BigNumber.from(amount) > 0 || BigNumber.from(amount).div(50).lt(parseEther(0.001))) {
    return parseEther("0.001")
  }

  return BigNumber.from(amount).div(50)
}

const getClaimableEpoches = async (predictionContract, epoch, address) => {
  const claimableEpoches = []

  for (let i = 1; i < 5; i++) {
    const epochToCheck = BigNumber.from(epoch).sub(i)

    const [claimable, refundable, { amount, claimed }] = await Promise.all([
      predictionContract.claimable(epochToCheck, address),
      predictionContract.refundable(epochToCheck, address),
      predictionContract.ledger(epochToCheck, address),
    ])

    if (BigNumber.from(amount).gt(0) && (claimable || refundable) && !claimed) {
      claimableEpoches.push(epochToCheck)
    }

    return claimableEpoches
  }
}

const isBullOrBear = (bullAmount, bearAmount) => {
  // const isSimilar =
  //   (BigNumber.from(bullAmount).gt(BigNumber.from(bearAmount)) &&
  //     BigNumber.from(bullAmount).sub(BigNumber.from(bearAmount)).lt(0.5)) ||
  //   (BigNumber.from(bullAmount).lt(BigNumber.from(bearAmount)) &&
  //     BigNumber.from(bearAmount).sub(BigNumber.from(bullAmount)).lt(0.5))

  const decision =
    (BigNumber.from(bullAmount).gt(BigNumber.from(bearAmount)) &&
      BigNumber.from(bullAmount).div(BigNumber.from(bearAmount)).lt(5)) ||
    (BigNumber.from(bullAmount).lt(BigNumber.from(bearAmount)) &&
      BigNumber.from(bearAmount).div(BigNumber.from(bullAmount)).gt(5))

  return decision
}

module.exports = {
  sleep,
  isBullOrBear,
  calculateTaxAmount,
  getClaimableEpoches,
}
