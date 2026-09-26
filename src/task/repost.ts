import { AttachmentBuilder, type GuildMember, type Message, type Webhook } from 'discord.js';
import { formatTarget, type Target } from '../settings/store.js';
import { buildTaskComponents } from './components.js';

const MESSAGE_LIMIT = 2000;
const WEBHOOK_NAME = 'Tasks';
const webhooksByChannel = new Map<string, Webhook>();

async function getWebhook(message: Message<true>, channelId: string): Promise<Webhook> {
  const cached = webhooksByChannel.get(channelId);
  if (cached) return cached;

  const existing = await message.guild.channels.fetchWebhooks(channelId);
  const webhook =
    existing.find((w) => w.applicationId === message.client.application.id) ??
    (await message.guild.channels.createWebhook({ channel: channelId, name: WEBHOOK_NAME }));

  webhooksByChannel.set(channelId, webhook);
  return webhook;
}

export function mentionOptions(mention: Target | null) {
  return {
    users: mention?.type === 'user' ? [mention.id] : [],
    roles: mention?.type === 'role' ? [mention.id] : [],
  };
}

export async function repostAsTask(message: Message<true>, author: GuildMember, mention: Target | null) {
  const thread = message.channel.isThread() ? message.channel : null;
  const webhookChannelId = thread?.parentId ?? message.channelId;

  const mentionLine = mention ? `-# ${formatTarget(mention)}` : '';
  const fitsInMessage = message.content.length + mentionLine.length + 1 <= MESSAGE_LIMIT;
  const text = fitsInMessage ? message.content : '';
  const content = [text, mentionLine].filter(Boolean).join('\n');

  const files = message.attachments.map(
    (a) => new AttachmentBuilder(a.url, { name: a.name, description: a.description ?? undefined }),
  );
  if (!fitsInMessage) files.push(new AttachmentBuilder(Buffer.from(message.content, 'utf8'), { name: 'task.txt' }));

  try {
    const webhook = await getWebhook(message, webhookChannelId);
    return await webhook.send({
      content: content || undefined,
      username: author.displayName,
      avatarURL: author.displayAvatarURL(),
      files,
      components: buildTaskComponents('pending'),
      threadId: thread?.id,
      allowedMentions: mentionOptions(mention),
    });
  } catch (error) {
    webhooksByChannel.delete(webhookChannelId);
    throw error;
  }
}
