# Avoiding Commond Attacks
ProgrammablePayment contract uses several of the dessign patterns explained in the course.

## Proper use of Require, Assert and Revert
ProgrammablePayment uses **require** mostly in the form of modifiers. It also makes direct use of the **require** function to stop the execution of _cancelCommittedPayment_ if the payment was not found, stop the execution of _claimAvailablePayments_ if there are no unlocked payments to claim, and to validate the transactions done to send founds are successful. 

## Use modifiers only for validation
All modifiers included in the contract perform just validations.

## Pull over push
ProgrammablePayment was implemented expecting the users who received payments to claim them, instead of automatically transfering the found when a payment is unlocked.

## Checks-Effects-Interactions
In ProgrammablePayment the two functions that transfer founds to the users (_cancelCommittedPayment_ and _claimAvailablePayments_) only transfer the founds after the state has been updated.