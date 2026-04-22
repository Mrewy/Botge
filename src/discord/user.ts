/** @format */

import { DEFAULT_EMOTE_BORDER_COLOR } from '../database/users-database.ts';
import type { Guild } from './guild.ts';

export class User {
  readonly #id: string;
  #guild: Readonly<Guild> | undefined;
  #enableEmoteBorder: boolean | undefined;
  #emoteBorderColor: string | undefined;
  // #emoteBorderOpacity: string | undefined;

  public constructor(
    id: string,
    guild: Readonly<Guild> | undefined,
    enableEmoteBorder: boolean | undefined,
    emoteBorderColor: string | undefined
    // emoteBorderOpacity: string | undefined
  ) {
    this.#id = id;
    this.#guild = guild;
    this.#enableEmoteBorder = enableEmoteBorder;

    if (emoteBorderColor !== undefined) this.#emoteBorderColor = emoteBorderColor;
    else this.#emoteBorderColor = DEFAULT_EMOTE_BORDER_COLOR;

    // this.#emoteBorderOpacity = emoteBorderOpacity;
  }

  public get id(): string {
    return this.#id;
  }
  public get guild(): Readonly<Guild> | undefined {
    return this.#guild;
  }
  public get enableEmoteBorder(): boolean | undefined {
    return this.#enableEmoteBorder;
  }
  public get emoteBorderColor(): string | undefined {
    return this.#emoteBorderColor;
  }
  /*
  public get emoteBorderOpacity(): string | undefined {
    return this.#emoteBorderOpacity;
  }
  */

  public changeGuild(guild: Readonly<Guild>): void {
    this.#guild = guild;
  }
  public changeEnableEmoteBorder(enableEmoteBorder: boolean): void {
    this.#enableEmoteBorder = enableEmoteBorder;
  }
  public changeEmoteBorderColor(emoteBorderColor: string): void {
    this.#emoteBorderColor = emoteBorderColor;
  }
  /*
  public changeEmoteBorderOpacity(emoteBorderOpacity: string): void {
    this.#emoteBorderOpacity = emoteBorderOpacity;
  }
  */
}
