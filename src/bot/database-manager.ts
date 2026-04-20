/** @format */

import type { BroadcasterNameAndPersonalEmoteSetsDatabase } from '../database/broadcaster-name-and-personal-emote-sets-database.ts';
import type { PermittedRoleIdsDatabase } from '../database/permitted-role-ids-database.ts';
import type { AddedEmotesDatabase } from '../database/added-emotes-database.ts';
import type { MediaDatabase } from '../database/media-database.ts';
import type { QuotesDatabase } from '../database/quotes-database.ts';
import type { PingsDatabase } from '../database/pings-database.ts';
import type { UsersDatabase } from '../database/users-database.ts';

export class DatabaseManager {
  readonly #broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>;
  readonly #permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>;
  readonly #addedEmotesDatabase: Readonly<AddedEmotesDatabase>;
  readonly #mediaDatabase: Readonly<MediaDatabase>;
  readonly #quoteDatabase: Readonly<QuotesDatabase>;
  readonly #pingsDatabase: Readonly<PingsDatabase>;
  readonly #usersDatabase: Readonly<UsersDatabase>;

  public constructor(
    broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>,
    permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>,
    addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
    mediaDatabase: Readonly<MediaDatabase>,
    quoteDatabase: Readonly<QuotesDatabase>,
    pingsDatabase: Readonly<PingsDatabase>,
    usersDatabase: Readonly<UsersDatabase>
  ) {
    this.#broadcasterNameAndPersonalEmoteSetsDatabase = broadcasterNameAndPersonalEmoteSetsDatabase;
    this.#permittedRoleIdsDatabase = permittedRoleIdsDatabase;
    this.#addedEmotesDatabase = addedEmotesDatabase;
    this.#mediaDatabase = mediaDatabase;
    this.#quoteDatabase = quoteDatabase;
    this.#pingsDatabase = pingsDatabase;
    this.#usersDatabase = usersDatabase;
  }

  public get broadcasterNameAndPersonalEmoteSetsDatabase(): Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase> {
    return this.#broadcasterNameAndPersonalEmoteSetsDatabase;
  }
  public get permittedRoleIdsDatabase(): Readonly<PermittedRoleIdsDatabase> {
    return this.#permittedRoleIdsDatabase;
  }
  public get addedEmotesDatabase(): Readonly<AddedEmotesDatabase> {
    return this.#addedEmotesDatabase;
  }
  public get mediaDatabase(): Readonly<MediaDatabase> {
    return this.#mediaDatabase;
  }
  public get quoteDatabase(): Readonly<QuotesDatabase> {
    return this.#quoteDatabase;
  }
  public get pingsDatabase(): Readonly<PingsDatabase> {
    return this.#pingsDatabase;
  }
  public get usersDatabase(): Readonly<UsersDatabase> {
    return this.#usersDatabase;
  }

  public closeDatabases(): void {
    this.#broadcasterNameAndPersonalEmoteSetsDatabase.close();
    this.#permittedRoleIdsDatabase.close();
    this.#addedEmotesDatabase.close();
    this.#mediaDatabase.close();
    this.#quoteDatabase.close();
    this.#pingsDatabase.close();
    this.#usersDatabase.close();
  }
}
