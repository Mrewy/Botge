/** @format */

import type { SqlJsStatic } from 'sql.js';

import { PersonalEmoteSets } from '../personal-emote-sets.ts';
import { BaseDatabase } from './base-database.ts';

type DatabaseBroadcasterNamesAndPersonalEmoteSets = {
  readonly guildId: string;
  readonly broadcasterName: string | null;
  readonly sevenTv: string | null;
  readonly bttv: string | null;
  readonly ffz: string | null;
};

const TABLE_NAME = 'assignedEmoteSets' as const;

export class BroadcasterNameAndPersonalEmoteSetsDatabase extends BaseDatabase {
  public constructor(filepath: string, sqlJsStatic: SqlJsStatic) {
    super(filepath, sqlJsStatic);

    this.#createTable();
  }

  public changePersonalEmoteSets(guildId: string, personalEmoteSets: PersonalEmoteSets): void {
    const { sevenTv, bttv, ffz } = personalEmoteSets;
    if (this.#rowExists(guildId)) {
      const statement = this.database.prepare(
        `UPDATE ${TABLE_NAME} SET sevenTv=(?), bttv=(?), ffz=(?) WHERE guildId=(?)`
      );
      statement.run([sevenTv, bttv, ffz, guildId]);
      statement.free();
    } else {
      const statement = this.database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?,?,?,?)`);
      statement.run([guildId, null, sevenTv, bttv, ffz]);
      statement.free();
    }

    this.exportDatabase();
  }

  public changeBroadcasterName(guildId: string, broadcasterName: string): void {
    if (this.#rowExists(guildId)) {
      const statement = this.database.prepare(`UPDATE ${TABLE_NAME} SET broadcasterName=(?) WHERE guildId=(?)`);
      statement.run([broadcasterName, guildId]);
      statement.free();
    } else {
      const statement = this.database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?,?,?,?)`);
      statement.run([guildId, broadcasterName, null, null, null]);
      statement.free();
    }

    this.exportDatabase();
  }

  public getPersonalEmoteSets(guildId: string): readonly [string | null, PersonalEmoteSets] {
    const statement = this.database.prepare(
      `SELECT broadcasterName, sevenTv, bttv, ffz FROM ${TABLE_NAME} WHERE guildId=(?)`
    );
    const databaseBroadcasterNamesAndPersonalEmoteSets = statement.getAsObject([guildId]) as Omit<
      DatabaseBroadcasterNamesAndPersonalEmoteSets,
      'guildId'
    >;
    statement.free();

    return [
      databaseBroadcasterNamesAndPersonalEmoteSets.broadcasterName,
      new PersonalEmoteSets(
        databaseBroadcasterNamesAndPersonalEmoteSets.sevenTv,
        databaseBroadcasterNamesAndPersonalEmoteSets.bttv,
        databaseBroadcasterNamesAndPersonalEmoteSets.ffz
      )
    ];
  }

  public getAllBroadcasterNamesAndPersonalEmoteSets(): Readonly<
    Map<string, readonly [string | null, PersonalEmoteSets]>
  > {
    const databaseBroadcasterNamesAndPersonalEmoteSetsArray = this.getAll_(
      `SELECT guildId, broadcasterName, sevenTv, bttv, ffz FROM ${TABLE_NAME}`
    ) as readonly DatabaseBroadcasterNamesAndPersonalEmoteSets[];
    const map = new Map<string, readonly [string | null, PersonalEmoteSets]>();

    databaseBroadcasterNamesAndPersonalEmoteSetsArray.forEach((databaseBroadcasterNamesAndPersonalEmoteSets) => {
      map.set(databaseBroadcasterNamesAndPersonalEmoteSets.guildId, [
        databaseBroadcasterNamesAndPersonalEmoteSets.broadcasterName,
        new PersonalEmoteSets(
          databaseBroadcasterNamesAndPersonalEmoteSets.sevenTv,
          databaseBroadcasterNamesAndPersonalEmoteSets.bttv,
          databaseBroadcasterNamesAndPersonalEmoteSets.ffz
        )
      ]);
    });

    return map;
  }

  #createTable(): void {
    const statement = this.database.prepare(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        guildId TEXT NOT NULL PRIMARY KEY,
        broadcasterName TEXT,
        sevenTv TEXT,
        bttv TEXT,
        ffz TEXT
      );
    `);
    statement.run();
    statement.free();

    this.exportDatabase();
  }

  #rowExists(guildId: string): boolean {
    const statement = this.database.prepare(`SELECT guildId FROM ${TABLE_NAME} WHERE guildId=(?)`);
    const rows = statement.get([guildId]);
    statement.free();

    if (rows.length === 0) return false;
    return true;
  }
}
