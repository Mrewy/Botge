/** @format */

import type { SqlJsStatic } from 'sql.js';

import type { Quote } from '../types.ts';
import { BaseDatabase } from './base-database.ts';

const TABLE_NAME = 'quote' as const;

function getTableName(userId: string): string {
  return `${TABLE_NAME}_${userId}`;
}

type QuoteOnlyNameAndContent = Omit<Quote, 'dateAdded'>;
type DatabaseQuote = QuoteOnlyNameAndContent & { readonly dateAdded: number };

export class QuotesDatabase extends BaseDatabase {
  public constructor(filepath: string, sqlJsStatic: SqlJsStatic) {
    super(filepath, sqlJsStatic);
  }

  public insert(userId: string, quote: Quote): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) this.#createTable(userId);

    const statement = this.database.prepare(`INSERT INTO ${tableName} (name,content,dateAdded) VALUES (?,?,?)`);
    const { content, name, dateAdded } = quote;
    statement.run([name, content, dateAdded.getTime()]);
    statement.free();

    this.exportDatabase();
  }

  public delete(userId: string, quote: QuoteOnlyNameAndContent): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return;

    const statement = this.database.prepare(`DELETE FROM ${tableName} WHERE content=(?) AND name=(?)`);
    const { content, name } = quote;
    statement.run([content, name]);
    statement.free();

    this.exportDatabase();
  }

  public rename(userId: string, content: string, name: string): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return;

    const statement = this.database.prepare(`UPDATE ${tableName} SET name=(?) WHERE content=(?)`);
    statement.run([name, content]);
    statement.free();

    this.exportDatabase();
  }

  public getQuoteName(userId: string, content: string): string | undefined {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return undefined;

    const statement = this.database.prepare(`SELECT name FROM ${tableName} WHERE content=(?)`);
    const rows = statement.get([content]) as readonly string[];
    statement.free();

    if (rows.length === 1) return rows[0];
    return undefined;
  }

  public getQuoteContent(userId: string, name: string): string | undefined {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return undefined;

    const quoteArray = this.getAll_(`SELECT content, dateAdded FROM ${tableName} WHERE name LIKE '%' || (?) || '%'`, [
      name
    ]) as readonly Omit<DatabaseQuote, 'name'>[];

    if (quoteArray.length === 0) return undefined;
    return [...quoteArray].sort((a, b) => b.dateAdded - a.dateAdded)[0].content;
  }

  public getAllQuote(userId: string): readonly Quote[] {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return [];

    const databaseQuoteArray = this.getAll_(
      `SELECT name, content, dateAdded FROM ${tableName}`
    ) as readonly DatabaseQuote[];

    const quoteArray: Quote[] = databaseQuoteArray.map((databaseQuote) => {
      return { name: databaseQuote.name, content: databaseQuote.content, dateAdded: new Date(databaseQuote.dateAdded) };
    });
    return [...quoteArray].sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
  }

  public quoteContentExists(userId: string, content: string): boolean {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return false;

    const statement = this.database.prepare(`SELECT content FROM ${tableName} WHERE content=(?)`);
    const rows = statement.get([content]);
    statement.free();

    if (rows.length === 1) return true;
    return false;
  }

  public quoteNameExists(userId: string, name: string): boolean {
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
        content TEXT NOT NULL,
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
