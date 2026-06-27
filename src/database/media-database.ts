/** @format */

import type { Media } from '../types.ts';
import { BaseDatabase } from './base-database.ts';

const TABLE_NAME = 'media' as const;

function getTableName(userId: string): string {
  return `${TABLE_NAME}_${userId}`;
}

type MediaOnlyNameAndLink = Omit<Media, 'dateAdded' | 'tenorUrl'>;
type DatabaseMedia = MediaOnlyNameAndLink & { readonly dateAdded: number };

export class MediaDatabase extends BaseDatabase {
  public constructor(filepath: string) {
    super(filepath);
  }

  public insert(userId: string, media: Media): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) this.#createTable(userId);

    const { url, name, dateAdded } = media;
    const statement = this.databaseSync.prepare(
      `INSERT INTO ${tableName} (name, url, dateAdded) VALUES (?, ?, ?)`
    );
    statement.run(name, url, dateAdded.getTime());
  }

  public delete(userId: string, media: MediaOnlyNameAndLink): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return;

    const { url, name } = media;
    const statement = this.databaseSync.prepare(
      `DELETE FROM ${tableName} WHERE url = (?) AND name = (?)`
    );
    statement.run(url, name);
  }

  public rename(userId: string, url: string, name: string): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return;

    const statement = this.databaseSync.prepare(
      `UPDATE ${tableName} SET name = (?) WHERE url = (?)`
    );
    statement.run(name, url);
  }

  public getMediaName(userId: string, url: string): string | undefined {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return undefined;

    const statement = this.databaseSync.prepare(`SELECT name FROM ${tableName} WHERE url = (?)`);
    const row = statement.get(url) as
      | {
          readonly name: string;
        }
      | undefined;

    if (row !== undefined) return row.name;
    return undefined;
  }

  public getMediaUrl(userId: string, name: string): string | undefined {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return undefined;

    const statement = this.databaseSync.prepare(
      `SELECT url, dateAdded FROM ${tableName} WHERE name LIKE '%' || (?) || '%'`
    );
    const mediaArray = statement.all(name) as Omit<DatabaseMedia, 'name'>[];

    if (mediaArray.length === 0) return undefined;
    return [...mediaArray].sort((a, b) => b.dateAdded - a.dateAdded)[0].url;
  }

  public getAllMedia(userId: string): readonly Media[] {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return [];

    const statement = this.databaseSync.prepare(`SELECT name, url, dateAdded FROM ${tableName}`);
    const databaseMediaArray = statement.all() as DatabaseMedia[];

    const mediaArray: Media[] = databaseMediaArray.map((databaseMedia) => {
      return {
        name: databaseMedia.name,
        url: databaseMedia.url,
        dateAdded: new Date(databaseMedia.dateAdded)
      };
    });
    return [...mediaArray].sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
  }

  public mediaUrlExists(userId: string, url: string): boolean {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return false;

    const statement = this.databaseSync.prepare(`SELECT url FROM ${tableName} WHERE url = (?)`);
    const row = statement.get(url);

    if (row !== undefined) return true;
    return false;
  }

  public mediaNameExists(userId: string, name: string): boolean {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return false;

    const statement = this.databaseSync.prepare(`SELECT name FROM ${tableName} WHERE name = (?)`);
    const row = statement.get(name);

    if (row !== undefined) return true;
    return false;
  }

  #createTable(userId: string): void {
    const tableName = getTableName(userId);

    this.databaseSync.exec(`
      CREATE TABLE ${tableName} (
        name TEXT NOT NULL PRIMARY KEY,
        url TEXT NOT NULL,
        dateAdded INTEGER NOT NULL
      ) STRICT;
    `);
  }

  #tableExists(tableName: string): boolean {
    const statement = this.databaseSync.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = (?)`
    );
    const row = statement.get(tableName);

    if (row !== undefined) return true;
    return false;
  }
}
