/** @format */

import type { Quote } from '../types.ts';
import { BaseDatabase } from './base-database.ts';

const TABLE_NAME = 'quote' as const;

function getTableName(userId: string): string {
  return `${TABLE_NAME}_${userId}`;
}

type QuoteOnlyNameAndContent = Omit<Quote, 'dateAdded'>;
type DatabaseQuote = QuoteOnlyNameAndContent & { readonly dateAdded: number };

export class QuotesDatabase extends BaseDatabase {
  public constructor(filepath: string) {
    super(filepath);
  }

  public insert(userId: string, quote: Quote): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) this.#createTable(userId);

    const { content, name, dateAdded } = quote;
    const statement = this.databaseSync.prepare(
      `INSERT INTO ${tableName} (name, content, dateAdded) VALUES (?, ?, ?)`
    );
    statement.run(name, content, dateAdded.getTime());
  }

  public delete(userId: string, quote: QuoteOnlyNameAndContent): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return;

    const { content, name } = quote;
    const statement = this.databaseSync.prepare(
      `DELETE FROM ${tableName} WHERE content = (?) AND name = (?)`
    );
    statement.run(content, name);
  }

  public rename(userId: string, content: string, name: string): void {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return;

    const statement = this.databaseSync.prepare(
      `UPDATE ${tableName} SET name = (?) WHERE content = (?)`
    );
    statement.run(name, content);
  }

  public getQuoteName(userId: string, content: string): string | undefined {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return undefined;

    const statement = this.databaseSync.prepare(
      `SELECT name FROM ${tableName} WHERE content = (?)`
    );
    const row = statement.get(content) as { readonly name: string } | undefined;

    if (row !== undefined) return row.name;
    return undefined;
  }

  public getQuoteContent(userId: string, name: string): string | undefined {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return undefined;

    const statement = this.databaseSync.prepare(
      `SELECT content, dateAdded FROM ${tableName} WHERE name LIKE '%' || (?) || '%'`
    );
    const quoteArray = statement.all(name) as Omit<DatabaseQuote, 'name'>[];

    if (quoteArray.length === 0) return undefined;
    return [...quoteArray].sort((a, b) => b.dateAdded - a.dateAdded)[0].content;
  }

  public getAllQuote(userId: string): readonly Quote[] {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return [];

    const statement = this.databaseSync.prepare(
      `SELECT name, content, dateAdded FROM ${tableName}`
    );
    const databaseQuoteArray = statement.all() as DatabaseQuote[];

    const quoteArray: Quote[] = databaseQuoteArray.map((databaseQuote) => {
      return {
        name: databaseQuote.name,
        content: databaseQuote.content,
        dateAdded: new Date(databaseQuote.dateAdded)
      };
    });
    return [...quoteArray].sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
  }

  public quoteContentExists(userId: string, content: string): boolean {
    const tableName = getTableName(userId);
    if (!this.#tableExists(tableName)) return false;

    const statement = this.databaseSync.prepare(
      `SELECT content FROM ${tableName} WHERE content = (?)`
    );
    const row = statement.get(content);

    if (row !== undefined) return true;
    return false;
  }

  public quoteNameExists(userId: string, name: string): boolean {
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
        content TEXT NOT NULL,
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
