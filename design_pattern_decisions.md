# Design Patterns
ProgrammablePayment contract uses several of the dessign patterns explained in the course.

## Inheritance
The contract uses functionality provided by OpenZeppelin for common behavior. Using OpenZeppelin implementations provides the advantaje or making the contract more reliable to the users (because the common functionalities provided by OpenZeppelin are considered a standard and have been already audited by the community). ProgrammablePayment inherits from the following contracts:
- Initializable
- UUPSUpgradeable
- OwnableUpgradeable
- PausableUpgradeable

## Access Control
ProgrammablePayment can register an owner. This address is the only one allowed to upgrade the implementation, pause the contract to prevent any changes from being done and also resuming the contract logic. The ownership of the contract can be transfered (it is originally assigned to the address that deploys it).

## Upgradable
ProgrammablePayment is upgradable. To include this functionality the contract inherits from the UUPSUpgradable contract from OpenZeppelin. The decision to use UUPSUpgradable implementation instead of transparent proxy implementation was taken based on the advantajes of the first approach regarding the cost of performing upgrades.

## Optimizing Gas
As previously mentioned the contract implements upgradability using the most cost efficient alternative.
Also, in order to reduce transactions costs, the contract removes from the storage all payments that are cancelled or claimed. That means that whenever a user claims payments the transaction cost will be reduced by the number of claimable payments that will be removed from storate. The decision of removing claimed and cancelled payments also reduces the lenght of the arrays used to register them, allowing the claiming logic to require less cycle when looking for unlocked payments.