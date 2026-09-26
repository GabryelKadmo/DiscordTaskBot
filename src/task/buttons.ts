import type { ButtonInteraction, Message } from 'discord.js';
import { config } from '../config.js';
import { ignoreUnknownMessage } from '../discordErrors.js';
import { replyEphemeral } from '../interactionReply.js';
import { getGuildSettings } from '../settings/store.js';
import { parseCustomId, type TaskAction } from './actions.js';
import { buildTaskComponents } from './components.js';
import { canPerform } from './permissions.js';
import { setStateReaction } from './reactions.js';

const inProgress = new Set<string>();

export async function handleTaskButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseCustomId(interaction.customId);
  if (!parsed) {
    await replyEphemeral(interaction, 'Esse botão não está mais disponível.');
    return;
  }

  if (!interaction.inCachedGuild()) {
    await replyEphemeral(interaction, 'Essa ação só funciona dentro de um servidor.');
    return;
  }

  const settings = getGuildSettings(interaction.guildId);
  if (interaction.channelId !== settings.channelId) {
    await replyEphemeral(interaction, 'Esse canal não é mais o canal de tasks.');
    return;
  }

  if (!canPerform(settings, parsed.action, interaction.member)) {
    await replyEphemeral(interaction, 'Você não tem permissão para essa ação.');
    return;
  }

  await runAction(interaction, parsed.action, parsed.messageId);
}

async function runAction(interaction: ButtonInteraction, action: TaskAction, messageId: string) {
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
      await replyEphemeral(interaction, 'A mensagem original dessa task não existe mais.');
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

async function fetchOriginal(interaction: ButtonInteraction, messageId: string): Promise<Message | null> {
  if (!interaction.channel) return null;
  return ignoreUnknownMessage(interaction.channel.messages.fetch({ message: messageId, force: true }));
}
