// const fetch = require('node-fetch')
// const { Client, getChainIds, getDefaultClientUrl } = require('@xchainjs/xchain-thorchain')
// const { Network } = require('@xchainjs/xchain-client')
// const { assetFromString, assetAmount, formatBaseAmount } = require('@xchainjs/xchain-util')
import CrossChainAPI from '@thorswap/cross-chain-api-sdk';

const phrase = '...' // your mnemonic phrase

const quoteParams = {
    sellAsset: 'ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044',
    buyAsset: 'BTC.BTC',
    sellAmount: '100',
    senderAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    recipientAddress: 'bc1qcalsdh8v03f5xztc04gzqlkqhx2y07dakv7f5c'
}

const api = new CrossChainAPI({ environment: Environment.Dev })

function fetchQuote() {
    return api.quote({
        sellAsset: quoteParams.sellAsset,
        buyAsset: quoteParams.buyAsset,
        sellAmount: quoteParams.sellAmount,
        senderAddress: quoteParams.senderAddress,
        recipientAddress: quoteParams.recipientAddress,
    })
}

let client;
 // Init TC client
 async function connect() {
    const chainIds = await getChainIds(getDefaultClientUrl())
    client = new Client({
      network: Network.Mainnet,
      phrase,
      chainIds
    })
    return true
  }

  async function executeTxn() {
    const quote = await fetchQuote();
    const calldata = quote.calldata;

    const fromAsset = assetFromString(quoteParams.sellAsset);
    const toAsset = assetFromString(quoteParams.buyAsset);
    if (fromAsset == null) throw new Error(`Invalid asset ${fromAsset}`)
    if (toAsset == null) throw new Error(`Invalid asset ${toAsset}`)

    const amount = assetAmount(calldata.amountIn)
    const memo = calldata.memo
    
    console.log(`=== Sending transaction ===`)
    console.log(`Memo: ${memo}`)
    console.log(`Amount: ${formatBaseAmount(amount)}`)

    const hash = await client.deposit({
      walletIndex: 0,
      amount,
      asset: fromAsset,
      memo
    })

    console.log(`Transaction hash: https://viewblock.io/thorchain/tx/${hash}`)
  }

  connect()
  .then(_ => executeTxn())
  .then(_ => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })