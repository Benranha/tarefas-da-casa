# Conector do Claude

O Tarefinha tem um servidor MCP em `/api/mcp`. Com ele, o responsável usa o Claude (claude.ai, app, Claude Code) para ver como foi a semana, esvaziar a Fila e montar a rotina das crianças.

A regra do produto não muda: **a IA só propõe, o responsável confirma.** O Claude lê à vontade, mas toda ação que muda dados vira uma sugestão pendente. Ela só acontece quando o responsável toca em Confirmar na Fila do Tarefinha.

## Colocar no ar

1. Rode `db/migrations/009_conector_claude.sql` no SQL Editor do Neon **antes** do deploy. É idempotente. Cria `mcp_clients`, `mcp_grants`, `mcp_codes`, `mcp_tokens` e `mcp_proposals`.
2. Confira `NEXT_PUBLIC_SITE_URL` (ex.: `https://tarefinha.app.br`). É o endereço que o servidor escreve nos metadados do login e que o Claude confere. Sem a variável, ele usa o endereço da própria requisição, o que serve para dev e previews.
3. O `vercel.json` agenda `GET /api/cron/limpeza` uma vez por dia (6h30 UTC). Ele apaga sugestões com mais de 30 dias, códigos e tokens vencidos, conexões revogadas há mais de 30 dias e apps registrados que ninguém usou. É o que sustenta o prazo dito em `/privacidade`. Precisa do `CRON_SECRET`, como o dos e-mails.
4. Faça o deploy e confira:

```bash
curl https://tarefinha.app.br/.well-known/oauth-protected-resource
curl https://tarefinha.app.br/.well-known/oauth-authorization-server
curl -i -X POST https://tarefinha.app.br/api/mcp   # 401 com WWW-Authenticate
```

5. Teste o fluxo inteiro com uma conta de exemplo, no [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) e depois como conector personalizado no Claude.

## Como o responsável conecta

- **claude.ai e apps:** em Conectores, adicionar conector personalizado, com a URL `https://tarefinha.app.br/api/mcp`. O Claude abre a tela "Deixar o Claude usar o Tarefinha?". O responsável entra (se precisar) e toca em Permitir.
- **Claude Code:**

```bash
claude mcp add --transport http tarefinha https://tarefinha.app.br/api/mcp
```

- **Plugin (conector + skills):** este repositório também é um marketplace.

```bash
claude plugin marketplace add Benranha/tarefas-da-casa
claude plugin install tarefinha@tarefinha
```

Para desconectar: Família, em "Apps conectados", botão Desconectar. O acesso termina na hora.

## Ferramentas

Leitura, direta (`readOnlyHint: true`): `listar_criancas`, `listar_tarefas`, `listar_fila`, `listar_tarefas_de_hoje`, `listar_pedidos_recompensa`, `listar_premios`, `resumo_da_semana`, `listar_sugestoes`.

Sugestão, nunca grava (`readOnlyHint: false`, `destructiveHint: false`): `sugerir_criar_tarefa`, `sugerir_criar_varias_tarefas`, `sugerir_aprovar_tarefa`, `sugerir_devolver_tarefa`, `sugerir_marcar_tarefa_feita`, `sugerir_concluir_e_aprovar_tarefa`, `sugerir_entregar_recompensa`.

As ferramentas usam o mesmo `runTool` do assistente do painel (`src/lib/ajuda-tools.ts`). A leitura devolve o resultado. A escrita devolve uma proposta, que `src/lib/mcp/propostas.ts` guarda em `mcp_proposals` por 24 horas. Ao confirmar, `commitTool` valida tudo de novo, com as mesmas regras do painel.

Ferramenta nova segue a mesma regra:

1. Registre em `TOOLS` (`ajuda-tools.ts`): leitura com `confirm: false`, escrita com `confirm: true` e `prepare`/`commit`.
2. Exponha em `src/lib/mcp/server.ts` com `title` e as anotações. Escrita entra como `sugerir_...` e passa por `sugerir()`.
3. Texto que a criança vai ler passa por `problemaNoTextoParaCrianca` (`ajuda-gate.ts`), no `prepare`.
4. Mudou o que o conector mostra ou guarda? Atualize `src/lib/ajuda.ts` e `/privacidade` no mesmo PR.

## Login (OAuth 2.1)

| Endereço | Para quê |
|---|---|
| `/.well-known/oauth-protected-resource` (e a variante com `/api/mcp`) | Diz ao Claude qual servidor dá a chave |
| `/.well-known/oauth-authorization-server` | Endereços do login, só `S256` |
| `POST /api/oauth/register` | Registro dinâmico de clientes (o Claude se registra sozinho) |
| `GET /api/oauth/authorize` | Começo: confere o pedido, manda para o login se preciso |
| `/oauth/permitir` | Tela "Deixar o Claude usar o Tarefinha?" |
| `POST /api/oauth/decidir` | Permitir ou Agora não |
| `POST /api/oauth/token` | Código (com PKCE) ou renovação por tokens |
| `POST /api/oauth/revoke` | O app encerra a conexão |

