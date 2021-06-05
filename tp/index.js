const { TransactionProcessor } = require('sawtooth-sdk/processor');
const smartGridHandler = require('./handler');
const address = process.argv[2]
const transactionProcessor = new TransactionProcessor(address);

transactionProcessor.addHandler(new smartGridHandler());
transactionProcessor.start();

console.log(`Welcome to electric smart grid`);
console.log(`Connecting to Sawtooth validator at Validator 0`);
