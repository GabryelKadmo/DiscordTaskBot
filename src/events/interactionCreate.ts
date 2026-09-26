import type { Interaction } from 'discord.js';
import { handleCommand } from '../commands/index.js';
import { replyEphemeral } from '../interactionReply.js';
import { handleTaskButton } from '../task/buttons.js';

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  if (!interaction.isButton() && !interaction.isChatInputCommand()) return;

  try {
    if (interaction.isButton()) await handleTaskButton(interaction);
    else await handleCommand(interaction);
  } catch (error) {
    console.error('Falha ao processar interação:', error);
    await replyEphemeral(interaction, 'Não foi possível concluir a ação. Tente novamente.').catch(() => {});
  }
}
