const ProgrammablePayment = artifacts.require("./ProgrammablePayment.sol");
const {
    BN,           // Big Number support
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    snapshot,
    time,
  } = require('@openzeppelin/test-helpers');

contract("ProgrammablePayment", accounts => {
    const [owner, payer1, payer2, receiver1, receiver2] = accounts;

    beforeEach(async() => {
        timeSnapshot = await snapshot();
    });
 
    afterEach(async() => {
        await timeSnapshot.restore();
    });

    it("Owner registered when contract is created", async () => {
        var instance = await ProgrammablePayment.new({from: owner});
        var instanceOwner = await instance.owner();
        assert.equal(instanceOwner, owner, "The contract owner was not registered during construction");
    });

    it("Ownership can be transfered", async () => {
        var instance = await ProgrammablePayment.new({from: owner});
        var txReceipt = await instance.transferOwnership(payer2, {from: owner});
        var instanceOwner = await instance.owner();
        assert.equal(instanceOwner, payer2, "The contract did not transfer the ownership correctly");
        expectEvent(txReceipt, 'OwnershipTransferred', {previousOwner: owner, newOwner: payer2});

    });

    it("Only the contract owner can pause it", async () => {
        var instance = await ProgrammablePayment.new({from: owner});

        await expectRevert(instance.pause({from: payer1}), "Ownable: caller is not the owner")
    });

    it("Only the contract owner can unpause it", async () => {
        var instance = await ProgrammablePayment.new({from: owner});
        await instance.pause({from: owner});
        await expectRevert(instance.unpause({from: payer1}), "Ownable: caller is not the owner")
    });

    it("Payer can commit one payment", async () => {
        var instance = await ProgrammablePayment.new();
        var destination = receiver1;
        var lockTimestamp = 1000;
        var paymentAmount = 5000;
        await instance.commitPayment(destination, lockTimestamp, {from: payer1, value: paymentAmount});

        var contractBalanceAfterCommit = await web3.eth.getBalance(instance.address);
        assert.equal(Number(contractBalanceAfterCommit), paymentAmount, "The contract address did not receive the founds for the payment");

        var payer1_payments_info = await instance.committedPayments({from: payer1});
        assert.lengthOf(payer1_payments_info[0], 1, "Payer 1 should have commited only 1 payment");
        var ids = payer1_payments_info[0];
        var receivers = payer1_payments_info[1];
        var timestamps = payer1_payments_info[2];
        var amounts = payer1_payments_info[3];
        assert.equal(ids[0].toNumber(), 0, "Payment id should be 0");
        assert.equal(receivers[0], destination, "Payment receivers is incorrect");
        assert.equal(timestamps[0].toNumber(), lockTimestamp, "Payment lock timestamp is incorrect");
        assert.equal(amounts[0].toNumber(), paymentAmount, "Payment amount is incorrect");
    });

    it("An event is generated when a payment is committed" , async () => {
        var instance = await ProgrammablePayment.new();
        var lockTimestamp = 1000;
        var paymentAmount = 5000;
        var txReceipt = await instance.commitPayment(receiver1, lockTimestamp, {from: payer1, value: paymentAmount});

        expectEvent(txReceipt, 'LogPaymentCommitted', { payer: payer1, receiver: receiver1, lockTime: new BN(1000), amount: new BN(5000)});
    });

    it("Can't commit a payment when the contract is paused", async () => {
        var instance = await ProgrammablePayment.new({from: owner});
        var destination = receiver1;
        var lockTimestamp = 1000;
        var paymentAmount = 5000;
        await instance.pause({from: owner});
        
        await expectRevert(
            instance.commitPayment(destination, lockTimestamp, {from: payer1, value: paymentAmount}),
            "Pausable: paused");
    })

    it("Receiver can claim unlocked payment", async () => {
        var currentTime = await time.latest();
        var instance = await ProgrammablePayment.new();
        var destination = receiver1;
        var lockTimestamp = currentTime.add(time.duration.days(1));
        var paymentAmount = 1000000;
        await instance.commitPayment(destination, lockTimestamp, {from: payer1, value: paymentAmount});
        
        await time.increase(time.duration.days(2));

        var initialBalance = await web3.eth.getBalance(receiver1);
        var txInfo = await instance.claimAvailablePayments({from: receiver1});
        var tx = await web3.eth.getTransaction(txInfo.tx);
        var gasCost = tx.gasPrice * txInfo.receipt.gasUsed;
        var newBalance = await web3.eth.getBalance(receiver1);
        assert.equal(newBalance, initialBalance - gasCost + paymentAmount, "Account receiver1 should have received the amount of the claimed payment");

    });

    it("Receiver can't claim locked payment", async () => {
        var currentTime = await time.latest();
        var instance = await ProgrammablePayment.new();
        var destination = receiver1;
        var lockTimestamp = currentTime.add(time.duration.days(3));
        var paymentAmount = 1000000;
        
        await instance.commitPayment(destination, lockTimestamp, {from: payer1, value: paymentAmount});
        
        await expectRevert(
            instance.claimAvailablePayments({from: receiver1}),
            "No unlocked payments to be claimed");
        var finalContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(Number(finalContractBalance), paymentAmount, "The founds did not remain in the contract after the failed payment claim");

    });

    it("Receiver can't claim unlocked twice", async () => {
        var currentTime = await time.latest();
        var instance = await ProgrammablePayment.new();
        var destination = receiver1;
        var lockTimestamp = currentTime.add(time.duration.days(1));
        var paymentAmount = 1000000;
        var second_paymentAmount = 2000000;
        await instance.commitPayment(destination, lockTimestamp, {from: payer1, value: paymentAmount});
        await instance.commitPayment(receiver2, lockTimestamp, {from: payer1, value: second_paymentAmount});
        
        await time.increase(time.duration.days(2));

        await instance.claimAvailablePayments({from: receiver1});
        await expectRevert(
            instance.claimAvailablePayments({from: receiver1}),
            "No unlocked payments to be claimed");
        var finalContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(Number(finalContractBalance), second_paymentAmount, "The founds did not remain in the contract after the failed payment claim");
    });

    it("Receiver can't claim a payment if the contract is paused", async () => {
        var currentTime = await time.latest();
        var instance = await ProgrammablePayment.new({from: owner});
        var destination = receiver1;
        var lockTimestamp = currentTime.add(time.duration.days(1));
        var paymentAmount = 1000000;
        await instance.commitPayment(destination, lockTimestamp, {from: payer1, value: paymentAmount});
        await instance.pause({from: owner});
        await time.increase(time.duration.days(2));

        await expectRevert(instance.claimAvailablePayments({from: receiver1}), "Pausable: paused");
        
    });
    
    it("An event is logged when a payment is claimed", async () => {
        var currentTime = await time.latest();
        var instance = await ProgrammablePayment.new();
        var destination = receiver1;
        var lockTimestamp = currentTime.add(time.duration.days(1));
        var paymentAmount = 1000000;
        await instance.commitPayment(destination, lockTimestamp, {from: payer1, value: paymentAmount});
        
        await time.increase(time.duration.days(2));

        var txReceipt = await instance.claimAvailablePayments({from: receiver1});
        expectEvent(txReceipt, 'LogPaymentClaimed', { receiver: receiver1, payer: payer1, lockTime: lockTimestamp, amount: new BN(paymentAmount)});
        
    });
});

// https://medium.com/sablier/writing-accurate-time-dependent-truffle-tests-8febc827acb5
// https://medium.com/fluidity/standing-the-time-of-test-b906fcc374a9