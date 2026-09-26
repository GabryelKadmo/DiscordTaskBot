import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ACTION_LABELS, buildCustomId, type TaskAction } from './actions.js';

export type TaskState = 'pending' | 'started' | 'done';

const buttonStyles: Record<TaskAction, ButtonStyle> = {
  copy: ButtonStyle.Secondary,
  start: ButtonStyle.Primary,
  complete: ButtonStyle.Success,
  delete: ButtonStyle.Danger,
};

const actionsByState: Record<TaskState, TaskAction[]> = {
  pending: ['copy', 'start', 'delete'],
  started: ['copy', 'complete', 'delete'],
  done: ['copy', 'delete'],
};

export function buildTaskComponents(state: TaskState, messageId: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    actionsByState[state].map((action) =>
      new ButtonBuilder()
        .setCustomId(buildCustomId(action, messageId))
        .setLabel(ACTION_LABELS[action])
        .setStyle(buttonStyles[action]),
    ),
  );
  return [row];
}
