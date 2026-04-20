/** @format */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import type { Database, SqlJsStatic, SqlValue } from 'sql.js';

export class BaseDatabase {
  protected readonly database: Database;
  readonly #filepath: string;

  protected constructor(filepath: string, sqlJsStatic: SqlJsStatic) {
    this.#filepath = filepath;

    if (existsSync(this.#filepath)) {
      const buffer = readFileSync(this.#filepath);
      this.database = new sqlJsStatic.Database(buffer);
    } else {
      this.database = new sqlJsStatic.Database();
      this.exportDatabase();
    }
  }

  public close(): void {
    // ? should it exportDatabase() on close?
    this.database.close();
  }

  protected getAll_(sql: string, params?: SqlValue[]): readonly unknown[] {
    const databaseObjects: unknown[] = [];
    const statement = this.database.prepare(sql, params);

    while (statement.step()) {
      const databaseObject = statement.getAsObject() as unknown;
      databaseObjects.push(databaseObject);
    }
    statement.free();

    return databaseObjects;
  }

  protected exportDatabase(): void {
    writeFileSync(this.#filepath, this.database.export());
  }
}
