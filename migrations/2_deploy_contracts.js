var ProgrammablePayment = artifacts.require("./ProgrammablePayment.sol");

module.exports = function(deployer) {
  deployer.deploy(ProgrammablePayment);
};
