export const TASK_ACTIONS = ['start', 'complete', 'delete'] as const;
export type TaskAction = (typeof TASK_ACTIONS)[number];

export const PERMISSION_ACTIONS = ['create', ...TASK_ACTIONS] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  create: 'Criar',
  start: 'Iniciar',
  complete: 'Concluir',
  delete: 'Excluir',
};

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
