/** @format */

import type { Guild } from './guild.ts';

export class User {
  readonly #id: string;
  #guild: Readonly<Guild>;

  public constructor(id: string, guild: Readonly<Guild>) {
    this.#id = id;
    this.#guild = guild;
  }

  public get id(): string {
    return this.#id;
  }
  public get guild(): Readonly<Guild> {
    return this.#guild;
  }

  public changeGuild(guild: Readonly<Guild>): void {
    this.#guild = guild;
  }
}
