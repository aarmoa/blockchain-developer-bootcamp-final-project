const { deployProxy, upgradeProxy} = require('@openzeppelin/truffle-upgrades');

 
// Load compiled artifacts
const ProgrammablePayment = artifacts.require("./ProgrammablePayment.sol");

// Start test block
contract("ProgrammablePayment (proxy)", accounts => {
    const [owner] = accounts;

    // beforeEach(async function () {
    //     // Deploy a new Box contract for each test
    //     this.box = await deployProxy(Box, [42], {initializer: 'store'});
    //     this.boxV2 = await upgradeProxy(this.box.address, BoxV2);
    // });
 
    // Test case
    it("Contract should be deployed as updatable", async function () {
        const instance = await deployProxy(ProgrammablePayment, [], {kind: "uups"});
        const instanceOwner = await instance.owner();
        assert.equal(instanceOwner, owner, "The contract owner was not correctly registered");
    });
});