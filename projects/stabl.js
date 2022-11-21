const sdk = require("@defillama/sdk");
const { getBlock } = require('./helper/getBlock')

const vaults = {
    polygon: "0xd1bb7d35db39954d43e16f65f09dd0766a772cff",
}

const assets = {
    polygon: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", //USDC
}

const abi = {
    "inputs": [],
    "name": "checkBalance",
    "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
    ],
    "stateMutability": "view",
    "type": "function"
}

module.exports = {};

Object.keys(vaults).forEach(chain => {
  module.exports[chain] = {
    tvl: async (_, _b, cb) => {
        const block = await getBlock(_, chain, cb)
        //console.log(_ ,chain, block)
        const { output } = await sdk.api.abi.call({ chain, block, abi, target: vaults[chain]})
        return {
            [`${chain}:${assets[chain]}`]: output
        }
    }
  }
})
