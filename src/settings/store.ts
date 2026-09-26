import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PermissionAction } from '../task/actions.js';

export type Target = { type: 'user' | 'role'; id: string };

export type GuildSettings = {
  channelId: string | null;
  mention: Target | null;
  permissions: Record<PermissionAction, Target[]>;
};

const FILE = path.resolve('data', 'settings.json');

const settingsByGuild: Record<string, GuildSettings> = existsSync(FILE)
  ? JSON.parse(readFileSync(FILE, 'utf8'))
  : {};

function emptyPermissions(): Record<PermissionAction, Target[]> {
  return { create: [], copy: [], start: [], complete: [], delete: [] };
}

export function getGuildSettings(guildId: string): GuildSettings {
  const stored = settingsByGuild[guildId];
  return {
    channelId: stored?.channelId ?? null,
    mention: stored?.mention ?? null,
    permissions: { ...emptyPermissions(), ...stored?.permissions },
  };
}

export async function updateGuildSettings(guildId: string, update: (settings: GuildSettings) => void) {
  const settings = structuredClone(getGuildSettings(guildId));
  update(settings);
  settingsByGuild[guildId] = settings;
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(settingsByGuild, null, 2));
}

export function formatTarget(target: Target): string {
  return target.type === 'user' ? `<@${target.id}>` : `<@&${target.id}>`;
}
