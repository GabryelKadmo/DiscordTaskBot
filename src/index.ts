import { Client, Events, GatewayIntentBits, Partials, type Guild } from 'discord.js';
import { commandDefinitions } from './commands/index.js';
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

async function registerCommands(guild: Guild) {
  await guild.commands.set(commandDefinitions);
}

async function handleReady(ready: Client<true>) {
  await ready.application.commands.set([]);
  await Promise.all(ready.guilds.cache.map(registerCommands));
  console.log(`Bot conectado como ${ready.user.tag}`);
}

client.once(Events.ClientReady, logErrors(Events.ClientReady, handleReady));
client.on(Events.GuildCreate, logErrors(Events.GuildCreate, registerCommands));

client.on(Events.MessageCreate, logErrors(Events.MessageCreate, handleMessageCreate));
client.on(Events.MessageDelete, logErrors(Events.MessageDelete, handleMessageDelete));
client.on(Events.InteractionCreate, logErrors(Events.InteractionCreate, handleInteractionCreate));
client.on(Events.Error, (error) => console.error('Erro no client do Discord:', error));

await client.login(config.token);
