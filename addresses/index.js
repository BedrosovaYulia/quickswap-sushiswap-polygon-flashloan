const sushiMainnet = require('./sushi-polygon.json');
const uniswapMainnet = require('./quick-polygon.json');
const tokensMainnet = require('./tokens-polygon.json');

module.exports = {
  mainnet: {
    sushi: sushiMainnet,
    quick: uniswapMainnet,
    tokens: tokensMainnet
  }
};
