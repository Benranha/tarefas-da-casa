# Tarefinha

Web App PWA para controle de tarefas domésticas gamificadas para crianças.

## 🚀 Stack Técnica
- **Next.js 16 (App Router)** + TypeScript + Tailwind CSS
- **Neon**: Postgres (`@neondatabase/serverless`) e Auth (Managed Better Auth).
- **Deploy**: Vercel (integração Neon do Marketplace).

## 🛠️ Configuração do Projeto

### 1. Banco e Auth (Neon)
1. No Vercel, em **Storage**, crie um banco **Neon** e conecte ao projeto (injeta `DATABASE_URL` e `NEON_AUTH_BASE_URL`).
2. Rode `db/schema.sql` no banco (Neon SQL Editor). Se o banco já existia, rode só `db/migrations/002_familia_horarios_filho.sql` (idempotente).
3. Cada responsável cria a própria conta em `/cadastro`, cadastra os filhos e as tarefas, e copia o link do totem no Dashboard para abrir no tablet.

### 2. Variáveis de Ambiente
```env
DATABASE_URL=...            # injetada pela integração Neon
NEON_AUTH_BASE_URL=...      # injetada pela integração Neon
NEON_AUTH_COOKIE_SECRET=... # openssl rand -base64 32 (mínimo 32 caracteres); também assina o acesso das crianças

# Notificações push (opcional; sem isso o app funciona, só não avisa)
VAPID_PUBLIC_KEY=...        # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:voce@exemplo.com
CRON_SECRET=...             # protege /api/cron/lembretes

# Painel admin do dono do produto (/admin): e-mails autorizados, separados por vírgula
ADMIN_EMAILS=voce@exemplo.com
```

**Painel admin:** rode `db/migrations/005_assinaturas.sql` e defina `ADMIN_EMAILS`. Quem não estiver na lista recebe 404 em `/admin`.
A tabela `subscriptions` deve ser alimentada pelos webhooks do gateway de pagamento (ainda não integrado).

**Lembretes de horário:** chame `GET /api/cron/lembretes` com `Authorization: Bearer $CRON_SECRET` a cada ~5 minutos
(Vercel Cron em plano Pro, ou qualquer agendador externo). Ele avisa a criança das tarefas cujo horário chegou,
só entre a hora de acordar e a de dormir dela.

## 👨‍👩‍👧 Família, crianças e aparelhos
- **Convite**: em *Família*, gere um link para outro pai/mãe entrar na mesma família.
- **Horários**: cada criança tem hora de acordar e de dormir; as tarefas podem ter horário dentro desse período.
- **Código secreto**: na primeira vez (no totem ou no aparelho próprio) a criança escolhe um código de 4 a 8 números; sem ele
  ninguém mexe nas tarefas dela. Os pais podem redefinir em *Crianças*.
- **Criança com celular/computador**: marque "Tem celular ou computador" e mande o link dela. Ela vê as tarefas, avisa que
  fez e, instalando como app (PWA), recebe notificações.

### 3. Instalação e Execução
```bash
npm install
npm run dev
```

## 📱 Configuração do Totem (Tablet Android)

Para transformar o tablet em um totem de tarefas:

1. **Instalação do App**:
   - Acesse a URL de deploy no Chrome do tablet.
   - Clique nos três pontinhos $\rightarrow$ **Instalar App** (PWA).
   - O app abrirá em modo standalone (sem barra de endereço).

2. **Configuração com Fully Kiosk Browser (Recomendado)**:
   - Instale o [Fully Kiosk Browser](https://www.fully-kiosk.com/).
   - Configure a **Start URL** para a URL do seu app.
   - Ative as opções:
     - **Kiosk Mode**: Bloqueia a saída do app.
     - **Keep Screen On**: Impede que a tela apague.
     - **Orientation**: Force `Landscape`.
     - **Auto-Reload**: Configure para recarregar se houver queda de conexão.

## 🎨 Design e Cores
- **Fundo**: Creme/Bege claro (`#FDFBFA`).
- **Destaque**: Marrom suave (`#5C4033`).
- **Estados**:
  - ⚪ Pendente $\rightarrow$ Cinza
  - 🟡 Aguardando $\rightarrow$ Amarelo
  - 🟢 Aprovado $\rightarrow$ Verde
