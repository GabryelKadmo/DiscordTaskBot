import type { Message } from 'discord.js';
import { config } from '../config.js';
import { formatTarget, getGuildSettings } from '../settings/store.js';
import { buildTaskComponents } from '../task/components.js';
import { canPerform } from '../task/permissions.js';

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot || message.system || !message.inGuild()) return;

  const settings = getGuildSettings(message.guildId);
  if (message.channelId !== settings.channelId) return;

  const member = message.member ?? (await message.guild.members.fetch(message.author.id));
  if (!canPerform(settings, 'create', member)) return;

  const { mention } = settings;
  await message.react(config.emojis.received);
  await message.reply({
    content: mention ? formatTarget(mention) : undefined,
    components: buildTaskComponents('pending', message.id),
    allowedMentions: {
      users: mention?.type === 'user' ? [mention.id] : [],
      roles: mention?.type === 'role' ? [mention.id] : [],
      repliedUser: false,
    },
  });
}
