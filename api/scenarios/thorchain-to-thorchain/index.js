const fetch = require('node-fetch')
const { Client, getChainIds, getDefaultClientUrl } = require('@xchainjs/xchain-thorchain')
const { Network } = require('@xchainjs/xchain-client')
const { assetFromString, assetAmount, formatBaseAmount } = require('@xchainjs/xchain-util')

const phrase = '...' // your mnemonic phrase

const quoteParams = {
    sellAsset: 'ETH.ETH',
    buyAsset: 'AVAX.AVAX',
    sellAmount: '0.01',
    senderAddress: '0xA4666F45d75EFd1A3ACD8A393603bEd1c2f6fF01',
    recipientAddress: '0x4a66426499f3e0A1EA2936FA3ABf49EB8846BF1c',
    providers: 'THORCHAIN'
}

const baseUrl = `https://api.thorswap.net/aggregator`;
const paramsStr = new URLSearchParams(quoteParams).toString();

function fetchQuote() {
  return fetch(`${baseUrl}/tokens/quote?${paramsStr}`)
      .then(res => res.json())
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