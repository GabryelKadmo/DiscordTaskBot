import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config.js';
import { handleInteractionCreate } from './events/interactionCreate.js';
import { handleMessageCreate } from './events/messageCreate.js';
import { handleMessageDelete } from './events/messageDelete.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message],
});

function logErrors<T extends unknown[]>(event: string, handler: (...args: T) => Promise<void>) {
  return (...args: T) => {
    handler(...args).catch((error) => console.error(`Erro no evento ${event}:`, error));
  };
}

client.once(Events.ClientReady, (ready) => {
  console.log(`Bot conectado como ${ready.user.tag}`);
});

client.on(Events.MessageCreate, logErrors(Events.MessageCreate, handleMessageCreate));
client.on(Events.MessageDelete, logErrors(Events.MessageDelete, handleMessageDelete));
client.on(Events.InteractionCreate, logErrors(Events.InteractionCreate, handleInteractionCreate));
client.on(Events.Error, (error) => console.error('Erro no client do Discord:', error));

await client.login(config.token);
