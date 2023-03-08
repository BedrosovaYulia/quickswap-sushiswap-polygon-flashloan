require("dotenv").config()
const Web3 = require('web3');

const abis = require('./abis');
const { mainnet: addresses } = require('./addresses');
//const Flashloan = require('./build/contracts/Flashloan.json');

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
);
//const { address: admin } = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);

var opts = require('optimist').string('tokenA').string('tokenB').string('router1').string('router2').argv;
console.log(opts);

const r1address=opts.router1;
const r2address=opts.router2;
const tokenA=opts.tokenA;
const tokenB=opts.tokenB;


const router1 = new web3.eth.Contract(
  abis.uniswap.uniswap,
  r1address
)

const router2 = new web3.eth.Contract(
  abis.uniswap.uniswap,
  r2address
)

const ONE_WEI = web3.utils.toBN(web3.utils.toWei('1'));
const AMOUNT_IN_WEI = web3.utils.toBN(web3.utils.toWei('1'));


const init = async () => {
  const networkId = await web3.eth.net.getId();

  /*let ethPrice;
  const updateEthPrice = async () => {
    const results = await router1.methods.getAmountsOut(web3.utils.toWei('1'), [addresses.tokens.weth, addresses.tokens.link]).call();   //dai to wbnb pancakeswap
    ethPrice = web3.utils.toBN('1').mul(web3.utils.toBN(results[1])).div(ONE_WEI);
  }
  await updateEthPrice();
  setInterval(updateEthPrice, 15000);*/

  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
      console.log(`New block received. Block # ${block.number}`);

      try {

        const amountsOut1 = await router1.methods.getAmountsOut(AMOUNT_IN_WEI, [tokenA, tokenB]).call();   
        const amountsOut2 = await router2.methods.getAmountsOut(amountsOut1[1], [tokenB, tokenA]).call();  
        
        const amountsOut3 = await router2.methods.getAmountsOut(AMOUNT_IN_WEI, [tokenA, tokenB]).call();  
        const amountsOut4 = await router1.methods.getAmountsOut(amountsOut3[1], [tokenB, tokenA]).call(); 

        console.log(`router1 -> router2. input / output: ${web3.utils.fromWei(AMOUNT_IN_WEI.toString())} / ${web3.utils.fromWei(amountsOut2[1].toString())}`);
        console.log(`router2 -> router1. input / output: ${web3.utils.fromWei(AMOUNT_IN_WEI.toString())} / ${web3.utils.fromWei(amountsOut4[1].toString())}`);

        const resultFromRouter2 = web3.utils.toBN(amountsOut2[1])
        const resultFromRouter1 = web3.utils.toBN(amountsOut4[1])


        if (resultFromRouter2.gt(AMOUNT_IN_WEI)) {
          /*const tx = flashloan.methods.initiateFlashloan(
            addresses.dydx.solo, 
            addresses.tokens.dai, 
            AMOUNT_IN_WEI,
            DIRECTION.SUSHI_TO_UNISWAP
          );*/
          const [gasPrice, gasCost] = await Promise.all([
            web3.eth.getGasPrice(),
            tx.estimateGas({ from: admin }),
          ]);

          const txCost = web3.utils.toBN(gasCost).mul(web3.utils.toBN(gasPrice)).mul(ethPrice);
          const profit = resultFromRouter2.sub(AMOUNT_IN_WEI).sub(txCost);

          console.log(profit);

          if (profit > 0) {
            console.log('Arb opportunity found Sushi -> Quick!');
            console.log(`Expected profit: ${web3.utils.fromWei(profit)}`);
            /*const data = tx.encodeABI();
            const txData = {
              from: admin,
              to: flashloan.options.address,
              data,
              gas: gasCost,
              gasPrice
            };
            const receipt = await web3.eth.sendTransaction(txData);
            console.log(`Transaction hash: ${receipt.transactionHash}`);*/
          }
        }

        if (resultFromRouter1.gt(AMOUNT_IN_WEI)) {
          /*const tx = flashloan.methods.initiateFlashloan(
            addresses.dydx.solo, 
            addresses.tokens.dai, 
            AMOUNT_IN_WEI,
            DIRECTION.UNISWAP_TO_SUSHI
          );*/
          const [gasPrice, gasCost] = await Promise.all([
            web3.eth.getGasPrice(),
            tx.estimateGas({ from: admin }),
          ]);
          const txCost = web3.utils.toBN(gasCost).mul(web3.utils.toBN(gasPrice)).mul(ethPrice);
          const profit = resultFromRouter1.sub(AMOUNT_IN_WEI).sub(txCost);

          console.log(profit);
          if (profit > 0) {
            console.log('Arb opportunity found Quick -> Sushi!');
            console.log(`Expected profit: ${web3.utils.fromWei(profit)}`);
            /*const data = tx.encodeABI();
            const txData = {
              from: admin,
              to: flashloan.options.address,
              data,
              gas: gasCost,
              gasPrice
            };
            const receipt = await web3.eth.sendTransaction(txData);
            console.log(`Transaction hash: ${receipt.transactionHash}`);*/
          }
        }
      }
      catch (e) {
        console.log('some error');

      }
    })
    .on('error', error => {
      console.log(error);
    });
}
init();
