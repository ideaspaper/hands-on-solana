import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import * as yaml from "yaml";
import {
  AccountInfo,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { ManagedAccount } from "./managed-account";

export class Model {
  private connection: Connection;
  private userKeypair: Keypair;
  private managedAccountPubkey: PublicKey;

  constructor(connection: Connection, userKeypair: Keypair) {
    this.connection = connection;
    this.userKeypair = userKeypair;
    this.managedAccountPubkey = {} as PublicKey;
  }

  async info(): Promise<AccountInfo<Buffer> | null> {
    const info = await this.connection.getAccountInfo(
      this.userKeypair.publicKey
    );
    return info;
  }

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

  async trasactionResult(): Promise<ManagedAccount> {
    await this.generateManagedAccountPubkey();
    const managedAccountInfo = await this.connection.getAccountInfo(
      this.managedAccountPubkey
    );
    if (!managedAccountInfo) throw new Error("cannot find the managed account");
    return ManagedAccount.deserialize(managedAccountInfo.data);
  }

  private async initProgramPubkey(): Promise<PublicKey> {
    const programPath = path.join(
      __dirname,
      "..",
      "..",
      "program",
      "program.json"
    );
    try {
      const rawData = await fs.readFile(programPath, { encoding: "utf-8" });
      const secretKey = Uint8Array.from(JSON.parse(rawData));
      return Keypair.fromSecretKey(secretKey).publicKey;
    } catch (err) {
      throw new Error("cannot read program id");
    }
  }

  private async generateManagedAccountPubkey(): Promise<void> {
    this.managedAccountPubkey = await PublicKey.createWithSeed(
      this.userKeypair.publicKey,
      "hello",
      await this.initProgramPubkey()
    );
  }

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

  /**
   * GETTERS AND SETTERS
   */

  getConnection(): Connection {
    return this.connection;
  }

  getUserPubkey(): PublicKey {
    return this.userKeypair.publicKey;
  }

  /**
   * STATIC HELPERS
   */

  private static async getConfig(): Promise<any> {
    const configPath = path.resolve(
      os.homedir(),
      ".config",
      "solana",
      "cli",
      "config.yml"
    );
    try {
      const configYml = await fs.readFile(configPath, { encoding: "utf8" });
      return yaml.parse(configYml);
    } catch (err) {
      throw new Error("cannot read config file");
    }
  }

  static async getConnection(): Promise<Connection> {
    const config = await Model.getConfig();
    try {
      const connection = new Connection(config.json_rpc_url, "confirmed");
      return connection;
    } catch (err) {
      throw new Error("cannot initialize connection");
    }
  }

  static async initUserKeypair(filepath: string): Promise<Keypair> {
    const walletPath = path.join(__dirname, "..", "..", filepath);
    try {
      const rawData = await fs.readFile(walletPath, { encoding: "utf-8" });
      const secretKey = Uint8Array.from(JSON.parse(rawData));
      return Keypair.fromSecretKey(secretKey);
    } catch (err) {
      throw new Error("cannot read wallet");
    }
  }
}
