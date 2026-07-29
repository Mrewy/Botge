/** @format */

import type { AddedEmote } from '../types.ts';
import { BaseDatabase } from './base-database.ts';

const TABLE_NAME = 'addedEmotes' as const;

function getTableName(guildId: string): string {
  return `${TABLE_NAME}_${guildId}`;
}

export class AddedEmotesDatabase extends BaseDatabase {
  public constructor(filepath: string) {
    super(filepath);
  }

  public insert(addedEmote: AddedEmote, guildId: string): void {
    const { url, alias } = addedEmote;

    const statement = this.databaseSync.prepare(
      `INSERT INTO ${getTableName(guildId)} (url, alias) VALUES (?, ?)`
    );
    statement.run(url, alias);
  }

  public delete(addedEmote: AddedEmote, guildId: string): void {
    const { url, alias } = addedEmote;

    const statement = this.databaseSync.prepare(
      `DELETE FROM ${getTableName(guildId)} WHERE url = (?) AND (alias = (?) OR alias IS NULL)`
    );
    statement.run(url, alias);
  }

  public getAll(guildId: string): readonly AddedEmote[] {
    const statement = this.databaseSync.prepare(`SELECT url, alias FROM ${getTableName(guildId)}`);
    const addedEmotes = statement.all() as AddedEmote[];

    return addedEmotes;
  }

  public createTable(guildId: string): void {
    const tableName = getTableName(guildId);

    this.databaseSync.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        url TEXT NOT NULL PRIMARY KEY,
        alias TEXT
      ) STRICT;
    `);
  }
}
