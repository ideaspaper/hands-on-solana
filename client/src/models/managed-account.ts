import * as borsh from "borsh";

export class ManagedAccount {
  private counter;

  constructor(fields: { counter: number } | undefined = undefined) {
    if (fields) this.counter = fields.counter;
  }

  /**
   * SETTERS AND GETTERS
   */

  getCounter() {
    return this.counter;
  }

  /**
   * STATIC HELPERS
   */

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

  static deserialize(managedAccountData: Buffer): ManagedAccount {
    return borsh.deserialize(
      ManagedAccount.getSchema(),
      ManagedAccount,
      managedAccountData
    );
  }
}
