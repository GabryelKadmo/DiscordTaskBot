import type { Message } from 'discord.js';
import { config } from '../config.js';

const stateEmojis = () => Object.values(config.emojis);

function reactionKey(emoji: string): string {
  return emoji.match(/^<a?:\w+:(\d+)>$/)?.[1] ?? emoji;
}

export async function setStateReaction(message: Message, emoji: string): Promise<void> {
  const botId = message.client.user.id;

  for (const other of stateEmojis()) {
    if (other === emoji) continue;
    const reaction = message.reactions.cache.get(reactionKey(other));
    if (reaction?.me) await reaction.users.remove(botId);
  }

  await message.react(emoji);
}
