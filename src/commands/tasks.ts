import {
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { replyEphemeral } from '../interactionReply.js';
import { formatTarget, getGuildSettings, updateGuildSettings, type Target } from '../settings/store.js';
import { ACTION_LABELS, PERMISSION_ACTIONS, type PermissionAction } from '../task/actions.js';

const TASK_CHANNEL_TYPES = [
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.AnnouncementThread,
] as const;

const actionChoices =PERMISSION_ACTIONS.map((action) => ({ name: ACTION_LABELS[action], value: action }));

export const tasksCommand = new SlashCommandBuilder()
  .setName('tasks')
  .setDescription('Configura o fluxo de tasks')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName('canal')
      .setDescription('Define o canal ou tópico monitorado (vazio usa o canal/tópico atual)')
      .addChannelOption((option) =>
        option
          .setName('canal')
          .setDescription('Canal ou tópico de tasks')
          .addChannelTypes(...TASK_CHANNEL_TYPES),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('permissao-adicionar')
      .setDescription('Libera uma ação para um usuário ou cargo')
      .addStringOption((option) =>
        option.setName('acao').setDescription('Ação').addChoices(...actionChoices).setRequired(true),
      )
      .addMentionableOption((option) => option.setName('alvo').setDescription('Usuário ou cargo').setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName('permissao-remover')
      .setDescription('Remove uma ação de um usuário ou cargo')
      .addStringOption((option) =>
        option.setName('acao').setDescription('Ação').addChoices(...actionChoices).setRequired(true),
      )
      .addMentionableOption((option) => option.setName('alvo').setDescription('Usuário ou cargo').setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName('mencionar')
      .setDescription('Define quem é mencionado a cada nova task (vazio para ninguém)')
      .addMentionableOption((option) => option.setName('alvo').setDescription('Usuário ou cargo')),
  )
  .addSubcommand((sub) => sub.setName('config').setDescription('Mostra a configuração atual'));

const permissionLabels = {
  ViewChannel: 'Ver canal',
  SendMessages: 'Enviar mensagens',
  SendMessagesInThreads: 'Enviar mensagens em tópicos',
  ReadMessageHistory: 'Ver histórico de mensagens',
  AddReactions: 'Adicionar reações',
  ManageMessages: 'Gerenciar mensagens',
} as const;

type BotPermission = keyof typeof permissionLabels;

function requiredPermissions(isThread: boolean): BotPermission[] {
  const send = isThread ? 'SendMessagesInThreads' : 'SendMessages';
  return ['ViewChannel', send, 'ReadMessageHistory', 'AddReactions', 'ManageMessages'];
}

export async function handleTasksCommand(interaction: ChatInputCommandInteraction<'cached'>) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'canal') await setChannel(interaction);
  else if (subcommand === 'permissao-adicionar') await changePermission(interaction, true);
  else if (subcommand === 'permissao-remover') await changePermission(interaction, false);
  else if (subcommand === 'mencionar') await setMention(interaction);
  else if (subcommand === 'config') await replyEphemeral(interaction, describeSettings(interaction.guildId));
}

async function setChannel(interaction: ChatInputCommandInteraction<'cached'>) {
  const channel = interaction.options.getChannel('canal', false, TASK_CHANNEL_TYPES) ?? interaction.channel;
  if (!channel || !(TASK_CHANNEL_TYPES as readonly ChannelType[]).includes(channel.type)) {
    await replyEphemeral(interaction, 'Esse canal não pode ser usado para tasks. Use um canal de texto ou um tópico.');
    return;
  }

  const warnings: string[] = [];

  if (channel.isThread() && !channel.joined) {
    await channel.join().catch(() => warnings.push('o bot não conseguiu entrar no tópico; mencione ele dentro dele'));
  }

  const permissions = channel.permissionsFor(interaction.guild.members.me!);
  const missing = requiredPermissions(channel.isThread())
    .filter((flag) => !permissions?.has(flag))
    .map((flag) => permissionLabels[flag]);
  if (missing.length) warnings.push(`o bot não tem estas permissões: ${missing.join(', ')}`);

  await updateGuildSettings(interaction.guildId, (settings) => {
    settings.channelId = channel.id;
  });

  const warning = warnings.map((w) => `\nAtenção: ${w}.`).join('');

  await replyEphemeral(interaction, `Canal de tasks definido: ${channel}.${warning}`);
}

async function changePermission(interaction: ChatInputCommandInteraction<'cached'>, adding: boolean) {
  const action = interaction.options.getString('acao', true) as PermissionAction;
  const target = getTarget(interaction)!;
  const label = `**${ACTION_LABELS[action]}**`;
  const exists = getGuildSettings(interaction.guildId).permissions[action].some((t) => isSameTarget(t, target));

  if (adding === exists) {
    const state = adding ? 'já tem' : 'não tem';
    await replyEphemeral(interaction, `${formatTarget(target)} ${state} a permissão ${label}.`);
    return;
  }

  await updateGuildSettings(interaction.guildId, (settings) => {
    const targets = settings.permissions[action];
    settings.permissions[action] = adding ? [...targets, target] : targets.filter((t) => !isSameTarget(t, target));
  });

  const state = adding ? 'agora tem' : 'não tem mais';
  await replyEphemeral(interaction, `${formatTarget(target)} ${state} a permissão ${label}.`);
}

async function setMention(interaction: ChatInputCommandInteraction<'cached'>) {
  const target = getTarget(interaction);
  await updateGuildSettings(interaction.guildId, (settings) => {
    settings.mention = target;
  });

  await replyEphemeral(
    interaction,
    target ? `Novas tasks vão mencionar ${formatTarget(target)}.` : 'Novas tasks não vão mencionar ninguém.',
  );
}

function getTarget(interaction: ChatInputCommandInteraction<'cached'>): Target | null {
  const option = interaction.options.get('alvo');
  if (option?.role) return { type: 'role', id: option.role.id };
  if (option?.user) return { type: 'user', id: option.user.id };
  return null;
}

function isSameTarget(a: Target, b: Target): boolean {
  return a.type === b.type && a.id === b.id;
}

function describeSettings(guildId: string): string {
  const settings = getGuildSettings(guildId);
  const permissionLines = PERMISSION_ACTIONS.map((action) => {
    const targets = settings.permissions[action];
    return `- ${ACTION_LABELS[action]}: ${targets.length ? targets.map(formatTarget).join(', ') : 'ninguém'}`;
  });

  return [
    `**Canal:** ${settings.channelId ? `<#${settings.channelId}>` : 'não definido'}`,
    `**Mencionar:** ${settings.mention ? formatTarget(settings.mention) : 'ninguém'}`,
    '**Permissões**',
    ...permissionLines,
  ].join('\n');
}
