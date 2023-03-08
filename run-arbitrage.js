require("dotenv").config()
const Web3 = require('web3');

const abis = require('./abis');
const { mainnet: addresses } = require('./addresses');
//const Flashloan = require('./build/contracts/Flashloan.json');

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
);
//const { address: admin } = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);

var opts = require('optimist').string('tokenA').string('tokenB').argv;
const tokenA=opts.tokenA;
const tokenB=opts.tokenB;


const quick = new web3.eth.Contract(
  abis.uniswap.uniswap,
  addresses.quick.router
)

const sushi = new web3.eth.Contract(
  abis.sushi.sushi,
  addresses.sushi.router
)

const ONE_WEI = web3.utils.toBN(web3.utils.toWei('1'));
const AMOUNT_IN_WEI = web3.utils.toBN(web3.utils.toWei('1'));
/*const DIRECTION = {
  SUSHI_TO_UNISWAP: 0,
  QUICK_TO_SUSHI: 1
};*/

const init = async () => {
  const networkId = await web3.eth.net.getId();

  /*let ethPrice;
  const updateEthPrice = async () => {
    const results = await quick.methods.getAmountsOut(web3.utils.toWei('1'), [addresses.tokens.weth, addresses.tokens.link]).call();   //dai to wbnb pancakeswap
    ethPrice = web3.utils.toBN('1').mul(web3.utils.toBN(results[1])).div(ONE_WEI);
  }
  await updateEthPrice();
  setInterval(updateEthPrice, 15000);*/

  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
      console.log(`New block received. Block # ${block.number}`);

      try {

        const amountsOut1 = await sushi.methods.getAmountsOut(AMOUNT_IN_WEI, [tokenA, tokenB]).call();   //dai to wbnb pancakeswap
        const amountsOut2 = await quick.methods.getAmountsOut(amountsOut1[1], [tokenB, tokenA]).call();    //wbnb to dai bakeryswap
        const amountsOut3 = await quick.methods.getAmountsOut(AMOUNT_IN_WEI, [tokenA, tokenB]).call();    // dai to Wbnb baketswap
        const amountsOut4 = await sushi.methods.getAmountsOut(amountsOut3[1], [tokenB, tokenA]).call();   // Wbnb to dai pancakeswap



        console.log(`Sushi -> Quick. input / output: ${web3.utils.fromWei(AMOUNT_IN_WEI.toString())} / ${web3.utils.fromWei(amountsOut2[1].toString())}`);
        console.log(`Quick -> Sushi. input / output: ${web3.utils.fromWei(AMOUNT_IN_WEI.toString())} / ${web3.utils.fromWei(amountsOut4[1].toString())}`);

        const resultFromQuick = web3.utils.toBN(amountsOut2[1])
        const resultFromSushi = web3.utils.toBN(amountsOut2[1])


        if (resultFromQuick.gt(AMOUNT_IN_WEI)) {
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
          const profit = resultFromQuick.sub(AMOUNT_IN_WEI).sub(txCost);

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

        if (resultFromSushi.gt(AMOUNT_IN_WEI)) {
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
          const profit = resultFromSushi.sub(AMOUNT_IN_WEI).sub(txCost);

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
