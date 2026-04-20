/** @format */

import type { SqlJsStatic } from 'sql.js';

import { BaseDatabase } from './base-database.ts';

type DatabaseUser = {
  readonly userId: string;
  readonly guildId: string;
};

const TABLE_NAME = 'users' as const;

export class UsersDatabase extends BaseDatabase {
  public constructor(filepath: string, sqlJsStatic: SqlJsStatic) {
    super(filepath, sqlJsStatic);

    this.#createTable();
  }

  public changeGuildId(userId: string, guildId: string): void {
    if (this.#rowExists(userId)) {
      const statement = this.database.prepare(`UPDATE ${TABLE_NAME} SET guildId=(?) WHERE userId=(?)`);
      statement.run([guildId, userId]);
      statement.free();
    } else {
      const statement = this.database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?)`);
      statement.run([userId, guildId]);
      statement.free();
    }

    this.exportDatabase();
  }

  public getAllUsers(): Readonly<Map<string, readonly [string]>> {
    const databaseUsers = this.getAll_(`SELECT userId, guildId FROM ${TABLE_NAME}`) as readonly DatabaseUser[];
    const map = new Map<string, readonly [string]>();

    databaseUsers.forEach((databaseUser) => {
      map.set(databaseUser.userId, [databaseUser.guildId]);
    });

    return map;
  }

  #createTable(): void {
    const statement = this.database.prepare(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        userId TEXT NOT NULL PRIMARY KEY,
        guildId TEXT NOT NULL
      );
    `);
    statement.run();
    statement.free();

    this.exportDatabase();
  }

  #rowExists(userId: string): boolean {
    const statement = this.database.prepare(`SELECT userId FROM ${TABLE_NAME} WHERE userId=(?)`);
    const rows = statement.get([userId]);
    statement.free();

    if (rows.length === 0) return false;
    return true;
  }
}
