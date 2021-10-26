import { Model } from "../models/model";
import { View } from "../views/view";

export class Controller {
  static async info(filepath: string): Promise<void> {
    const app = new Model(
      await Model.getConnection(),
      await Model.initUserKeypair(filepath)
    );
    View.info(await app.info());
  }

  static async airdrop(filepath: string, amount: string): Promise<void> {
    const app = new Model(
      await Model.getConnection(),
      await Model.initUserKeypair(filepath)
    );
    await app.airdrop(amount);
    View.airdrop(app.getUserPubkey(), amount);
  }

  static async runTransaction(filepath: string) {
    const app = new Model(
      await Model.getConnection(),
      await Model.initUserKeypair(filepath)
    );
    await app.runTransaction();
    View.runTransaction(app.getUserPubkey());
  }

  static async transactionResult(filepath: string) {
    const app = new Model(
      await Model.getConnection(),
      await Model.initUserKeypair(filepath)
    );
    const result = await app.trasactionResult();
    View.transactionResult(app.getUserPubkey(), result);
  }
}
