/** @format */

import { PersonalEmoteSets } from '../modules/emote-matcher/personal-emote-sets.ts';
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
  public constructor(filepath: string) {
    super(filepath);

    this.#createTable();
  }

  public changePersonalEmoteSets(guildId: string, personalEmoteSets: PersonalEmoteSets): void {
    const { sevenTv, bttv, ffz } = personalEmoteSets;
    if (this.#rowExists(guildId)) {
      const statement = this.databaseSync.prepare(
        `UPDATE ${TABLE_NAME} SET sevenTv = (?), bttv = (?), ffz = (?) WHERE guildId = (?)`
      );
      statement.run(sevenTv, bttv, ffz, guildId);
    } else {
      const statement = this.databaseSync.prepare(
        `INSERT INTO ${TABLE_NAME} VALUES (?, ?, ?, ?, ?)`
      );
      statement.run(guildId, null, sevenTv, bttv, ffz);
    }
  }

  public changeBroadcasterName(guildId: string, broadcasterName: string): void {
    if (this.#rowExists(guildId)) {
      const statement = this.databaseSync.prepare(
        `UPDATE ${TABLE_NAME} SET broadcasterName = (?) WHERE guildId = (?)`
      );
      statement.run(broadcasterName, guildId);
    } else {
      const statement = this.databaseSync.prepare(
        `INSERT INTO ${TABLE_NAME} VALUES (?, ?, ?, ?, ?)`
      );
      statement.run(guildId, broadcasterName, null, null, null);
    }
  }

  public getPersonalEmoteSets(guildId: string): readonly [string | null, PersonalEmoteSets] {
    const statement = this.databaseSync.prepare(
      `SELECT broadcasterName, sevenTv, bttv, ffz FROM ${TABLE_NAME} WHERE guildId = (?)`
    );
    const databaseBroadcasterNamesAndPersonalEmoteSets = statement.get(guildId) as Omit<
      DatabaseBroadcasterNamesAndPersonalEmoteSets,
      'guildId'
    >;

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
    const statement = this.databaseSync.prepare(
      `SELECT guildId, broadcasterName, sevenTv, bttv, ffz FROM ${TABLE_NAME}`
    );
    const databaseBroadcasterNamesAndPersonalEmoteSetsArray =
      statement.all() as DatabaseBroadcasterNamesAndPersonalEmoteSets[];
    const map = new Map<string, readonly [string | null, PersonalEmoteSets]>();

    databaseBroadcasterNamesAndPersonalEmoteSetsArray.forEach(
      (databaseBroadcasterNamesAndPersonalEmoteSets) => {
        map.set(databaseBroadcasterNamesAndPersonalEmoteSets.guildId, [
          databaseBroadcasterNamesAndPersonalEmoteSets.broadcasterName,
          new PersonalEmoteSets(
            databaseBroadcasterNamesAndPersonalEmoteSets.sevenTv,
            databaseBroadcasterNamesAndPersonalEmoteSets.bttv,
            databaseBroadcasterNamesAndPersonalEmoteSets.ffz
          )
        ]);
      }
    );

    return map;
  }

  #createTable(): void {
    this.databaseSync.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        guildId TEXT NOT NULL PRIMARY KEY,
        broadcasterName TEXT,
        sevenTv TEXT,
        bttv TEXT,
        ffz TEXT
      ) STRICT;
    `);
  }

  #rowExists(guildId: string): boolean {
    const statement = this.databaseSync.prepare(
      `SELECT guildId FROM ${TABLE_NAME} WHERE guildId = (?)`
    );
    const row = statement.get(guildId);

    if (row !== undefined) return true;
    return false;
  }
}
