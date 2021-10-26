import { AccountInfo, PublicKey } from "@solana/web3.js";
import { ManagedAccount } from "../models/managed-account";

export class View {
  static info(accountInfo: AccountInfo<Buffer> | null): void {
    if (!accountInfo) return console.log("account not found");
    console.log(
      `Balance: ${accountInfo.lamports} lamports\nExecutable: ${accountInfo.executable}\nRent: ${accountInfo.rentEpoch}`
    );
  }

  static airdrop(userPubkey: PublicKey, amount: string): void {
    console.log(`Airdropped ${parseFloat(amount)} lamports to ${userPubkey}`);
  }

  static runTransaction(userPubkey: PublicKey) {
    console.log(`Transaction on ${userPubkey} has been completed`);
  }

  static transactionResult(
    managedAccountPubkey: PublicKey,
    managedAccount: ManagedAccount
  ) {
    console.log(
      managedAccountPubkey.toBase58(),
      "has been greeted",
      managedAccount.getCounter(),
      "time(s)"
    );
  }
}
