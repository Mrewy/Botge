/** @format */

export class PersonalEmoteSets {
  readonly #sevenTv: string | null;
  readonly #bttv: string | null;
  readonly #ffz: string | null;

  public constructor(sevenTv: string | null, bttv: string | null, ffz: string | null) {
    if (arguments.length === 0 || (sevenTv === null && bttv === null && ffz === null))
      throw new Error('at least 1 argument has to be non-null.');

    this.#sevenTv = sevenTv;
    this.#bttv = bttv;
    this.#ffz = ffz;
  }

  public get sevenTv(): string | null {
    return this.#sevenTv;
  }

  public get bttv(): string | null {
    return this.#bttv;
  }

  public get ffz(): string | null {
    return this.#ffz;
  }
}
