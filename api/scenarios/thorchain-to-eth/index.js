require('dotenv').config({ path: `../../${process.env.ENV_FILE || '.env'}` })
const { Client, getChainIds, getDefaultClientUrl } = require('@xchainjs/xchain-thorchain')
const { Network } = require('@xchainjs/xchain-client')
const { assetFromString, assetAmount } = require('@xchainjs/xchain-util');
const fetch = require('node-fetch')

const phrase = '...' // your mnemonic phrase

const quoteParams = {
    sellAsset: 'THOR.RUNE',
    buyAsset: 'ETH.ETH',
    sellAmount: '35',
    senderAddress: 'thor15knytkmnqxz7jq0aup2v4k99cx6y4luurg0uwr',
    recipientAddress: '0xA58818F1cA5A7DD524Eca1F89E2325e15BAD6cc4'
}

const baseUrl = `https://api.thorswap.net/aggregator`;
const paramsStr = new URLSearchParams(quoteParams).toString();

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

function fetchQuote() {
    return fetch(`${baseUrl}/tokens/quote?${paramsStr}`)
        .then(res => res.json())
}

async function swapOut() {
    const quote = await fetchQuote();

    const { fromAsset, amountIn, memo } = quote.calldata;
    const asset = assetFromString(fromAsset);
    const amount = assetAmount(amountIn);

    if (asset === null) {
        throw new Error('Asset not recognized');
    }

    const txHash = await client.deposit({
        walletIndex: 0,
        amount,
        asset,
        memo
    })

    console.log(`Transaction hash: https://viewblock.io/thorchain/tx/${txHash}`)
}

connect()
.then(swapOut)
.then(_ => process.exit(0))
.catch(err => {
  console.error(err)
  process.exit(1)
})
