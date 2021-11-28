# blockchain-developer-bootcamp-final-project
Repository for Consensys Academy bootcamp

## Contract to configure payments to be done at a particular time
The idea of the project is to create a contract that allows different users to configure payments to be done at a given time. When the unlocking time arrives the payment is not sent automatically to the receiver. When a payment is configured to be done to a particular address, the owner of the address will be able to claim the payed amount (and request it to be transfered) when the specified payment date has been reached.
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
* A user that has registered a payment will be able to cancel it until 24 hours before the unlock time.

### Use Cases to Investigate
* Create a time trigger to automate the transfer of all payments configured for a particular date.

After the investigation I have decided it is not a good idea to have this functionality. For security reasons it is preferrable to let the receivers claim their payments (in transactions initiated by themselves).

### Requirements to run the project
- NodeJS
- Yarn
- Truffle
- Ganache

### Directory structure
In the project you will find the following directories.

**contracts**
Contains the solidity contracts of the project.

**migrations**
Includes two JS scripts with the instructions to migrate both the Migrations.sol contract and the ProgrammablePayment.sol contract.

**react-app**
This directory contains all the elements of the web DApp. It is based on schaffold.eth

**test**
Contains two files with the unit tests for the programmable payments and also for the upgradable contract functionality.

### Download the project and run tests
To download this project and run the unit tests please follow the next steps:
1. Make sure you have NodeJS installed in your machine.
2. Clone the repository to a folder in your machine.
3. Make sure you have **Truffle Suite** installed (see https://trufflesuite.com/docs/truffle/getting-started/installation)
4. Using a terminal application go the the directory created in the previous step and where the repository has been cloned, and run `yarn install`
5. To run all solidity tests execute the following command `truffle test`

You can find the contracts in the _**contracts**_ folder.

### Running the web application
The web application has been created using **Scaffold-eth** (https://docs.scaffoldeth.io/scaffold-eth/). If you want to run the DApp locally in your machine you can follow the next steps.

a. Deploy the contracts
 1. You need a local node running in your machine. You can also use an application like **Ganache** (https://trufflesuite.com/docs/ganache/overview). In the next steps we consider the node configured to listen using the port 8545. If you are using a different port please make sure to edit the file _truffle-config.js_ in the project's root folder.
 2. Execute the command `truffle migrate --network local`
 3. Take note of the address the ProgrammablePayment Proxy contract was deployed to. In the next example the deployed addres is _0x2ddC7CaE0c0036E5f414BfFF2A51747FFb8A45c2_
``` 2_deploy_contracts.js
=====================

   Deploying 'ProgrammablePayment'
   -------------------------------
   > transaction hash:    0x1cd189c311093b2fbad2b1359b39f20b051433e1bbe4418ff7ec3aff659a496f
   > Blocks: 0            Seconds: 0
   > contract address:    0x980Ebc8d9c1cF24108b5e233BFAD644D006B6C79
   > block number:        3
   > block timestamp:     1637897838
   > account:             0x02f090cFD08Ef0878608bE2C8a272443D09fc733
   > balance:             99.93684324
   > gas used:            2913479 (0x2c74c7)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.05826958 ETH


   Deploying 'ERC1967Proxy'
   ------------------------
   > transaction hash:    0x5c4299de8b2ee09a32239b9f281c4e37cfa1afd083445c1fdf6b10d1d8d0a627
   > Blocks: 0            Seconds: 0
   > contract address:    0x2ddC7CaE0c0036E5f414BfFF2A51747FFb8A45c2
   > block number:        4
   > block timestamp:     1637897839
   > account:             0x02f090cFD08Ef0878608bE2C8a272443D09fc733
   > balance:             99.9305506
   > gas used:            314632 (0x4cd08)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.00629264 ETH

Deployed  0x2ddC7CaE0c0036E5f414BfFF2A51747FFb8A45c2
```
b. Start the web application
 1. From the terminal go to the **react-app** subfolder
 2. Install all dependencies executing `yarn install`
 3. Check that the app is configured to use the locally deployed contract by specifying _NETWORKS.localhost_ as the targetNetwork (line 32 in the file _react-app/src/App.jsx_
```
const targetNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)
```
 4. Update the address of the ProgrammablePayment contract for the local network in the file _react-app/src/contracts/hardhat_contracts.json_
```
{
  "1337": {
    "localhost": {
      "name": "localhost",
      "chainId": "1337",
      "contracts": {
        "ProgrammablePayment": {
          "address": "0x2ddC7CaE0c0036E5f414BfFF2A51747FFb8A45c2",
```
 5. Start the local web server with the command `yarn start`

The start script will run the local application server listening in the port 3000. You will need to have a wallet like Metamask installed in your browser, and configure it to use the local network running in the port 8545 (or the correct port if you decided to use a different one).

## Deploy contracts to testnet/mainnet
In the case you want to deploy the contracts to testnet/mainnet you will need to provide the required information about the wallet to be used to pay for the transactions and the information to connect to the node that will receive the deploy requests. If you open the file **truffle-config.js** you will find a couple of lines loading the required configuration form the local environment:
```
const MNEMONIC = process.env.MNEMONIC
const ROPSTEN_URL = process.env.ROPSTEN_URL
const KOVAN_URL = process.env.KOVAN_URL
const RINKEBY_URL = process.env.RINKEBY_URL
const MAINNET_URL = process.env.MAINNET_URL
```

To configure the parameters you need to create a file called `.env` in the root project directory, with the following structure:
```
MNEMONIC=<THE WORDS REQUIRED TO GENERATE THE PRIVATE KEYS OF THE WALLET YOU WANT TO USE TO PAY FOR THE DEPLOYMENT TRANSACTION>
ROPSTEN_URL=https://ropsten.infura.io/v3/<YOUR INFURA ID>
KOVAN_URL=https://kovan.infura.io/v3/<YOUR INFURA ID>
RINKEBY_URL=https://rinkeby.infura.io/v3/<YOUR INFURA ID>
MAINNET_URL=https://mainnet.infura.io/v3/<YOUR INFURA ID>
```
In the previous example we are using Infura. You can point to other networks, but you will have to also change the **truffle-config.js** file and add them in the _networks_ configuration section.

## Point the web DApp to testnet/mainnet
To run the web DApp pointing to a contract deployed in testnet or mainnet it is required to configure the node that will be used for the requests. That can be done by creating a `.env` file in the **react-app** folder with the connection information. For example if the intention is to point to a contract deployed in _ropsten_ and using Infura the required configuration would be:
```
REACT_APP_PROVIDER=https://ropsten.infura.io/v3/<YOUR INFURA ID>
```

Please also remember tu update the contract's address in the file **react-app/src/contracts/hardhat_contracts.json**
```
"3": {
    "ropsten": {
      "name": "ropsten",
      "chainId": "3",
      "contracts": {
        "ProgrammablePayment": {
          "address": "0x0f8093cA95499c28A5758fe6A8a24D7f59079cF1",
```

### Deployed application for testing
If you are interested in testing the application without installing or downloading anything, you can use the following address: https://programmablepayment.netlify.app/
This testing page is connected to an instance of the ProgrammablePayment contract that has been deployed in the Ropsten testnet. You will need to have a Ropsten address with some founds to use the DApp.
