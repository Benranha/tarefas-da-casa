# 🏠 Tarefas da Casa

Web App PWA para controle de tarefas domésticas gamificadas para crianças.

## 🚀 Stack Técnica
- **Next.js 16 (App Router)** + TypeScript + Tailwind CSS
- **Neon**: Postgres (`@neondatabase/serverless`) e Auth (Managed Better Auth).
- **Deploy**: Vercel (integração Neon do Marketplace).

## 🛠️ Configuração do Projeto

### 1. Banco e Auth (Neon)
1. No Vercel, em **Storage**, crie um banco **Neon** e conecte ao projeto (injeta `DATABASE_URL` e `NEON_AUTH_BASE_URL`).
2. Rode `db/schema.sql` no banco (Neon SQL Editor).
3. Crie o usuário dos pais no Neon Auth e mantenha o cadastro público desativado.

### 2. Variáveis de Ambiente
```env
DATABASE_URL=...            # injetada pela integração Neon
NEON_AUTH_BASE_URL=...      # injetada pela integração Neon
NEON_AUTH_COOKIE_SECRET=... # openssl rand -base64 32 (mínimo 32 caracteres)
```

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
