# blockchain-developer-bootcamp-final-project
Repository for Consensys Academy bootcamp

## Contract to configure payments to be done at a particular time
The idea of the project is to create a contract that allows different users to configure payments to be done at a given time (the initial idea is to reduce the use case to *payments at a particular date* to avoid the problem of determining the exact time when a function is executed). When a payment is configured to be done to a particular address, the owner of the address will be able to claim the payed amount (and request it to be transfered) when the specified payment date has been reached.
Any address could be used as the recipient of more than one payment at the same time, from the same paying address or from different paying addresses.
The possibility to implement the automation of the payment transfer when the time is reached will be evaluated, but it will deppend on the possibility to configure a temporal event to trigger the execution. Also since the number of addresses to receive payments could be high, it might not be feasible (from the point of view of the gas limit per transaction) to automate the payment.

### Use Cases
* A user can register a number of payments to be done in a particular date. A payment is defined by:
  * Payment amount
  * Destination address
  * Payment date
* The amount received when a user registers a set of payments should be equal or greater than the sum of each payment amount.
* A user that has been payed using the contract can request to receive the founds of all the payments that are available (the payment date has been reached).
* A user that has configured a payment to be done can request its cancellation until one day before the payment date.
* A user can check the amount to be received as payment.
* A user can check the amount to be received as payment from a particular paying address.

### Use Cases to Investigate
* Create a time trigger to automate the transfer of all payments configured for a particular date.

### Deployed application for testing
If you are interested in testing the application without installing or downloading anything, you can use the following address: https://programmablepayment.netlify.app/
This testing page is connected to an instance of the ProgrammablePayment contract that has been deployed in the Ropsten testnet. You will need to have a Ropsten address with some founds to use the DApp.