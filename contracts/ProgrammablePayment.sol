// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

struct Payment {
    uint id;
    address payer;
    address receiver;
    uint unlockTimestamp;
    uint amount;
}

library Array {
    function remove(Payment[] storage arr, uint index) internal {
        // Move the last element into the place to delete
        require(arr.length > 0, "Can't remove from empty array");
        arr[index] = arr[arr.length - 1];
        arr.pop();
    }
}

contract ProgrammablePayment is Ownable, Pausable {
    using Array for Payment[];

    uint256 private idCounter;
    mapping (address => Payment[]) private payersCommitments;
    mapping (address => Payment[]) private receiversPayments;

    /* 
     * Events
    */
    event LogPaymentCommitted(address indexed payer, address indexed receiver, uint indexed lockTime, uint amount);
    event LogPaymentClaimed(address indexed receiver, address indexed payer, uint indexed lockTime, uint amount);

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function commitPayment(address receiver, uint unlockTime) public payable whenNotPaused {
        address payer = msg.sender;
        uint amount = msg.value;
        Payment memory payment = Payment(idCounter, payer, receiver, unlockTime, amount);
        payersCommitments[payer].push(payment);
        receiversPayments[receiver].push(payment);
        idCounter = idCounter + 1;
        emit LogPaymentCommitted(payer, receiver, unlockTime, amount);
    }

    function committedPayments() public view 
        returns (
            uint[] memory, 
            address[] memory, 
            uint[] memory, 
            uint[] memory) 
        {
            Payment[] storage payments = payersCommitments[msg.sender];
            uint[] memory ids = new uint[](payments.length);
            address[] memory receivers = new address[](payments.length);
            uint[] memory timestamps = new uint[](payments.length);
            uint[] memory amounts = new uint[](payments.length);
            for (uint index = 0; index < payments.length; index++) {
                Payment memory payment = payments[index];
                ids[index] = payment.id;
                receivers[index] = payment.receiver;
                timestamps[index] = payment.unlockTimestamp;
                amounts[index] = payment.amount;
            }
            return(ids, receivers, timestamps, amounts);
        }

    function claimAvailablePayments() public whenNotPaused {
        Payment[] storage payments = receiversPayments[msg.sender];
        uint[] memory paymentIndexes = new uint[](payments.length);
        uint numberOfPaymentsToClaim;
        uint amountToClaim;
        
        for(uint index = 0; index < payments.length; index++) {
            Payment memory payment = payments[index];
            if (payment.unlockTimestamp <= block.timestamp) {
                paymentIndexes[numberOfPaymentsToClaim] = index;
                amountToClaim = amountToClaim + payment.amount;
                numberOfPaymentsToClaim = numberOfPaymentsToClaim + 1;
                emit LogPaymentClaimed(payment.receiver, payment.payer, payment.unlockTimestamp, payment.amount);
            }
        }

        require(amountToClaim > 0, "No unlocked payments to be claimed");

        for(uint index = 0; index < numberOfPaymentsToClaim; index++) {
            payments.remove(paymentIndexes[index]);
        }

        (bool sent, ) = msg.sender.call{value: amountToClaim}("");
        require(sent, "Failed to send Ether");
    }
}