O que protege:

- PKCE `S256` obrigatório. Clientes públicos, sem segredo.
- Só recebem o código os endereços de retorno do Claude (`https://claude.ai/api/mcp/auth_callback` e `https://claude.com/api/mcp/auth_callback`) e `localhost`/`127.0.0.1` (Claude Code). Um app desconhecido não consegue se registrar para receber códigos em outro domínio. Para aceitar outro cliente MCP, mude `redirectUriPermitida` em `src/lib/mcp/oauth.ts`.
- Código vale 5 minutos e uma vez. Token de acesso vale 1 hora. Token de renovação vale 30 dias e troca a cada uso.
- Um código ou token de renovação já usado que reaparece mais de 30 segundos depois (e, no código, do mesmo app) indica cópia: a conexão é revogada e os tokens e sugestões dela são apagados. Dentro dos 30 segundos só é recusado, para não derrubar duas renovações simultâneas.
- A conexão guarda a família que o responsável tinha ao permitir. Se ele mudar de família (aceitar outro convite), o conector responde 403 até ele permitir de novo.
- A resposta do login traz `iss` (RFC 9207) e os metadados declaram isso.
- O nome do app mostrado ao responsável é sempre "Claude" quando o endereço de retorno é o do Claude. Para um app local, o nome é limpo de caracteres de controle, invisíveis e de direção do texto. A tela de permissão avisa para só tocar em Permitir se a pessoa pediu a conexão agora.
- `/api/mcp` não aceita lote de mensagens (array JSON-RPC) nem corpo acima de 100 KB, para o limite de chamadas valer por requisição.
- Código e tokens ficam no banco só como SHA-256.
- A tela de permissão só aceita o formulário vindo do próprio site (`Origin`) e não pode ser aberta dentro de outro site (`frame-ancestors 'none'` em `next.config.ts`).
- Limite de chamadas por conexão em memória (vale por instância do servidor, como o da ajuda por IA). Os limites por IP em `/register`, `/token` e `/revoke` são folgados de propósito, porque o claude.ai fala com o servidor a partir de poucos endereços compartilhados. O teto de verdade é o de registros por hora, no banco.
- Quem entrou pelo login volta para a tela de permissão pelo cookie `tarefinha-oauth` (15 minutos), no mesmo jeito do convite da família.

## O que é guardado

Só o necessário para o login e para as sugestões. Nada de dado de criança além do texto das sugestões, que é apagado em 30 dias (limpeza diária) ou na hora em que o responsável desconecta o app. Apagar a conta do responsável apaga tudo (`ON DELETE CASCADE`). A página `/privacidade` descreve isso na seção "Conector do Claude (opcional)".

## Limites conhecidos

- Sem sessões MCP: cada chamada leva o token e é independente. `GET` e `DELETE` em `/api/mcp` respondem 405.
- O limitador por conexão é em memória, por instância. Se precisar de limite global, mova para o banco.
- Quem inicia a conexão não é amarrado ao navegador de quem toca em Permitir (o OAuth não permite saber). Um golpe seria alguém mandar o link de permissão para um responsável logado. A tela avisa, mas o risco só some se o claude.ai amarrar o retorno à sessão de quem começou, o que não dá para verificar daqui. Considere um aviso por e-mail quando uma conexão nova é criada.
- Em Família, cada responsável vê só as próprias conexões (não as de quem divide a família).
- `listar_tarefas_de_hoje` está marcada como só leitura, mas cria as tarefas de hoje que ainda não existem (idempotente, igual a abrir o painel).
- Erros de pedido de autorização com `redirect_uri` válido mas outro parâmetro inválido mostram a página de erro em vez de redirecionar com `error=invalid_request` (RFC 6749, 4.1.2.1).
- O conector não olha o teste grátis nem a assinatura, como o painel hoje.
- Não confirmado: se o conector adicionado na web aparece no app de celular do Claude. Teste antes de prometer.
- Várias confirmações: uma rotina inteira usa `sugerir_criar_varias_tarefas` (até 10 tarefas, uma confirmação). Aprovar, devolver e entregar também aceitam várias de uma vez.

## Enviar ao diretório de conectores

Confira os requisitos atuais em `claude.com/docs/connectors/building/submission` antes de enviar. O que já está pronto: título e anotações em toda ferramenta, política de privacidade em `/privacidade`, ferramentas de leitura separadas das de escrita. O que falta decidir: uma conta de teste com dados de exemplo (Theo, Sofia, `exemplo.com.br`), nunca com dados de uma família real.
