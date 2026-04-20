/** @format */

import type { SqlJsStatic } from 'sql.js';

import type { Media } from '../types.ts';
import { BaseDatabase } from './base-database.ts';

const TABLE_NAME = 'media' as const;

function getTableName(userId: string): string {
  return `${TABLE_NAME}_${userId}`;
}

type MediaOnlyNameAndLink = Omit<Media, 'dateAdded' | 'tenorUrl'>;
type DatabaseMedia = MediaOnlyNameAndLink & { readonly dateAdded: number };

export class MediaDatabase extends BaseDatabase {
  public constructor(filepath: string, sqlJsStatic: SqlJsStatic) {
    super(filepath, sqlJsStatic);
  }

  public insert(userId: string, media: Media): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) this.#createTable(userId);

    const statement = this.database.prepare(`INSERT INTO ${tableName} (name,url,dateAdded) VALUES (?,?,?)`);
    const { url, name, dateAdded } = media;
    statement.run([name, url, dateAdded.getTime()]);
    statement.free();

    this.exportDatabase();
  }

  public delete(userId: string, media: MediaOnlyNameAndLink): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return;

    const statement = this.database.prepare(`DELETE FROM ${tableName} WHERE url=(?) AND name=(?)`);
    const { url, name } = media;
    statement.run([url, name]);
    statement.free();

    this.exportDatabase();
  }

  public rename(userId: string, url: string, name: string): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return;

    const statement = this.database.prepare(`UPDATE ${tableName} SET name=(?) WHERE url=(?)`);
    statement.run([name, url]);
    statement.free();

    this.exportDatabase();
  }

  public getMediaName(userId: string, url: string): string | undefined {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return undefined;

    const statement = this.database.prepare(`SELECT name FROM ${tableName} WHERE url=(?)`);
    const rows = statement.get([url]) as readonly string[];
    statement.free();

    if (rows.length === 1) return rows[0];
    return undefined;
  }

  public getMediaUrl(userId: string, name: string): string | undefined {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return undefined;

    const mediaArray = this.getAll_(`SELECT url, dateAdded FROM ${tableName} WHERE name LIKE '%' || (?) || '%'`, [
      name
    ]) as readonly Omit<DatabaseMedia, 'name'>[];

    if (mediaArray.length === 0) return undefined;
    return [...mediaArray].sort((a, b) => b.dateAdded - a.dateAdded)[0].url;
  }

  public getAllMedia(userId: string): readonly Media[] {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return [];

    const databaseMediaArray = this.getAll_(
      `SELECT name, url, dateAdded FROM ${tableName}`
    ) as readonly DatabaseMedia[];

    const mediaArray: Media[] = databaseMediaArray.map((databaseMedia) => {
      return { name: databaseMedia.name, url: databaseMedia.url, dateAdded: new Date(databaseMedia.dateAdded) };
    });
    return [...mediaArray].sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
  }

  public mediaUrlExists(userId: string, url: string): boolean {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return false;

    const statement = this.database.prepare(`SELECT url FROM ${tableName} WHERE url=(?)`);
    const rows = statement.get([url]);
    statement.free();

    if (rows.length === 1) return true;
    return false;
  }

  public mediaNameExists(userId: string, name: string): boolean {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return false;

    const statement = this.database.prepare(`SELECT name FROM ${tableName} WHERE name=(?)`);
    const rows = statement.get([name]);
    statement.free();

    if (rows.length === 1) return true;
    return false;
  }

  #createTable(userId: string): void {
    const tableName = getTableName(userId);

    const statement = this.database.prepare(`
      CREATE TABLE ${tableName} (
        name TEXT NOT NULL PRIMARY KEY,
        url TEXT NOT NULL,
        dateAdded INTEGER NOT NULL
      );
    `);
    statement.run();
    statement.free();

    this.exportDatabase();
  }

  #tableExists(tableName: string): boolean {
    const statement = this.database.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=(?)`);
    const rows = statement.get([tableName]);
    statement.free();

    if (rows.length === 1) return true;
    return false;
  }
}
