import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { config } from '../config.js';
import { replyEphemeral } from '../interactionReply.js';

export const helpCommand = new SlashCommandBuilder().setName('help').setDescription('Mostra como usar o bot');

export async function handleHelpCommand(interaction: ChatInputCommandInteraction) {
  const { received, started, done } = config.emojis;

  await replyEphemeral(
    interaction,
    [
      '## Tasks',
      `Quem tem permissão **Criar** manda uma mensagem no canal de tasks. O bot reage com ${received} e responde mencionando o responsável, com os botões:`,
      `- **Iniciar** — marca como em andamento (${started})`,
      `- **Concluir** — marca como concluída (${done})`,
      '- **Excluir** — apaga a task',
      'Cada botão só funciona para quem tem a permissão correspondente.',
      '',
      '## Configuração (só o dono do bot)',
      '- `/tasks canal` — define o canal ou tópico monitorado (sem argumento, usa o canal/tópico onde o comando foi usado)',
      '- `/tasks canal-remover` — para de monitorar o canal ou tópico',
      '- `/tasks permissao-adicionar` / `/tasks permissao-remover` — libera ou remove uma ação para um usuário ou cargo',
      '- `/tasks mencionar` — define quem é mencionado a cada nova task',
      '- `/tasks config` — mostra a configuração atual',
    ].join('\n'),
  );
}
