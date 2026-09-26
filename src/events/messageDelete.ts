import type { Message, PartialMessage } from 'discord.js';
import { config } from '../config.js';
import { ignoreUnknownMessage } from '../discordErrors.js';

export async function handleMessageDelete(message: Message | PartialMessage): Promise<void> {
  if (message.channelId !== config.channelId) return;
  if (message.author && message.author.id !== config.ianId) return;
  if (!message.channel.isTextBased() || message.channel.isDMBased()) return;

  const recent = await message.channel.messages.fetch({ limit: 100 });
  const taskReply = recent.find(
    (m) => m.author.id === message.client.user.id && m.reference?.messageId === message.id,
  );
  if (taskReply) await ignoreUnknownMessage(taskReply.delete());
}
