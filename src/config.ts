import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

export const config = {
  token: required('DISCORD_TOKEN'),
  channelId: required('TASK_CHANNEL_ID'),
  ianId: required('IAN_USER_ID'),
  kadmoId: required('KADMO_USER_ID'),
  emojis: {
    received: optional('EMOJI_RECEIVED', '👀'),
    started: optional('EMOJI_STARTED', '🔨'),
    done: optional('EMOJI_DONE', '✅'),
  },
};
