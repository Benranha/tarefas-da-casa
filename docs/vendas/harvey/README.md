# Rodando o Harvey para o Tarefinha

O [Harvey](https://github.com/ethanplusai/harvey) é um agente de vendas que roda no seu computador, usando a
assinatura do Claude Code (Pro/Max). Ele acha empresas, pesquisa cada uma, escreve e-mails personalizados e lê as
respostas. Aqui ele é usado só para **parceiros** do Tarefinha (escolas, psicólogas, pediatras, criadoras de
conteúdo). Nunca para pais.

## Arquivos

| Arquivo | Vai para (no clone do Harvey) |
|---|---|
| `harvey.local.yaml` | `harvey.local.yaml` (raiz) |
| `product_knowledge.md` | `skills/product_knowledge.md` |
| `email_rules.md` | `skills/email_rules.md` |

## Passo a passo

Pré-requisitos: macOS ou Linux, Python 3.13, Claude Code com login feito, uma conta Gmail para enviar.

```bash
git clone https://github.com/ethanplusai/harvey.git
```

```bash
cd harvey && python3.13 -m venv .venv && .venv/bin/pip install -e .
```

```bash
cp ../tarefas-da-casa/docs/vendas/harvey/harvey.local.yaml . && cp ../tarefas-da-casa/docs/vendas/harvey/product_knowledge.md ../tarefas-da-casa/docs/vendas/harvey/email_rules.md skills/
```

```bash
cp .env.example .env
```

Depois:

1. Preencha os campos entre colchetes em `harvey.local.yaml` (nome, e-mail, cidade, endereço).
2. No `.env`, configure o Gmail e a `TINYFISH_API_KEY` (grátis em agent.tinyfish.ai). O OpenStreetMap, fonte
   padrão, não encontra escolas nem psicólogas.
3. Confira os sinais e procure parceiros (o README do Harvey explica cada comando):

```bash
.venv/bin/harvey signals --confirm free
```

```bash
.venv/bin/harvey discover --provider tinyfish
```

```bash
.venv/bin/harvey run
```

4. Rode `.venv/bin/harvey dashboard` e abra o link privado que ele mostra (porta 5555). **Todo e-mail fica no Outbox esperando você aprovar.** Leia cada um com o
   teste de `../escrita.md` antes de aprovar.

Os comandos acima seguem o README do Harvey na data deste kit. Se algo mudar, o README dele vale mais.

## Cuidados

- Não use `harvey train https://tarefinha.app.br`: ele sobrescreve o `product_knowledge.md` revisado à mão.
  Se usar, revise o resultado contra `../escrita.md` (fatos que podem ser usados).
- Mantenha `require_approval: true`. O Harvey nunca deve mandar sozinho em nome do Tarefinha.
- Comece com 10 por dia, no máximo. Cada e-mail precisa de uma observação real sobre aquele parceiro.
- **O Harvey não entende descadastro em português.** Ele reconhece sozinho só palavras em inglês, hebraico e
  espanhol ("stop", "unsubscribe", "baja"). Por isso o rodapé pede para responder "stop". Mesmo assim, leia as
  respostas: quem escrever "não, obrigado", "pare" ou "sair" precisa ir à mão para `compliance.do_not_contact`.
