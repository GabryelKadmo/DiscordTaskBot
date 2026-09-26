import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ACTION_LABELS, buildCustomId, type TaskAction } from './actions.js';

export type TaskState = 'pending' | 'started' | 'done';

const buttonStyles: Record<TaskAction, ButtonStyle> = {
  start: ButtonStyle.Primary,
  complete: ButtonStyle.Success,
  delete: ButtonStyle.Danger,
};

const actionsByState: Record<TaskState, TaskAction[]> = {
  pending: ['start', 'delete'],
  started: ['complete', 'delete'],
  done: ['delete'],
};

export function buildTaskComponents(state: TaskState, originalId?: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    actionsByState[state].map((action) =>
      new ButtonBuilder()
        .setCustomId(buildCustomId(action, originalId))
        .setLabel(ACTION_LABELS[action])
        .setStyle(buttonStyles[action]),
    ),
  );
  return [row];
}
