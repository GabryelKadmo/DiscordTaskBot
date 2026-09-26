import type { Message } from 'discord.js';
import { config } from '../config.js';
import { buildTaskComponents } from '../task/components.js';

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot || message.system) return;
  if (message.channelId !== config.channelId) return;
  if (message.author.id !== config.ianId) return;

  await message.react(config.emojis.received);
  await message.reply({
    content: `<@${config.kadmoId}>`,
    components: buildTaskComponents('pending', message.id),
    allowedMentions: { users: [config.kadmoId], repliedUser: false },
  });
}
