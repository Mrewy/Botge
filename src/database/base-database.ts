/** @format */

import { DatabaseSync } from 'node:sqlite';

export class BaseDatabase {
  readonly #databaseSync: Readonly<DatabaseSync>;

  protected constructor(filepath: string) {
    this.#databaseSync = new DatabaseSync(filepath);
  }

  protected get databaseSync(): Readonly<DatabaseSync> {
    return this.#databaseSync;
  }

  public close(): void {
    this.#databaseSync.close();
  }
}
