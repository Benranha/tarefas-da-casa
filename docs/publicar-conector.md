# Publicar o conector no diretório do Claude

Este arquivo reúne o que o formulário de envio pede, já preenchido, e o que só o dono do produto pode fazer. Os requisitos vieram das páginas oficiais da Anthropic (`claude.com/docs/connectors/building/submission`, `review-criteria`, `testing`, `authentication` e `claude.com/docs/directory/publish`). **Confira o formulário na hora do envio:** os campos e limites podem mudar. Detalhes técnicos do conector estão em `docs/conector-claude.md`.

Enquanto o conector não está no diretório, qualquer pessoa já pode usá-lo como conector personalizado, com o endereço da página pública `/conector`.

## O que só você pode fazer

1. **Plano pago do Claude** (Pro, Max, Ultra, Team ou Enterprise) na conta que vai enviar. O plano gratuito não envia.
2. **Rodar cada ferramenta** no [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) ou como conector personalizado, com uma conta de exemplo. O formulário pede para você confirmar isso. Roteiro mais abaixo.
3. **Criar uma conta de teste** no Tarefinha com dados de exemplo (Theo e Sofia, `exemplo.com.br`), nunca com uma família real. A revisão "Verified" faz um teste de cada ferramenta e, se o conector exige login, a equipe pede acesso por e-mail. **Não coloque senha no portal**: envie só quando pedirem.
4. **Ler as regras do diretório** (Software Directory Policy e Terms, em `support.claude.com`, artigos 13145358 e 13145338). As páginas que li não falam de dados de crianças, e é nelas que estão as regras sobre dados pessoais e menores.
5. **Enviar** em `https://claude.ai/directory/manage` > Submit new > MCP connector, e responder os 7 reconhecimentos de conformidade (você precisa ler e aceitar, não dá para eu fazer isso).
6. **Plugin (opcional, separado):** veja o fim deste arquivo.

## Campos do formulário

| Campo | Limite | Texto sugerido |
|---|---|---|
| Endereço do servidor | HTTPS | `https://tarefinha.app.br/api/mcp` |
| Endereços diferentes por usuário | sim/não | Não (um endereço só) |
| Nome | 100 | `Tarefinha` |
| Uma linha | 200 | Veja a semana das crianças, aprove a Fila e monte a rotina de tarefas da casa, direto pelo Claude. |
| Descrição | 2.000 | Veja abaixo |
| Categorias | 1 a 5 | A lista não aparece nas páginas; escolha as mais próximas de produtividade e família |
| Documentação | URL | `https://tarefinha.app.br/conector` |
| Política de privacidade | URL | `https://tarefinha.app.br/privacidade` |
| Contato de suporte | | `contato@tarefinha.app.br` |
| Ícone | tamanho não informado | `public/icons/icon-512x512.png` (quadrado, 512 px) |
| Endereço da página (slug) | permanente depois de publicado | `tarefinha` |
| Autenticação | | Sempre exigida. OAuth com registro dinâmico de clientes (DCR) |
| Dados | | A API é própria (o app Tarefinha). Não trata dados de saúde. Sem conteúdo patrocinado |
| Empresa | | Nome: Tarefinha. Site: `https://tarefinha.app.br`. Contato para a revisão: você preenche |

**Descrição (português):**

> O Tarefinha é um app de tarefas da casa para crianças: os pais criam as tarefas, as crianças marcam o que fizeram, os pais aprovam e os pontos viram prêmios.
>
> Com este conector, o responsável usa o Claude para cuidar disso por conversa:
> - ver como foi a semana de cada criança, a Fila de aprovação, as tarefas e os prêmios;
> - montar a rotina de uma criança, com pontos, horário, dias da semana, ícone e descrição, uma tarefa ou várias de uma vez;
> - alterar, apagar e copiar tarefas;
> - aprovar, devolver ou entregar o que as crianças fizeram e pediram, e cadastrar prêmios.
>
> As mudanças valem na hora. As ferramentas que alteram ou apagam dados declaram isso, e o Claude pode pedir a sua permissão antes de cada uma. Apagar uma tarefa apaga o histórico dela.
>
> O conector não mexe no cadastro das crianças, na família, nos convites nem nos códigos, e não vê o código secreto das crianças, o código parental nem o link do totem.
>
> Você precisa de uma conta de responsável no Tarefinha (30 dias grátis, sem cartão de crédito). Para desconectar, abra Família no painel e toque em Desconectar.

**Descrição (inglês), se o formulário preferir:**

> Tarefinha is a household chores app for kids: parents create tasks, children mark what they did, parents approve, and points turn into rewards.
>
> With this connector, a parent uses Claude to manage it by chat: see each child's week, the approval queue, tasks and rewards; build a routine with points, times, weekdays, icon and description; change, delete and copy tasks; approve, return or deliver what kids did and asked for; and create rewards.
>
> Changes apply immediately. Tools that modify or delete data are annotated as destructive, so Claude can ask for permission first. Deleting a task also deletes its history.
>
> The connector does not touch child profiles, the family, invites or codes, and never sees children's secret codes, the parental code or the kiosk link.
>
> You need a parent account on Tarefinha (30-day free trial, no credit card).

**Casos de uso e antes de conectar:** "Ver a semana das crianças; esvaziar a Fila de aprovação; montar e ajustar a rotina; cuidar dos prêmios." Antes de conectar: ter uma conta de responsável no Tarefinha. O conector **lê e escreve** dados.

