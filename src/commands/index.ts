import { Team, type ChatInputCommandInteraction } from 'discord.js';
import { replyEphemeral } from '../interactionReply.js';
import { handleHelpCommand, helpCommand } from './help.js';
import { handleTasksCommand, tasksCommand } from './tasks.js';

export const commandDefinitions = [helpCommand, tasksCommand].map((command) => command.toJSON());

export async function handleCommand(interaction: ChatInputCommandInteraction) {
  if (interaction.commandName === 'help') {
    await handleHelpCommand(interaction);
    return;
  }

  if (interaction.commandName === 'tasks') {
    if (!interaction.inCachedGuild()) {
      await replyEphemeral(interaction, 'Esse comando só funciona dentro de um servidor.');
      return;
    }
    if (interaction.user.id !== (await getBotOwnerId(interaction))) {
      await replyEphemeral(interaction, 'Só o dono do bot pode configurar as tasks.');
      return;
    }
    await handleTasksCommand(interaction);
  }
}

let botOwnerId: string | undefined;

async function getBotOwnerId(interaction: ChatInputCommandInteraction): Promise<string | undefined> {
  if (botOwnerId) return botOwnerId;
  const { owner } = await interaction.client.application.fetch();
  botOwnerId = owner instanceof Team ? owner.ownerId ?? undefined : owner?.id;
  return botOwnerId;
}
