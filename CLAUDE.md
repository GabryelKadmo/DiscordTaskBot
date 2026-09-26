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
- `src/task/actions.ts` — ações, labels e formato do `customId`
- `src/task/repost.ts` — republica a mensagem do autor via webhook com os botões
- `src/task/permissions.ts` — checagem de permissão por usuário ou cargo
- `src/task/buttons.ts` — handler dos botões da task
- `src/task/components.ts` — botões de cada estado (`pending` → `started` → `done`)
- `src/task/reactions.ts` — troca da reação de estado na mensagem da task
- `src/events/` — um handler por evento do gateway

## Decisões e armadilhas

- **Bot não consegue pôr botões em mensagem de outro usuário** — a API só permite componentes em mensagens da própria aplicação. Por isso `src/task/repost.ts` republica a mensagem via webhook da aplicação (nome/avatar do autor, anexos, menção em `-#` e botões numa mensagem só) e apaga a original. O usuário aceitou que o autor não consegue mais editar: para corrigir, usa Excluir e reenvia.
- Webhook fica no canal pai quando o alvo é um tópico (envio com `threadId`); criado sob demanda e cacheado por canal. Se o repost falhar (ex.: sem Manage Webhooks), cai no modo antigo: reply do bot com os botões apontando para a original.
- Sem banco: o estado vive na reação e nos botões da própria mensagem da task. `customId` é `task:<ação>` no modo repost e `task:<ação>:<idOriginal>` no modo reply (a reply também é achada por `reference.messageId` no `messageDelete`).
- Permissões são checadas no servidor em `canPerform`; a UI não é confiável. "Criar" também é permissão: define de quem as mensagens viram task. Sem canal configurado o bot ignora tudo.
- Slash commands são registrados por servidor (no `ClientReady` e no `GuildCreate`) e os globais são zerados: comando global fica em cache no cliente e aparece como "desatualizado" por minutos; `/tasks` só aparece para quem tem `ManageGuild`, mas o handler só aceita o dono da aplicação no Developer Portal (`application.owner`, ou o dono do Team) — nenhuma config do servidor libera para outros.
- Menção a cargo só notifica se o cargo for mencionável ou o bot tiver "Mencionar todos".
- A mensagem original é buscada com `force: true` porque o bot não usa o intent de reações, então o cache de reações fica desatualizado.
- Todo clique precisa ser respondido (`reply`/`deferUpdate`) para não aparecer "This interaction failed".
- Projeto ESM (`"type": "module"`, `NodeNext`): imports relativos usam extensão `.js`.

## Setup no Discord

- Intent privilegiado **Message Content** ativado no Developer Portal.
- Permissões no canal: View Channel, Send Messages, Read Message History, Add Reactions, Manage Messages (para apagar a mensagem original), Manage Webhooks (para o repost). Em thread, Send Messages In Threads no lugar de Send Messages. O `/tasks canal` aceita canal ou thread, entra na thread e avisa se faltar alguma permissão.

## Deploy (Wispbyte)

- Bot precisa de processo sempre ligado (conexão WebSocket com o gateway): serverless/Vercel não serve. Roda no plano grátis do Wispbyte (painel Pterodactyl, 512 MB / 1 GB); Railway foi descartado por ser pago após o trial.
- Configuration → Startup: Docker image `nodejs_22` (o padrão é `nodejs_19`) e este Startup Command (o do template roda `node <JS file>` direto, sem build):
  ```
  if [[ ! -d .git ]]; then git init -q && git remote add origin https://github.com/GabryelKadmo/DiscordTaskBot.git && git fetch -q origin main && git checkout -q -f -B main origin/main; elif [[ "${AUTO_UPDATE}" == "1" ]]; then git pull; fi; npm install && npm run build && node dist/index.js
  ```
  `Auto Update` = `1`; `JS file` = `src/index.ts` (o painel só confere se o arquivo existe antes de ligar; `dist/` ainda não existe nesse momento).
- Os campos de Git do template só clonam no install e não funcionaram; o código entrou por upload de zip (`git archive`) e o Startup Command acima transforma a pasta em repo e faz `git pull` a cada start. O repo é público justamente para dispensar token.
- Atualizar em produção = merge na `main` + Restart no painel.
- `.env` (só `DISCORD_TOKEN`) é criado pelo gerenciador de arquivos do painel, na raiz ao lado do `package.json`. `data/settings.json` persiste no disco do servidor; `DATA_DIR` só é necessário em host com volume separado.
- É preciso logar no painel a cada 2 semanas, senão o servidor é movido para storage e o bot para.
- Só uma instância por token: rodar local (`npm run dev`) com o do Wispbyte ligado faz toda task ser processada duas vezes.

## Git

- Sem branch de integração: feature branch → PR para `main`, que aguarda aprovação manual.
- Depois do merge, o Claude apaga a branch local e remota (`gh pr merge --delete-branch`); nunca apagar `main` nem `dev`. Não há workflow de auto-delete e não precisa criar um.
- Arquivos de ferramentas (`.claude/`, `.deepspace/`, `.mcp.json`, `AGENTS.md`) ficam fora do versionamento.
