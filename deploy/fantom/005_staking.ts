import {constants} from 'ethers';
import {network} from 'hardhat';
import {DeployFunction} from 'hardhat-deploy/dist/types';

const func: DeployFunction = async ({deployments, getNamedAccounts, wellknown}) => {
  const {deploy, get, execute} = deployments;
  const {deployer} = await getNamedAccounts();

  console.log('> deployer', deployer);
  console.log('> Network name:' + network.name);
  console.log('> wellknow:' + JSON.stringify(wellknown));
  console.log((wellknown as any)[network.name].addresses);

  const weth = {address: (wellknown as any)[network.name].addresses.weth};

  const farm = await get('SolidusChef');
  const fsm = await get('FSM');
  const reserve = await get('FsmReserve');
  const wethUtils = await get('WethUtils');

  const staking = await deploy('SolidusStaking', {
    from: deployer,
    log: true,
    args: [fsm.address, reserve.address, [farm.address]],
    libraries: {
      WethUtils: wethUtils.address,
    },
  });

  await execute('SolidusChef', {from: deployer, log: true}, 'setRewardMinter', staking.address);

  const treasury = await deploy('SolidusTreasury', {
    from: deployer,
    log: true,
    args: [staking.address],
  });

  await execute(
    'SolidusStaking',
    {from: deployer, log: true},
    'addReward',
    weth.address,
    treasury.address
  );
};

func.tags = ['staking'];

func.skip = async ({network}) => {
  return network.name !== 'fantom';
};

export default func;
