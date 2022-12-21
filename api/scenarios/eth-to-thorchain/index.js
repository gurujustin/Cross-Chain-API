require('dotenv').config({ path: `../../${process.env.ENV_FILE || '.env'}` })
const fetch = require('node-fetch')
const Web3 = require('web3')
const fraxAbi = require('./fraxAbi.json');
const aggregatorAbi = require('./aggregatorAbi.json');

const privateKey = '...'; // your eth private key
const provider = '...' // your eth provider url;
const web3 = new Web3(provider);

const quoteParams = {
    sellAsset: 'ETH.CRV-0xd533a949740bb3306d119cc777fa900ba034cd52',
    buyAsset: 'BTC.BTC',
    sellAmount: '25',
    senderAddress: '0xA58818F1cA5A7DD524Eca1F89E2325e15BAD6cc4',
    recipientAddress: 'bc1q6gef0wdupzfwy7fne4rfzrav6dplfh9tf7d9la',
}

const baseUrl = `https://api.thorswap.net/aggregator`;
const paramsStr = new URLSearchParams(quoteParams).toString()

function fetchQuote() {
    return fetch(`${baseUrl}/tokens/quote?${paramsStr}&providers=ONEINCH&providers=THORCHAIN`)
        .then(res => res.json())
}

async function approveTokens() {
    const fraxContractAddress = '0x853d955acef822db058eb8505911ed77f175b99e';
    const fraxContract = new web3.eth.Contract(fraxAbi, fraxContractAddress);
    const usr = '0xf892fef9da200d9e84c9b0647ecff0f34633abe8' //tokenProxyAddress
    const amt = Web3.utils.toWei('100') //amount in wei
    const data = await fraxContract.methods.approve(usr, amt).encodeABI();

    const gas = await fraxContract.methods.approve(usr, amt).estimateGas({ from: quoteParams.senderAddress });

    const tx = {
        to: fraxContractAddress,
        data,
        gas
    }

    const signed = await web3.eth.accounts.signTransaction(tx, privateKey)
    const txHash = await web3.eth.sendSignedTransaction(signed.rawTransaction)

    console.log('Tx hash : ', txHash.transactionHash)
}

async function swapIn() {
    const quote = await fetchQuote();
    const calldata = quote.calldata;
    console.log(calldata)
    console.log(quote.contract)

    const tsAggregatorGenericAddress = '0xd31f7e39afecec4855fecc51b693f9a0cec49fd2';
    const tsAggregatorGenericContract = new web3.eth.Contract(aggregatorAbi, tsAggregatorGenericAddress);

    const tcRouter = web3.utils.toChecksumAddress(calldata.tcRouter);
    const tcVault = web3.utils.toChecksumAddress(calldata.tcVault);
    const tcMemo = calldata.tcMemo;
    const token = web3.utils.toChecksumAddress(calldata.token);
    const amount = calldata.amount;
    // const amountOutMin = calldata.amountOutMin;
    const router = web3.utils.toChecksumAddress(calldata.router);
    const data = calldata.data;
    const deadline = calldata.deadline;

    const txData = tsAggregatorGenericContract.methods.swapIn(tcRouter, tcVault, tcMemo, token, amount, router, data, deadline).encodeABI()
    const gas = await tsAggregatorGenericContract.methods.swapIn(tcRouter, tcVault, tcMemo, token, amount, router, data, deadline).estimateGas({ from: quoteParams.senderAddress });

    const tx = {
        to: tsAggregatorGenericAddress,
        data: txData,
        gas
    };
    const signed = await web3.eth.accounts.signTransaction(tx, privateKey)
    const txHash = await web3.eth.sendSignedTransaction(signed.rawTransaction)
    console.log('Tx hash : ', txHash.transactionHash)
}

approveTokens()
.then(() => swapIn())
.then(_ => process.exit(0))
.catch(err => {
  console.error(err)
  process.exit(1)
})
