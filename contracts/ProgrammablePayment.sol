// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

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

contract ProgrammablePayment is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    using Array for Payment[];

    uint256 private idCounter;
    mapping (address => Payment[]) private payersCommitments;
    mapping (address => Payment[]) private receiversPayments;

    function initialize() initializer public {
        __UUPSUpgradeable_init();
        __Ownable_init();
        __Pausable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    /* 
     * Events
    */
    event LogPaymentCommitted(address indexed payer, address indexed receiver, uint indexed lockTime, uint amount);
    event LogPaymentClaimed(address indexed receiver, address indexed payer, uint indexed lockTime, uint amount);
    event LogPaymentCancelled(address indexed payer, address indexed receiver, uint indexed lockTime, uint amount);

    /*
    * Modifiers
    */
    modifier checkReceiverNotPayer(address _receiver) {
        require (msg.sender != _receiver, "The payer address cannot be the receiving address");
        _;
    }

    modifier checkCancellationTime(uint _unlockTimestamp) {
        require (_unlockTimestamp - 1 days > block.timestamp, "The payment can't be cancelled");
        _;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function commitPayment(address receiver, uint unlockTime) public payable whenNotPaused checkReceiverNotPayer(receiver) {
        address payer = msg.sender;
        uint amount = msg.value;
        Payment memory payment = Payment(idCounter, payer, receiver, unlockTime, amount);
        payersCommitments[payer].push(payment);
        receiversPayments[receiver].push(payment);
        idCounter = idCounter + 1;
        emit LogPaymentCommitted(payer, receiver, unlockTime, amount);
    }

    function cancelCommittedPayment(address receiver, uint unlockTime, uint amount) 
        public 
        whenNotPaused
        checkCancellationTime(unlockTime) {
            Payment[] storage payments = receiversPayments[receiver];
            uint committedPaymentIndex;
            Payment memory paymentToCancel;
        
            for(uint index = 0; index < payments.length; index++) {
                Payment memory payment = payments[index];
                if (payment.payer == msg.sender &&
                    payment.unlockTimestamp == unlockTime &&
                    payment.amount == amount) {
                        committedPaymentIndex = index;
                        paymentToCancel = payment;
                        break;
                }
            }

            require(paymentToCancel.receiver != address(0), "Payment to cancel not found");
            payments.remove(committedPaymentIndex);

            (bool sent, ) = msg.sender.call{value: paymentToCancel.amount}("");
            require(sent, "Failed to send Ether");
            emit LogPaymentCancelled(paymentToCancel.payer, paymentToCancel.receiver, paymentToCancel.unlockTimestamp, paymentToCancel.amount);
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