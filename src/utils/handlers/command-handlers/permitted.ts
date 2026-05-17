/** @format */

import type { Role, GuildMember, Guild } from 'discord.js';

export function administrator(memberRolesCache: readonly (readonly [string, Role])[]): boolean {
  const memberRoles: readonly Role[] = memberRolesCache.map((memberRolesCacheElement) => memberRolesCacheElement[1]);
  return memberRoles.some((memberRole) => memberRole.permissions.has('Administrator'));
}

export function permitted(
  memberRolesCache: readonly (readonly [string, Role])[],
  permittedRoleIds: readonly string[] | null
): boolean {
  if (administrator(memberRolesCache)) return true;
  if (permittedRoleIds === null) return false;

  const memberRoleIds: readonly string[] = memberRolesCache.map(
    (memberRolesCacheElement) => memberRolesCacheElement[0]
  );
  const intersection: readonly string[] = permittedRoleIds.filter((permittedRoleId) =>
    memberRoleIds.includes(permittedRoleId)
  );
  return intersection.length !== 0;
}

export function owner(member: GuildMember, guild: Guild): boolean {
  if (member.user.id === guild.ownerId) return true;
  return false;
}

export function globalAdministrator(member: GuildMember): boolean {
  const { username } = member.user;

  if (username === 'gentlebob' || username === 'mrewy') return true;
  return false;
}
