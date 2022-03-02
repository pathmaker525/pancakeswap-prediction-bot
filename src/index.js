const { Wallet, providers, Contract } = require("ethers")
const { formatEther, parseEther, parseUnits } = require("ethers/lib/utils")
const chalk = require("chalk")

const {
  sleep,
  isBullOrBear,
  calculateTaxAmount,
  reduceOnHoldTimeByOneBlock,
  getClaimableEpoches,
} = require("./utils/index")
const { ADDRESSES, PCSPredictionV2Abi, CUSTOM_SETTING } = require("./configs/index")
const asciiArt = require("./configs/ascii-art")

const { JsonRpcProvider } = providers

console.clear()
console.log(chalk.green(asciiArt))

if (CUSTOM_SETTING.PRIVATE_KEY === "") {
  console.log(
    chalk.red(`
      Can not find your private key in .env file. Enter the private key and start program again!`)
  )

  process.exit(0)
}

const enableBet = process.argv.includes("--betting") > 0

const claimableEpoches = async (predictionContract, epoch, address) => {
  return await getClaimableEpoches(predictionContract, epoch, address)
}

const signer = new Wallet(CUSTOM_SETTING.PRIVATE_KEY, new JsonRpcProvider(CUSTOM_SETTING.RPC_URL))
const pcsPredictionContract = new Contract(ADDRESSES.PCSPV2.ADDRESS, PCSPredictionV2Abi, signer)

console.log(
  chalk.blackBright(`
    Starting...
    Betting Enabled: ${enableBet}
    Amount to Bet: ${CUSTOM_SETTING.BET_AMOUNT} BNB
    Waiting for new rounds... up to 5 min, please wait...`)
)

pcsPredictionContract.on("StartRound", async (epoch) => {
  const balance = await signer.getBalance()

  console.log(
    chalk.blue(`
    >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
      Epoch Started, ${chalk.yellow(epoch.toString())}
      Wallet Balance ${chalk.yellowBright(`${formatEther(balance)}`)}`)
  )

  const { lockTimestamp } = await pcsPredictionContract.rounds(epoch) // Get epoch start time
  const currentTime = new Date().toUTCString() // Get current UTC time
  const utcTime = new Date(currentTime).getTime() / 1000 // Get current UTC timestamp second

  const PREPARATION_TIME = CUSTOM_SETTING.PREPARATION_TIME
  const ON_HOLD_TIME = lockTimestamp - utcTime - PREPARATION_TIME
  console.log(
    chalk.white.blackBright(`
      Bot is waiting for ${parseInt(ON_HOLD_TIME / 60)} min ${ON_HOLD_TIME % 60} sec`)
  )

  await sleep(ON_HOLD_TIME * 1000)

  console.log(
    chalk.blackBright(`
      Getting amounts...`)
  )
  const { bullAmount, bearAmount } = await pcsPredictionContract.rounds(epoch)

  console.log(
    chalk.blue(`
      Bull Amount: ${formatEther(bullAmount)} BNB
      Bear Amount: ${formatEther(bearAmount)} BNB`)
  )

  const decision = isBullOrBear(bullAmount, bearAmount)

  // if (isSimilar) {
  //   console.log(
  //     chalk.redBright(`
  //     >>> Skip current Epoch`)
  //   )

  //   return
  // }

  console.log(
    chalk.blue(`
      Betting on ${decision === true ? chalk.red("Bear Bet") : chalk.green("Bull Bet")}`)
  )

  if (enableBet) {
    if (decision === true) {
      try {
        console.log(
          chalk.whiteBright(`
            ${chalk.red("Bear Bet")} transaction Preparing!`)
        )

        const tx = await pcsPredictionContract.betBear(epoch, {
          value: parseEther(CUSTOM_SETTING.BET_AMOUNT),
        })

        console.log(
          chalk.whiteBright(`
            ${chalk.red("Bear Bet")} transaction Submitted!`)
        )

        await tx.wait()

        console.log(
          chalk.blue(`
            ${chalk.red("Bear Bet")} transaction Success!`)
        )
      } catch (error) {
        console.error(
          chalk.red(`
            ${chalk.red("Bear Bet")} transaction failed
            Reason: ${error.body ? error.body.message : error.message}`)
        )

        CUSTOM_SETTING.ON_HOLD_TIME = reduceOnHoldTimeByOneBlock(CUSTOM_SETTING.ON_HOLD_TIME)
      }
    } else {
      try {
        console.log(
          chalk.whiteBright(`
            ${chalk.green("Bull Bet")} transaction Preparing!`)
        )

        const tx = await pcsPredictionContract.betBull(epoch, {
          value: parseEther(CUSTOM_SETTING.BET_AMOUNT),
        })

        console.log(
          chalk.whiteBright(`
            ${chalk.green("Bull Bet")} transaction Submitted!`)
        )

        await tx.wait()

        console.log(
          chalk.blue(`
            ${chalk.green("Bull Bet")} transaction Success!`)
        )
      } catch (error) {
        console.error(
          chalk.red(`
            ${chalk.green("Bull Bet")} transaction failed
            Reason: ${error.body ? error.body.message : error.message}`)
        )

        CUSTOM_SETTING.ON_HOLD_TIME = reduceOnHoldTimeByOneBlock(CUSTOM_SETTING.ON_HOLD_TIME)
      }
    }
  }

  // const claimables = await claimableEpoches(pcsPredictionContract, epoch, signer.address)
  // if (claimables.length > 0) {
  //   try {
  //     console.log(
  //       chalk.blue(`
  //         Claim transaction preparing`)
  //     )

  //     const tx = await pcsPredictionContract.claim(claimables)

  //     console.log(
  //       chalk.blue(`
  //         Claim transaction submitted`)
  //     )

  //     await tx.wait()
  //     console.log(
  //       chalk.green(`
  //         Reward Claimed`)
  //     )
  //   } catch (error) {
  //     console.error(
  //       chalk.red(`
  //         Claim transaction failed
  //         Reason: ${error}`)
  //     )
  //   }
  // }
})
