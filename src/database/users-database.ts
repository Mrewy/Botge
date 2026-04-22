/** @format */

import type { SqlJsStatic } from 'sql.js';

import { BaseDatabase } from './base-database.ts';

type DatabaseUser = {
  readonly userId: string;
  readonly guildId: string | null;
  readonly enableEmoteBorder: number | null;
  readonly emoteBorderColor: string | null;
  readonly emoteBorderOpacity: string | null;
};

const TABLE_NAME = 'users' as const;

const DEFAULT_EMOTE_BORDER_ENABLED = Number(false);
export const DEFAULT_EMOTE_BORDER_COLOR = '000000' as const; // black
const DEFAULT_EMOTE_BORDER_OPACITY = '1.0' as const; // 100%

export class UsersDatabase extends BaseDatabase {
  public constructor(filepath: string, sqlJsStatic: SqlJsStatic) {
    super(filepath, sqlJsStatic);

    this.#createTable();
  }

  public changeEnableEmoteBorder(userId: string, enableEmoteBorder: boolean): void {
    if (this.#rowExists(userId)) {
      const statement = this.database.prepare(`UPDATE ${TABLE_NAME} SET enableEmoteBorder=(?) WHERE userId=(?)`);
      statement.run([Number(enableEmoteBorder), userId]);
      statement.free();
    } else {
      const statement = this.database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?,?,?,?)`);
      statement.run([
        userId,
        null,
        Number(enableEmoteBorder),
        DEFAULT_EMOTE_BORDER_COLOR,
        DEFAULT_EMOTE_BORDER_OPACITY
      ]);
      statement.free();
    }

    this.exportDatabase();
  }

  public changeEmoteBorderColor(userId: string, emoteBorderColor: string): void {
    if (this.#rowExists(userId)) {
      const statement = this.database.prepare(`UPDATE ${TABLE_NAME} SET emoteBorderColor=(?) WHERE userId=(?)`);
      statement.run([emoteBorderColor, userId]);
      statement.free();
    } else {
      const statement = this.database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?,?,?,?)`);
      statement.run([userId, null, DEFAULT_EMOTE_BORDER_ENABLED, emoteBorderColor, DEFAULT_EMOTE_BORDER_OPACITY]);
      statement.free();
    }

    this.exportDatabase();
  }

  public changeEmoteBorderOpacity(userId: string, emoteBorderOpacity: string): void {
    if (this.#rowExists(userId)) {
      const statement = this.database.prepare(`UPDATE ${TABLE_NAME} SET emoteBorderOpacity=(?) WHERE userId=(?)`);
      statement.run([emoteBorderOpacity, userId]);
      statement.free();
    } else {
      const statement = this.database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?,?,?,?)`);
      statement.run([userId, null, DEFAULT_EMOTE_BORDER_ENABLED, DEFAULT_EMOTE_BORDER_COLOR, emoteBorderOpacity]);
      statement.free();
    }

    this.exportDatabase();
  }

  public changeGuildId(userId: string, guildId: string): void {
    if (this.#rowExists(userId)) {
      const statement = this.database.prepare(`UPDATE ${TABLE_NAME} SET guildId=(?) WHERE userId=(?)`);
      statement.run([guildId, userId]);
      statement.free();
    } else {
      const statement = this.database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?,?,?,?)`);
      statement.run([userId, guildId, null, null, null]);
      statement.free();
    }

    this.exportDatabase();
  }

  public getAllUsers(): readonly DatabaseUser[] {
    const databaseUsers = this.getAll_(
      `SELECT userId, guildId, enableEmoteBorder, emoteBorderColor, emoteBorderOpacity FROM ${TABLE_NAME}`
    ) as readonly DatabaseUser[];

    return databaseUsers;
  }

  public getUser(userId: string): DatabaseUser | undefined {
    if (!this.#rowExists(userId)) return undefined;

    const statement = this.database.prepare(
      `SELECT userId, guildId, enableEmoteBorder, emoteBorderColor, emoteBorderOpacity FROM ${TABLE_NAME} WHERE userId=(?)`
    );
    const databaseUser = statement.getAsObject([userId]) as DatabaseUser;
    statement.free();

    return databaseUser;
  }

  #createTable(): void {
    const statement = this.database.prepare(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        userId TEXT NOT NULL PRIMARY KEY,
        guildId TEXT,
        enableEmoteBorder INTEGER,
        emoteBorderColor TEXT,
        emoteBorderOpacity TEXT
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
