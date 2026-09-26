# DiscordTaskBot

Bot do Discord (Node.js + TypeScript + discord.js v14) que transforma cada mensagem do Ian no canal de tasks em uma task interativa pro Kadmo.

## Comandos

- `npm run dev` — roda com `tsx watch` (lê `.env`)
- `npm run typecheck` — `tsc --noEmit`; é a única verificação automatizada (não há testes)
- `npm run build` / `npm start` — compila para `dist/` e roda o JS

Config em `.env` (modelo em `.env.example`): `DISCORD_TOKEN`, `TASK_CHANNEL_ID`, `IAN_USER_ID`, `KADMO_USER_ID` são obrigatórias; `EMOJI_*` são opcionais (aceitam unicode ou emoji custom `<:nome:id>`).

## Estrutura

- `src/config.ts` — leitura/validação das env vars
- `src/task/actions.ts` — formato do `customId` (`task:<ação>:<messageId>`) e matriz de permissões por ação
- `src/task/components.ts` — botões de cada estado (`pending` → `started` → `done`)
- `src/task/reactions.ts` — troca da reação de estado na mensagem do Ian
- `src/events/` — um handler por evento do gateway

## Decisões e armadilhas

- **Bot não consegue pôr botões em mensagem de outro usuário** — a API só permite editar componentes de mensagens do próprio bot. Por isso os botões ficam numa única reply do bot (que também é a menção ao Kadmo). Não tentar "mover" os botões para a mensagem do Ian.
- Sem banco: o estado vive na reação da mensagem do Ian e nos botões da reply. A reply é ligada à task pelo `messageId` no `customId` e por `reference.messageId` (usado no `messageDelete` para achar a reply órfã).
- Permissões são checadas no servidor em `canPerform`; a UI não é confiável.
- A mensagem original é buscada com `force: true` porque o bot não usa o intent de reações, então o cache de reações fica desatualizado.
- Todo clique precisa ser respondido (`reply`/`deferUpdate`) para não aparecer "This interaction failed".
- Projeto ESM (`"type": "module"`, `NodeNext`): imports relativos usam extensão `.js`.

## Setup no Discord

- Intent privilegiado **Message Content** ativado no Developer Portal.
- Permissões no canal: View Channel, Send Messages, Read Message History, Add Reactions, Manage Messages (para apagar a mensagem do Ian).

## Git

- Sem branch de integração: feature branch → PR para `main`, que aguarda aprovação manual.
- Arquivos de ferramentas (`.claude/`, `.deepspace/`, `.mcp.json`, `AGENTS.md`) ficam fora do versionamento.
