/** @format */

// each pattern should have one and only one capturing group. usually just the entirety of path.
const rules: readonly (readonly [Readonly<RegExp>, string])[] = [
  [new RegExp(/https:\/\/cdn.7tv.app(.*)/), '/7tv'],
  [new RegExp(/https:\/\/cdn.betterttv.net(.*)/), '/bttv'],
  [new RegExp(/https:\/\/cdn.frankerfacez.com(.*)/), '/ffz'],
  [new RegExp(/https:\/\/static-cdn.jtvnw.net(.*)/), '/twitch']
];

export class CachedUrl {
  readonly #base: string | undefined;

  public constructor(base: string | undefined) {
    this.#base = base;
  }

  // translate remote url like https://cdn.tv.app/xxx to a local one pointing to cached data on disk.
  // returns [localUrl, false]. if a url is not supported, returns [remoteUrl, false]
  public get(remoteUrl: string): readonly [string, boolean] {
    if (this.#base === undefined) return [remoteUrl, false];

    for (const [regex, prefix] of rules) {
      const match = remoteUrl.match(regex);

      if (match === null) continue;
      return [this.#base + prefix + match[1], true];
    }

    return [remoteUrl, false];
  }
}
