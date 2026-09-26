import { MessageFlags, type RepliableInteraction } from 'discord.js';

export async function replyEphemeral(interaction: RepliableInteraction, content: string) {
  const options = { content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } } as const;
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(options);
  } else {
    await interaction.reply(options);
  }
}
