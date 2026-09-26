import type { ChatInputCommandInteraction } from 'discord.js';
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
    await handleTasksCommand(interaction);
  }
}
