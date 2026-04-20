/** @format */

import type { SqlJsStatic } from 'sql.js';

import type { AddedEmote } from '../types.ts';
import { BaseDatabase } from './base-database.ts';

const TABLE_NAME = 'addedEmotes' as const;

function getTableName(guildId: string): string {
  return `${TABLE_NAME}_${guildId}`;
}

export class AddedEmotesDatabase extends BaseDatabase {
  public constructor(filepath: string, sqlJsStatic: SqlJsStatic) {
    super(filepath, sqlJsStatic);
  }

  public insert(addedEmote: AddedEmote, guildId: string): void {
    const { url, alias } = addedEmote;

    const statement = this.database.prepare(`INSERT INTO ${getTableName(guildId)} (url,alias) VALUES (?,?)`);
    statement.run([url, alias]);
    statement.free();

    this.exportDatabase();
  }

  public delete(addedEmote: AddedEmote, guildId: string): void {
    const { url, alias } = addedEmote;

    const statement = this.database.prepare(
      `DELETE FROM ${getTableName(guildId)} WHERE url=(?) AND (alias=(?) OR alias IS NULL)`
    );
    statement.run([url, alias]);
    statement.free();

    this.exportDatabase();
  }

  public getAll(guildId: string): readonly AddedEmote[] {
    const addedEmotes = this.getAll_(`SELECT url,alias FROM ${getTableName(guildId)}`) as readonly AddedEmote[];
    return addedEmotes;
  }

  public createTable(guildId: string): void {
    const tableName = getTableName(guildId);

    const statement = this.database.prepare(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        url TEXT NOT NULL PRIMARY KEY,
        alias TEXT
      );
    `);
    statement.run();
    statement.free();

    this.exportDatabase();
  }
}
