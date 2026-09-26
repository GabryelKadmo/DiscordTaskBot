import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { buildCustomId, type TaskAction } from './actions.js';

export type TaskState = 'pending' | 'started' | 'done';

const buttons: Record<TaskAction, { label: string; style: ButtonStyle }> = {
  copy: { label: 'Copiar', style: ButtonStyle.Secondary },
  start: { label: 'Iniciar', style: ButtonStyle.Primary },
  complete: { label: 'Concluir', style: ButtonStyle.Success },
  delete: { label: 'Excluir', style: ButtonStyle.Danger },
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
        .setLabel(buttons[action].label)
        .setStyle(buttons[action].style),
    ),
  );
  return [row];
}
