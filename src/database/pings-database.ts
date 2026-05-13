/** @format */

import type { Ping } from '../types.ts';
import { BaseDatabase } from './base-database.ts';

type DatabasePing = {
  readonly time: number;
  readonly days: number | null;
  readonly hours: number | null;
  readonly minutes: number | null;
  readonly userId: string;
  readonly channelId: string;
  readonly message: string | null;
  readonly userIds: string | null;
  readonly userIdRemoved: number | null;
};

function getId(ping: Ping): string {
  return `${ping.time}_${ping.userId}_${ping.channelId}`;
}

const TABLE_NAME = 'pings' as const;

export class PingsDatabase extends BaseDatabase {
  public constructor(filepath: string) {
    super(filepath);

    this.#createTable();
    // this.#alterTable();
  }

  public insert(ping: Ping): void {
    const { time, days, hours, minutes, userId, channelId, message } = ping;
    const statement = this.databaseSync.prepare(
      `INSERT INTO ${TABLE_NAME} (id, time, days, hours, minutes, userId, channelId, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    statement.run(getId(ping), time, days, hours, minutes, userId, channelId, message);
  }

  public delete(ping: Ping): void {
    const statement = this.databaseSync.prepare(`DELETE FROM ${TABLE_NAME} WHERE id = (?)`);
    statement.run(getId(ping));
  }

  public updateUserIds(ping: Ping): void {
    if (!this.#rowExists(ping)) return;

    const { userIds } = ping;
    const userIdsJoined = userIds !== null ? (userIds.length !== 0 ? userIds.join(',') : null) : null;

    const statement = this.databaseSync.prepare(`UPDATE ${TABLE_NAME} SET userIds = (?) WHERE id = (?)`);
    statement.run(userIdsJoined, getId(ping));
  }

  public updateUserIdRemoved(ping: Ping): void {
    if (!this.#rowExists(ping)) return;

    const { userIdRemoved } = ping;
    const userIdRemovedUpdated = userIdRemoved !== null ? Number(userIdRemoved) : null;

    const statement = this.databaseSync.prepare(`UPDATE ${TABLE_NAME} SET userIdRemoved = (?) WHERE id = (?)`);
    statement.run(userIdRemovedUpdated, getId(ping));
  }

  public getAll(): readonly Ping[] {
    const statement = this.databaseSync.prepare(
      `SELECT time, days, hours, minutes, userId, channelId, message, userIds, userIdRemoved FROM ${TABLE_NAME}`
    );
    const databasePings = statement.all() as DatabasePing[];

    return databasePings.map((databasePing) => {
      const pingSelectedUserIds = databasePing.userIds;
      const pingUserIds = pingSelectedUserIds !== null ? pingSelectedUserIds.split(',') : null;

      const pingSelectedUserIdRemoved = databasePing.userIdRemoved;
      const pingUserIdRemoved = pingSelectedUserIdRemoved !== null ? Boolean(pingSelectedUserIdRemoved) : null;

      return { ...databasePing, userIds: pingUserIds, userIdRemoved: pingUserIdRemoved };
    });
  }

  #createTable(): void {
    this.databaseSync.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT NOT NULL PRIMARY KEY,
        time INTEGER NOT NULL,
        days INTEGER,
        hours INTEGER,
        minutes INTEGER,
        userId TEXT NOT NULL,
        channelId TEXT NOT NULL,
        message TEXT,
        userIds TEXT,
        userIdRemoved INTEGER
      ) STRICT;
    `);
  }

  /*
  #alterTable(): void {
    const statement = this.database.prepare(
      `SELECT COUNT(*) AS CNTREC FROM pragma_table_info('${TABLE_NAME}') WHERE name='days'`
    );
    const columnExistsUserIdsRan = statement.getAsObject() as { readonly CNTREC: number };
    statement.free()

    if (columnExistsUserIdsRan.CNTREC === 0) {
      const statement2 = this.database.prepare(`ALTER TABLE ${TABLE_NAME} ADD days INTEGER`);
      statement2.run();
      statement2.free()
    }
  }
  */

  #rowExists(ping: Ping): boolean {
    const statement = this.databaseSync.prepare(`SELECT id FROM ${TABLE_NAME} WHERE id = (?)`);
    const row = statement.get(getId(ping));

    if (row !== undefined) return true;
    return false;
  }
}