## Roteiro de teste (conta de exemplo)

Rode nesta ordem, no Inspector ou no Claude, com Theo e Sofia cadastrados:

1. Leitura: `listar_criancas`, `listar_tarefas`, `listar_fila`, `listar_tarefas_de_hoje`, `listar_premios`, `listar_pedidos_recompensa`, `resumo_da_semana`.
2. `criar_tarefa` com todas as opções (descrição, ícone, horário, `dias_da_semana` com `seg`, `qua`, `sex`) e uma `so_hoje`. Confira no painel.
3. `criar_varias_tarefas` com 3 tarefas. Depois uma com título repetido: nada deve ser criado.
4. `atualizar_tarefa`: só os pontos; depois `horario: null`; depois mudar de criança. Confira que o resto não mudou.
5. `copiar_tarefas` de Theo para Sofia, duas vezes (a segunda pula as repetidas).
6. Pelo painel da criança, marque uma tarefa como feita. Depois `aprovar_tarefa` e confira os pontos. Repita com `devolver_tarefa`.
7. `marcar_tarefa_feita` e `concluir_e_aprovar_tarefa` em tarefas de hoje.
8. `criar_premio`, `atualizar_premio`, `apagar_premio`. Com um pedido feito pela criança: `recusar_pedido_recompensa` (devolve os pontos) e `entregar_recompensa`.
9. `apagar_tarefa`. Confira que o histórico dela sumiu.
10. Erros: título com link, horário fora do acordar/dormir, id que não existe. Cada um deve voltar com uma frase clara.
11. Desconectar em Família e confirmar que o Claude perde o acesso.

## O que o conector já cumpre dos critérios de revisão

- **Leitura e escrita separadas**, com criar, alterar e apagar em ferramentas diferentes. Nenhuma ferramenta "faz tudo".
- **`title` e anotações em toda ferramenta**: `readOnlyHint` nas de leitura e `destructiveHint` nas que alteram ou apagam.
- **Descrições só descrevem** o que a ferramenta faz. As orientações ao Claude ficam nas instruções do servidor, e nenhuma descrição manda chamar outra ferramenta.
- **Erros específicos** (nunca "Internal Server Error"), em português claro.
- **Nomes com menos de 64 caracteres**, respostas pequenas e filtradas pela família do token.
- **Login:** `401` com `WWW-Authenticate` e `resource_metadata`, `resource` igual ao endereço do servidor, PKCE `S256`, `/token` aceita `application/x-www-form-urlencoded`, `invalid_grant` em renovação inválida, renovação com rotação, registro dinâmico (DCR) e o retorno `https://claude.ai/api/mcp/auth_callback`.
- **Privacidade:** `/privacidade` cobre o que é coletado, o uso, o compartilhamento (inclui a Anthropic), o prazo de guarda e o contato.
- **Sem coleta da conversa:** o servidor só recebe os argumentos de cada ferramenta.

## Riscos e limites

- **Dados de crianças e ferramentas que apagam.** As páginas de revisão não proíbem ferramentas destrutivas, e exigem anotação correta. As regras sobre menores estão nos documentos que você precisa ler (item 4). Vale explicar no envio que as crianças não têm conta e que o conector não alcança o cadastro delas.
- **Volume de registros.** O Claude usa registro dinâmico (DCR) e registra um cliente a cada conexão nova. A Anthropic prefere, para servidores com muito uso, o documento de metadados do cliente (CIMD) ou credenciais guardadas por ela. Hoje o servidor aceita até 300 registros por hora e só clientes públicos. Se o uso crescer, o próximo passo é implementar CIMD (o servidor precisa declarar `client_id_metadata_document_supported`).
- **`listar_tarefas_de_hoje` e a anotação de só leitura.** Ela cria as tarefas de hoje que ainda não existem (igual a abrir o painel). É idempotente, mas um revisor atento pode notar.
- **Quem inicia a conexão** não é amarrado a quem toca em Permitir. A tela avisa; o risco só some se o claude.ai amarrar o retorno à sessão de quem começou. Um aviso por e-mail ("um app foi conectado à sua conta") reduziria isso.
- **Listagem Community** (padrão) é só triada. A Anthropic pode escalar para **Verified**, mais lenta e com teste manual de cada ferramenta. Não há prazo informado. Dúvidas: `mcp-review@anthropic.com`.

## Plugin do Claude (separado do conector)

O plugin (`claude-plugin/tarefinha`: o conector mais 4 skills) tem envio próprio ("Plugin bundle"). Pontos:

- Envie o servidor **como conector** e o plugin à parte. Quando os dois vêm da mesma organização, dá para parear as listagens.
- O plugin precisa estar na **raiz de um repositório público do GitHub**. Hoje ele fica numa subpasta deste repositório, que é o app inteiro. O mais simples é um repositório só para o plugin (por exemplo `tarefinha-claude-plugin`), com o conteúdo de `claude-plugin/tarefinha/` na raiz e o `.claude-plugin/marketplace.json` apontando para `./`. Posso preparar essa pasta para você subir.
- Checklist do diretório para plugins: `claude.com/docs/plugins/pre-submission-checklist.md`. O `claude plugin validate` já passa sem avisos.
- O ícone do plugin já está em `claude-plugin/tarefinha/.claude-plugin/icon.png`.
