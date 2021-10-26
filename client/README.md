# Client

## Contents

- [General Overview](#general-overview)
- [Info](#info)
- [Airdrop](#airdrop)
- [Transaction](#transaction)
- [Transaction Result](#transaction-result)

## General Overview

We can make a Solana client using [npm package](https://www.npmjs.com/package/@solana/web3.js) provided by Solana. Manual for the package can be found [here](https://solana-labs.github.io/solana-web3.js/).

This client is CLI based and have four commands:

- `info <wallet_keypair_file_path>`

  This command will print the info for an account.

- `airdrop <wallet_keypair_file_path> <sol_amount>`

  This command will airdrop some SOL amount to a wallet.

- `transaction <wallet_keypair_file_path>`

  This command will run a predetermined transaction for an account.

- `transaction-result <wallet_keypair_file_path>`

  This command will printout the transaction result for an account.

[**Back to top**](#contents)

## Info

This command needs a wallet keypair file to be executed. This command will run the `getAccountInfo` method from [`Connection`](https://solana-labs.github.io/solana-web3.js/classes/Connection.html) class.

```ts
// ...
export class Model {
  // ...
  async info(): Promise<AccountInfo<Buffer> | null> {
    const info = await this.connection.getAccountInfo(
      this.userKeypair.publicKey
    );
    return info;
  }
  // ...
}
```

[**Back to top**](#contents)

## Airdrop

This command needs two arguments: wallet keypair file and SOL amount. This command **will not work on Solana main cluster**. This command will run the `requestAirdrop` method from [`Connection`](https://solana-labs.github.io/solana-web3.js/classes/Connection.html) class.

```ts
//...
export class Model {
  // ...
  async airdrop(amount: string): Promise<void> {
    const amountNumber = parseFloat(amount) * LAMPORTS_PER_SOL;
    try {
      await this.connection.requestAirdrop(
        this.userKeypair.publicKey,
        amountNumber
      );
    } catch (err) {
      throw new Error("wrong amount");
    }
  }
  // ...
}
```

[**Back to top**](#contents)

## Transaction

> If the program needs to store state between transactions, it does so using accounts.
>
> [Source](https://docs.solana.com/developing/programming-model/accounts)

When running a transaction, in this case incrementing a `counter`, we need an account for saving `counter`'s state. Therefore the first thing to do is for client to make an account to be managed by the Solana program (smart contract). Before we can create an account, we need to generate a public key for that account. We will create a new public key **based on a wallet's public** key using `createWithSeed` static method from [`PublicKey`](https://solana-labs.github.io/solana-web3.js/classes/PublicKey.html) class.

```ts
// ...
export class Model {
  // ...
  private managedAccountPubkey: PublicKey;
  // ...
  async runTransaction(): Promise<void> {
    await this.generateManagedAccountPubkey();
    // ...
  }
  // ...
  private async generateManagedAccountPubkey(): Promise<void> {
    this.managedAccountPubkey = await PublicKey.createWithSeed(
      this.userKeypair.publicKey,
      "hello",
      await this.initProgramPubkey()
    );
  }
  // ...
}
```

After creating public key for the managed account, the next step is to create the account. Creating an account can be done through a transaction. A transaction can contains many instructions. We can create a transaction by instantiating [`Transaction`](https://solana-labs.github.io/solana-web3.js/classes/Transaction.html) class. After instantiating `Transaction`, we can add an instruction using `add` method. In this example, the instruction is to create an account. For this purpose, we can use `createAccountWithSeed` static method from [`SystemProgram`](https://solana-labs.github.io/solana-web3.js/classes/SystemProgram.html) class. After the transaction ready, we can send it to Solana cluster by using [`sendAndConfirmTransaction`](https://solana-labs.github.io/solana-web3.js/modules.html#sendAndConfirmTransaction) method.

```ts
// ...
import { ManagedAccount } from "./managed-account";

export class Model {
  private connection: Connection;
  private userKeypair: Keypair;
  private managedAccountPubkey: PublicKey;
  // ...
  async runTransaction(): Promise<void> {
    await this.generateManagedAccountPubkey();
    await this.managedAccountCreateIfNotExists();
    // ...
  }
  // ...
  private async managedAccountCreateIfNotExists(): Promise<void> {
    await this.generateManagedAccountPubkey();
    const managedAccount = await this.connection.getAccountInfo(
      this.managedAccountPubkey
    );
    if (!managedAccount) {
      const lamports = await this.connection.getMinimumBalanceForRentExemption(
        ManagedAccount.getSize()
      );
      const transaction = new Transaction().add(
        SystemProgram.createAccountWithSeed({
          fromPubkey: this.userKeypair.publicKey,
          basePubkey: this.userKeypair.publicKey,
          seed: "hello",
          newAccountPubkey: this.managedAccountPubkey,
          lamports,
          space: ManagedAccount.getSize(),
          programId: await this.initProgramPubkey(),
        })
      );
      await sendAndConfirmTransaction(this.connection, transaction, [
        this.userKeypair,
      ]);
    }
  }
  // ...
}
```

When creating an account to be managed by Solana program, we have to specify the `space` (in Bytes) to be alocated for the account. We can determine the account size as below.

```ts
import * as borsh from "borsh";

export class ManagedAccount {
  private counter;

  constructor(fields: { counter: number } | undefined = undefined) {
    if (fields) this.counter = fields.counter;
  }
  // ...
  private static getSchema(): Map<
    typeof ManagedAccount,
    {
      kind: string;
      fields: string[][];
    }
  > {
    return new Map([
      [ManagedAccount, { kind: "struct", fields: [["counter", "u32"]] }],
    ]);
  }

  static getSize(): number {
    return borsh.serialize(ManagedAccount.getSchema(), new ManagedAccount())
      .length;
  }
  // ...
}
```

After the managed account created, the last thing to do is to execute the Solana program. We can do this by creating a [`TransactionInstruction`](https://solana-labs.github.io/solana-web3.js/classes/TransactionInstruction.html) instance as below. After that, we can use `sendAndConfirmTransaction` method to send the transaction to the Solana cluster.

```ts
export class Model {
  private connection: Connection;
  private userKeypair: Keypair;
  private managedAccountPubkey: PublicKey;
  // ...
  async runTransaction(): Promise<void> {
    await this.generateManagedAccountPubkey();
    await this.managedAccountCreateIfNotExists();
    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: this.managedAccountPubkey,
          isSigner: false,
          isWritable: true,
        },
      ],
      programId: await this.initProgramPubkey(),
      data: Buffer.alloc(0),
    });
    await sendAndConfirmTransaction(
      this.connection,
      new Transaction().add(instruction),
      [this.userKeypair]
    );
  }
  // ...
}
```

[**Back to top**](#contents)

## Transaction Result

Reading transaction result can be done by getting the managed account info, then deserializing it.

```ts
// ...
import { ManagedAccount } from "./managed-account";

export class Model {
  private connection: Connection;
  private userKeypair: Keypair;
  private managedAccountPubkey: PublicKey;
  // ...
  async trasactionResult(): Promise<ManagedAccount> {
    await this.generateManagedAccountPubkey();
    const managedAccountInfo = await this.connection.getAccountInfo(
      this.managedAccountPubkey
    );
    if (!managedAccountInfo) throw new Error("cannot find the managed account");
    return ManagedAccount.deserialize(managedAccountInfo.data);
  }
  // ...
}
```

```ts
import * as borsh from "borsh";

export class ManagedAccount {
  private counter;

  constructor(fields: { counter: number } | undefined = undefined) {
    if (fields) this.counter = fields.counter;
  }
  // ...
  private static getSchema(): Map<
    typeof ManagedAccount,
    {
      kind: string;
      fields: string[][];
    }
  > {
    return new Map([
      [ManagedAccount, { kind: "struct", fields: [["counter", "u32"]] }],
    ]);
  }
  // ...
  static deserialize(managedAccountData: Buffer): ManagedAccount {
    return borsh.deserialize(
      ManagedAccount.getSchema(),
      ManagedAccount,
      managedAccountData
    );
  }
}
```

[**Back to top**](#contents)
