import type { Message, PartialMessage } from 'discord.js';
import { ignoreUnknownMessage } from '../discordErrors.js';
import { getGuildSettings } from '../settings/store.js';

export async function handleMessageDelete(message: Message | PartialMessage): Promise<void> {
  if (!message.guildId || message.author?.bot) return;
  if (message.channelId !== getGuildSettings(message.guildId).channelId) return;
  if (!message.channel.isTextBased() || message.channel.isDMBased()) return;

  const recent = await message.channel.messages.fetch({ limit: 100 });
  const taskReply = recent.find(
    (m) => m.author.id === message.client.user.id && m.reference?.messageId === message.id,
  );
  if (taskReply) await ignoreUnknownMessage(taskReply.delete());
}
