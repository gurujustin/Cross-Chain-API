require('dotenv').config({ path: `../../${process.env.ENV_FILE || '.env'}` })
const fetch = require('node-fetch')
const Web3 = require('web3')
const fraxAbi = require('./frax.json');

const provider = '...'; // your eth provider url
const privateKey = '...' // your eth private key
const myWallet = '0xA58818F1cA5A7DD524Eca1F89E2325e15BAD6cc4' // your wallet

const web3 = new Web3(provider);



async function approveSpendFrax() {
    const fraxAddress = '0x853d955acef822db058eb8505911ed77f175b99e';
    const FraxContract = new web3.eth.Contract(
        fraxAbi,
        fraxAddress
    )
    
    const amt = web3.utils.toWei('100') // allow Uniswap to transfer at most 100 tokens
    const usr = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'; // UniswapV3 router address
    const data = await FraxContract.methods
        .approve(usr, amt)
        .encodeABI()

    const gas = await FraxContract.methods
        .approve(usr, amt)
        .estimateGas({ from: myWallet })

    var tx = {
        to: fraxAddress,
        data,
        gas
    }

    const signed = await web3.eth.accounts.signTransaction(tx, privateKey)
    const txHash = await web3.eth.sendSignedTransaction(signed.rawTransaction)

    console.log('Tx hash : ', txHash.transactionHash)
}



const quoteParams = {
    sellAsset: 'ETH.FRAX-0x853d955acef822db058eb8505911ed77f175b99e',
    buyAsset: 'ETH.DAI-0x6b175474e89094c44da98b954eedeac495271d0f',
    sellAmount: '40',
    senderAddress: '0xA58818F1cA5A7DD524Eca1F89E2325e15BAD6cc4',
    recipientAddress: '0xA58818F1cA5A7DD524Eca1F89E2325e15BAD6cc4',
    providers: 'ONEINCH',
}

const baseUrl = `https://api.thorswap.net/aggregator`;
const paramsStr = new URLSearchParams(quoteParams).toString();

async function fetchQuote() {
    const res = await fetch(`${baseUrl}/tokens/quote?${paramsStr}`)
    console.log(res)
    const json = await res.json();
    return json
}

async function swapEthToEth() {
    const quoteRes = await fetchQuote()
    const transaction = quoteRes.transaction;

    const gas = await web3.eth.estimateGas({...transaction})

    var tx = {
        ...transaction,
        gas,
    }

    const signed = await web3.eth.accounts.signTransaction(tx, privateKey)
    const txHash = await web3.eth.sendSignedTransaction(signed.rawTransaction)

    console.log('Tx hash : ', txHash.transactionHash)
}

approveSpendFrax()
.then(_ => swapEthToEth())
.then(_ => process.exit(0))
.catch(err => {
  console.error(err)
  process.exit(1)
})
