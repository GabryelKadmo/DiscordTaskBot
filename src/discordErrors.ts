import { DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';

function isUnknownMessage(error: unknown): boolean {
  return error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.UnknownMessage;
}

export async function ignoreUnknownMessage<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (isUnknownMessage(error)) return null;
    throw error;
  }
}
