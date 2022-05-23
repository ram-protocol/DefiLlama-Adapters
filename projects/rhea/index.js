const sdk = require("@defillama/sdk");

const KDAI_RHEA_LP = "0x0b8ac02bf51e1c3a809f8f773dd44025c31c4467";
const KDAI = "0x5c74070fdea071359b86082bd9f9b3deaafbe32b";
const TREASURY = "0x32F71263CF373d726f4e45286Bbb6935d553E8D0";
const RHEA = "0x0758fb651282581f86316514e8f5021493e9ed83";
const STAKING_ADDR = "0xee0f2e95e69d4246f8267be6d0f2610ce75d993c";

const chain = 'klaytn'
let balanceResolve

function getTvlPromise(key) {
  return async (ts, _block, chainBlocks) => {
    if (!balanceResolve)
      balanceResolve = getTvl(ts, _block, chainBlocks)
    return (await balanceResolve)[key]
  }
}
async function getTvl(timestamp, ethBlock, chainBlocks) {
  const block = chainBlocks[chain]

  const balances = {
    staking: {},
    tvl: {}
  }

  const [
    lpBalance,
    kdaiBalance,
    lpKdaiBalance,
    lpRheaBalance,
    stakingRheaBalance,
    lpSupply,
  ] = await Promise.all([
    sdk.api.erc20.balanceOf({ target: KDAI_RHEA_LP, owner: TREASURY, block, chain }),
    sdk.api.erc20.balanceOf({ target: KDAI, owner: TREASURY, block, chain }),
    sdk.api.erc20.balanceOf({ target: KDAI, owner: KDAI_RHEA_LP, block, chain }),
    sdk.api.erc20.balanceOf({ target: RHEA, owner: KDAI_RHEA_LP, block, chain }),
    sdk.api.erc20.balanceOf({ target: RHEA, owner: STAKING_ADDR, block, chain }),
    sdk.api.erc20.totalSupply({ target: KDAI_RHEA_LP, block, chain }),
  ]).then(all => all.map(i => i.output))

  const rheaPrice = lpKdaiBalance / lpRheaBalance
  const staking = stakingRheaBalance * rheaPrice / 10 ** 18

  const tvl = (kdaiBalance / 1e18) + ((lpBalance / lpSupply) * (lpKdaiBalance * 2 / 1e18))
  sdk.util.sumSingleBalance(balances.tvl, 'tether', tvl)
  sdk.util.sumSingleBalance(balances.staking, 'tether', staking)

  return balances
};

module.exports = {
  methodology: "Counts tokens on the treasury for tvl and staked RHEA for staking",
  misrepresentedTokens: true,
  klaytn:
    ['tvl', 'staking']
      .reduce((acc, key) => ({ ...acc, [key]: getTvlPromise(key) }), {}),
};
