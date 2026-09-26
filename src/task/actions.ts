import { config } from '../config.js';

export const TASK_ACTIONS = ['copy', 'start', 'complete', 'delete'] as const;
export type TaskAction = (typeof TASK_ACTIONS)[number];

const PREFIX = 'task';

export function buildCustomId(action: TaskAction, messageId: string): string {
  return `${PREFIX}:${action}:${messageId}`;
}

export function parseCustomId(customId: string): { action: TaskAction; messageId: string } | null {
  const [prefix, action, messageId] = customId.split(':');
  if (prefix !== PREFIX || !messageId) return null;
  if (!TASK_ACTIONS.includes(action as TaskAction)) return null;
  return { action: action as TaskAction, messageId };
}

const allowedUsers: Record<TaskAction, string[]> = {
  copy: [config.ianId, config.kadmoId],
  start: [config.kadmoId],
  complete: [config.kadmoId],
  delete: [config.ianId],
};

export function canPerform(action: TaskAction, userId: string): boolean {
  return allowedUsers[action].includes(userId);
}
