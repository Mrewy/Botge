/** @format */

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
  public constructor(filepath: string) {
    super(filepath);

    this.#createTable();
  }

  public changeEnableEmoteBorder(userId: string, enableEmoteBorder: boolean): void {
    if (this.#rowExists(userId)) {
      const statement = this.databaseSync.prepare(
        `UPDATE ${TABLE_NAME} SET enableEmoteBorder = (?) WHERE userId = (?)`
      );
      statement.run(Number(enableEmoteBorder), userId);
    } else {
      const statement = this.databaseSync.prepare(
        `INSERT INTO ${TABLE_NAME} VALUES (?, ?, ?, ?, ?)`
      );
      statement.run(
        userId,
        null,
        Number(enableEmoteBorder),
        DEFAULT_EMOTE_BORDER_COLOR,
        DEFAULT_EMOTE_BORDER_OPACITY
      );
    }
  }

  public changeEmoteBorderColor(userId: string, emoteBorderColor: string): void {
    if (this.#rowExists(userId)) {
      const statement = this.databaseSync.prepare(
        `UPDATE ${TABLE_NAME} SET emoteBorderColor = (?) WHERE userId = (?)`
      );
      statement.run(emoteBorderColor, userId);
    } else {
      const statement = this.databaseSync.prepare(
        `INSERT INTO ${TABLE_NAME} VALUES (?, ?, ?, ?, ?)`
      );
      statement.run(
        userId,
        null,
        DEFAULT_EMOTE_BORDER_ENABLED,
        emoteBorderColor,
        DEFAULT_EMOTE_BORDER_OPACITY
      );
    }
  }

  public changeEmoteBorderOpacity(userId: string, emoteBorderOpacity: string): void {
    if (this.#rowExists(userId)) {
      const statement = this.databaseSync.prepare(
        `UPDATE ${TABLE_NAME} SET emoteBorderOpacity = (?) WHERE userId = (?)`
      );
      statement.run(emoteBorderOpacity, userId);
    } else {
      const statement = this.databaseSync.prepare(
        `INSERT INTO ${TABLE_NAME} VALUES (?, ?, ?, ?, ?)`
      );
      statement.run(
        userId,
        null,
        DEFAULT_EMOTE_BORDER_ENABLED,
        DEFAULT_EMOTE_BORDER_COLOR,
        emoteBorderOpacity
      );
    }
  }

  public changeGuildId(userId: string, guildId: string): void {
    if (this.#rowExists(userId)) {
      const statement = this.databaseSync.prepare(
        `UPDATE ${TABLE_NAME} SET guildId = (?) WHERE userId = (?)`
      );
      statement.run(guildId, userId);
    } else {
      const statement = this.databaseSync.prepare(
        `INSERT INTO ${TABLE_NAME} VALUES (?, ?, ?, ?, ?)`
      );
      statement.run(userId, guildId, null, null, null);
    }
  }

  public getAllUsers(): readonly DatabaseUser[] {
    const statement = this.databaseSync.prepare(
      `SELECT userId, guildId, enableEmoteBorder, emoteBorderColor, emoteBorderOpacity FROM ${TABLE_NAME}`
    );
    const databaseUsers = statement.all() as DatabaseUser[];

    return databaseUsers;
  }

  public getUser(userId: string): DatabaseUser | undefined {
    if (!this.#rowExists(userId)) return undefined;

    const statement = this.databaseSync.prepare(
      `SELECT userId, guildId, enableEmoteBorder, emoteBorderColor, emoteBorderOpacity FROM ${TABLE_NAME} WHERE userId = (?)`
    );
    const databaseUser = statement.get(userId) as DatabaseUser;

    return databaseUser;
  }

  #createTable(): void {
    this.databaseSync.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        userId TEXT NOT NULL PRIMARY KEY,
        guildId TEXT,
        enableEmoteBorder INTEGER,
        emoteBorderColor TEXT,
        emoteBorderOpacity TEXT
      ) STRICT;
    `);
  }

  #rowExists(userId: string): boolean {
    const statement = this.databaseSync.prepare(
      `SELECT userId FROM ${TABLE_NAME} WHERE userId = (?)`
    );
    const row = statement.get(userId);

    if (row !== undefined) return true;
    return false;
  }
}
