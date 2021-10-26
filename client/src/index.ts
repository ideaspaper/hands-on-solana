import { Controller } from "./controllers/controller";

const command = process.argv[2];
const options = process.argv.slice(3);

if (command === 'info') {
  Controller.info(options[0]);
} else if (command === "airdrop") {
  Controller.airdrop(options[0], options[1]);
} else if (command === "transaction") {
  Controller.runTransaction(options[0]);
} else if (command === "transaction-result") {
  Controller.transactionResult(options[0]);
}
