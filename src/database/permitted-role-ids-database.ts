/** @format */

import { BaseDatabase } from './base-database.ts';

const TABLE_NAME = 'settingsPermittedRoleIds' as const;

function getTableName(guildId: string): string {
  return `${TABLE_NAME}_${guildId}`;
}

const SETTINGS_ID_TYPE = 'settingsType' as const;
const ADD_EMOTE_ID_TYPE = 'addEmoteType' as const;
const ROLE_IDS_SEPARATOR = ',' as const;

export class PermittedRoleIdsDatabase extends BaseDatabase {
  public constructor(filepath: string) {
    super(filepath);
  }

  public changeSettingsPermittedRoleIds(guildId: string, roleIds: readonly string[]): void {
    const tableName = getTableName(guildId);
    this.#changePermittedRoleIds(tableName, SETTINGS_ID_TYPE, roleIds);
  }

  public changeAddEmotePermittedRoleIds(guildId: string, roleIds: readonly string[]): void {
    const tableName = getTableName(guildId);
    this.#changePermittedRoleIds(tableName, ADD_EMOTE_ID_TYPE, roleIds);
  }

  public changeAllowEveryoneToAddEmote(guildId: string, permitNoRole: boolean): void {
    const tableName = getTableName(guildId);
    this.#insertIfIdTypeDoesntExist(tableName, ADD_EMOTE_ID_TYPE, null, Number(permitNoRole));

    const statement = this.databaseSync.prepare(
      `UPDATE ${tableName} SET permitNoRole = (?) WHERE idType = (?)`
    );
    statement.run(Number(permitNoRole), ADD_EMOTE_ID_TYPE);
  }

  public getSettingsPermittedRoleIds(guildId: string): readonly string[] | null {
    const tableName = getTableName(guildId);

    if (!this.#idTypeExists(tableName, SETTINGS_ID_TYPE)) return null;
    return this.#getRoleIds(tableName, SETTINGS_ID_TYPE);
  }

  public getAddEmotePermittedRoleIds(guildId: string): readonly string[] | null {
    const tableName = getTableName(guildId);

    if (!this.#idTypeExists(tableName, ADD_EMOTE_ID_TYPE)) return null;
    return this.#getRoleIds(tableName, ADD_EMOTE_ID_TYPE);
  }

  public getAddEmotePermitNoRole(guildId: string): boolean {
    const tableName = getTableName(guildId);
    if (!this.#idTypeExists(tableName, ADD_EMOTE_ID_TYPE)) return false;

    const statement = this.databaseSync.prepare(
      `SELECT permitNoRole FROM ${tableName} WHERE idType = (?)`
    );
    const permitNoRole = statement.get(ADD_EMOTE_ID_TYPE) as
      { readonly permitNoRole: number } | undefined;

    return Boolean(permitNoRole?.permitNoRole);
  }

  public createTable(guildId: string): void {
    const tableName = getTableName(guildId);

    this.databaseSync.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        idType TEXT NOT NULL PRIMARY KEY,
        roleIds TEXT,
        permitNoRole INTEGER NOT NULL
      ) STRICT;
    `);
  }

  #idTypeExists(tableName: string, idType: string): boolean {
    const statement = this.databaseSync.prepare(
      `SELECT idType FROM ${tableName} WHERE idType = (?)`
    );
    const row = statement.get(idType);

    if (row !== undefined) return true;
    return false;
  }

  #insertIfIdTypeDoesntExist(
    tableName: string,
    idType: string,
    roleIds: string | null,
    permitNoRole: number
  ): void {
    if (this.#idTypeExists(tableName, idType)) return;

    const statement = this.databaseSync.prepare(
      `INSERT INTO ${tableName} (idType, roleIds, permitNoRole) VALUES (?, ?, ?)`
    );
    statement.run(idType, roleIds, permitNoRole);
  }

  #changePermittedRoleIds(tableName: string, idType: string, roleIds: readonly string[]): void {
    const roleIdsJoined = roleIds.length !== 0 ? roleIds.join(ROLE_IDS_SEPARATOR) : null;

    this.#insertIfIdTypeDoesntExist(tableName, idType, roleIdsJoined, Number(false));

    const statement = this.databaseSync.prepare(
      `UPDATE ${tableName} SET roleIds = (?) WHERE idType = (?)`
    );
    statement.run(roleIdsJoined, idType);
  }

  #getRoleIds(tableName: string, idType: string): readonly string[] | null {
    const statement = this.databaseSync.prepare(
      `SELECT roleIds FROM ${tableName} WHERE idType = (?)`
    );
    const roleIds = statement.get(idType) as { readonly roleIds: string | null } | undefined;

    if (roleIds !== undefined && roleIds.roleIds !== null)
      return roleIds.roleIds.split(ROLE_IDS_SEPARATOR);
    return null;
  }
}
