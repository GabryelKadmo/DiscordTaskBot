import type { GuildMember } from 'discord.js';
import type { GuildSettings } from '../settings/store.js';
import type { PermissionAction } from './actions.js';

export function canPerform(settings: GuildSettings, action: PermissionAction, member: GuildMember): boolean {
  return settings.permissions[action].some((target) =>
    target.type === 'user' ? target.id === member.id : member.roles.cache.has(target.id),
  );
}
