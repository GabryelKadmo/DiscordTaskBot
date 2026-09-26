# DiscordTaskBot

Bot do Discord (Node.js + TypeScript + discord.js v14) que transforma mensagens do canal de tasks em tasks interativas (reação de estado + botões Iniciar/Concluir/Excluir). Não há botão Copiar: bot não acessa a área de transferência e o "Copiar texto" nativo do Discord já resolve.

## Comandos

- `npm run dev` — roda com `tsx watch` (lê `.env`)
- `npm run typecheck` — `tsc --noEmit`; é a única verificação automatizada (não há testes)
- `npm run build` / `npm start` — compila para `dist/` e roda o JS

`.env` (modelo em `.env.example`) guarda só `DISCORD_TOKEN` (obrigatório) e `EMOJI_*` (opcionais; unicode ou custom `<:nome:id>`). Canal, menção e permissões são configurados pelo próprio Discord via `/tasks` e salvos em `data/settings.json` (por servidor, fora do git).

## Estrutura

- `src/config.ts` — leitura/validação das env vars
- `src/settings/store.ts` — configuração por servidor (canal, menção, permissões), persistida em JSON
- `src/commands/` — slash commands; cada funcionalidade tem seu próprio comando/grupo (`/tasks ...`) e o `/help` descreve tudo
- `src/task/actions.ts` — ações, labels e formato do `customId` (`task:<ação>:<messageId>`)
- `src/task/permissions.ts` — checagem de permissão por usuário ou cargo
- `src/task/buttons.ts` — handler dos botões da task
- `src/task/components.ts` — botões de cada estado (`pending` → `started` → `done`)
- `src/task/reactions.ts` — troca da reação de estado na mensagem do Ian
- `src/events/` — um handler por evento do gateway

## Decisões e armadilhas

- **Bot não consegue pôr botões em mensagem de outro usuário** — a API só permite editar componentes de mensagens do próprio bot. Por isso os botões ficam numa única reply do bot (que também é a menção ao responsável). Não tentar "mover" os botões para a mensagem original.
- Sem banco: o estado de cada task vive na reação da mensagem original e nos botões da reply. A reply é ligada à task pelo `messageId` no `customId` e por `reference.messageId` (usado no `messageDelete` para achar a reply órfã).
- Permissões são checadas no servidor em `canPerform`; a UI não é confiável. "Criar" também é permissão: define de quem as mensagens viram task. Sem canal configurado o bot ignora tudo.
- Slash commands são registrados por servidor (no `ClientReady` e no `GuildCreate`) e os globais são zerados: comando global fica em cache no cliente e aparece como "desatualizado" por minutos; `/tasks` exige `ManageGuild` por padrão (ajustável em Configurações do servidor → Integrações).
- Menção a cargo só notifica se o cargo for mencionável ou o bot tiver "Mencionar todos".
- A mensagem original é buscada com `force: true` porque o bot não usa o intent de reações, então o cache de reações fica desatualizado.
- Todo clique precisa ser respondido (`reply`/`deferUpdate`) para não aparecer "This interaction failed".
- Projeto ESM (`"type": "module"`, `NodeNext`): imports relativos usam extensão `.js`.

## Setup no Discord

- Intent privilegiado **Message Content** ativado no Developer Portal.
- Permissões no canal: View Channel, Send Messages, Read Message History, Add Reactions, Manage Messages (para apagar a mensagem original). Em thread, Send Messages In Threads no lugar de Send Messages. O `/tasks canal` aceita canal ou thread, entra na thread e avisa se faltar alguma permissão.
## Git

- Sem branch de integração: feature branch → PR para `main`, que aguarda aprovação manual.
- Depois do merge, o Claude apaga a branch local e remota (`gh pr merge --delete-branch`); nunca apagar `main` nem `dev`. Não há workflow de auto-delete e não precisa criar um.
- Arquivos de ferramentas (`.claude/`, `.deepspace/`, `.mcp.json`, `AGENTS.md`) ficam fora do versionamento.
