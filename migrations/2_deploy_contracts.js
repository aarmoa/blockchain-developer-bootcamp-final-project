const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const ProgrammablePayment = artifacts.require("./ProgrammablePayment.sol");

module.exports = async function(deployer) {
  const instance = await deployProxy(ProgrammablePayment, [], { deployer, kind: 'uups' });
  console.log('Deployed ', instance.address);
};
