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

/// @title An interface for Payment arrays that allows removing elements reducing the array size
/// @author Abel Armoa
/// @notice Based on the implementation in solidity-by-example
/// @dev Only used in arrays where the order is not important. The remove logic will alter the array order.
library Array {
    function remove(Payment[] storage arr, uint index) internal {
        // Move the last element into the place to delete
        require(arr.length > 0, "Can't remove from empty array");
        arr[index] = arr[arr.length - 1];
        arr.pop();
    }
}

/// @title A contract to register payments to be unlocked in a certain timestamp, and to claim them once they are unlocked
/// @author Abel Armoa
/// @notice This contract has not been tested thoroughly in testnet. Use with caution.
/// @dev This contractc is upgradable (UUPS functionality from OpenZeppelin) and Pausable
contract ProgrammablePayment is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    using Array for Payment[];

    uint256 private idCounter;
    mapping (address => Payment[]) private payersCommitments;
    mapping (address => Payment[]) private receiversPayments;

    /// @notice Function required by UUPSUpgradable contracts.
    /// @dev This function replaces the constructor, that should not be implemented in UUPSUpgradable contracts
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

    /// @notice Function to be called by the contract owner. It pauses the contract preventing any action
    /// @dev Required by Pausable
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Function to be called by the contract owner. It unpauses the contract, resuming all normal activities
    /// @dev Required by Pausable
    function unpause() public onlyOwner {
        _unpause();
    }

    /// @notice Commits a payment to a receiver, to be release at a particular time. Disabled when the contract is paused. Payer and receiver should be differents
    /// @dev Creates a new Payment and sotores it
    /// @param receiver Address that will be able to claim the payment once it is unlocked
    /// @param unlockTime Timestamp that determines when the payment is unlocked. The payment is unlocked when the block timestamp is greater or equal the unlockTime
    function commitPayment(address receiver, uint unlockTime) public payable whenNotPaused checkReceiverNotPayer(receiver) {
        address payer = msg.sender;
        uint amount = msg.value;
        Payment memory payment = Payment(idCounter, payer, receiver, unlockTime, amount);
        payersCommitments[payer].push(payment);
        receiversPayments[receiver].push(payment);
        idCounter = idCounter + 1;
        emit LogPaymentCommitted(payer, receiver, unlockTime, amount);
    }

    /// @notice Cancels a previously commited payment if there are still more than 24 hours until the unlock time (according the the current block timestamp). The transaction fails if no matching payment found
    /// @dev Removes a matching payment from the storage. Matching is done by payer, receiver, unlock time and amount. The payment amount is transferred back to the payer.
    /// @param receiver Address that will be able to claim the payment once it is unlocked
    /// @param unlockTime Timestamp that determines when the payment is unlocked
    /// @param amount The payment amount
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

    /// @notice Transfers all currently unlocked payments to the receiver (the sender of the message). The transaction fails if there are no unlocked payments to claim.
    ///         The function will revert if there are no unlocked payments for the message sender.
    /// @dev The function looks for all payments associated to the message sender address, and gathers those already unlocked according to the time condition and the block time.
    ///      Based on the selected ones it calculates the amount to send to the message sender, removes them from the storage and finally transfers the founds.
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