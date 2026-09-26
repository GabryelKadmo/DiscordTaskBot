import {
  AttachmentBuilder,
  MessageFlags,
  type ButtonInteraction,
  type Interaction,
  type Message,
} from 'discord.js';
import { config } from '../config.js';
import { ignoreUnknownMessage } from '../discordErrors.js';
import { canPerform, parseCustomId, type TaskAction } from '../task/actions.js';
import { buildTaskComponents } from '../task/components.js';
import { setStateReaction } from '../task/reactions.js';

const CODE_BLOCK_LIMIT = 2000 - '```\n\n```'.length;
const inProgress = new Set<string>();

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  if (!interaction.isButton()) return;

  const parsed = parseCustomId(interaction.customId);
  if (!parsed || interaction.channelId !== config.channelId) return;

  try {
    await runAction(interaction, parsed.action, parsed.messageId);
  } catch (error) {
    console.error(`Falha ao executar a ação "${parsed.action}":`, error);
    await replyEphemeral(interaction, 'Não foi possível concluir a ação. Tente novamente.').catch(() => {});
  }
}

async function runAction(interaction: ButtonInteraction, action: TaskAction, messageId: string) {
  if (!canPerform(action, interaction.user.id)) {
    await replyEphemeral(interaction, 'Você não tem permissão para essa ação.');
    return;
  }

  if (action === 'copy') {
    await copyTask(interaction, messageId);
    return;
  }

  if (inProgress.has(messageId)) {
    await replyEphemeral(interaction, 'Essa task já está sendo atualizada.');
    return;
  }

  inProgress.add(messageId);
  try {
    await interaction.deferUpdate();
    const original = await fetchOriginal(interaction, messageId);
    if (!original) {
      await ignoreUnknownMessage(interaction.message.delete());
      await interaction.followUp({ content: 'A mensagem original dessa task não existe mais.', flags: MessageFlags.Ephemeral });
      return;
    }

    if (action === 'start') {
      await setStateReaction(original, config.emojis.started);
      await interaction.editReply({ components: buildTaskComponents('started', messageId) });
    } else if (action === 'complete') {
      await setStateReaction(original, config.emojis.done);
      await interaction.editReply({ components: buildTaskComponents('done', messageId) });
    } else {
      await ignoreUnknownMessage(original.delete());
      await ignoreUnknownMessage(interaction.message.delete());
    }
  } finally {
    inProgress.delete(messageId);
  }
}

async function copyTask(interaction: ButtonInteraction, messageId: string) {
  const original = await fetchOriginal(interaction, messageId);
  if (!original) {
    await replyEphemeral(interaction, 'A mensagem original dessa task não existe mais.');
    return;
  }

  const content = original.content;
  if (!content) {
    await replyEphemeral(interaction, 'Essa task não possui texto.');
    return;
  }

  if (content.length <= CODE_BLOCK_LIMIT && !content.includes('```')) {
    await replyEphemeral(interaction, `\`\`\`\n${content}\n\`\`\``);
    return;
  }

  await interaction.reply({
    files: [new AttachmentBuilder(Buffer.from(content, 'utf8'), { name: 'task.txt' })],
    flags: MessageFlags.Ephemeral,
  });
}

async function fetchOriginal(interaction: ButtonInteraction, messageId: string): Promise<Message | null> {
  if (!interaction.channel) return null;
  return ignoreUnknownMessage(interaction.channel.messages.fetch({ message: messageId, force: true }));
}

async function replyEphemeral(interaction: ButtonInteraction, content: string) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
  } else {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  }
}
