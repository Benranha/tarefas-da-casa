# 🏠 Tarefas da Casa

Web App PWA para controle de tarefas domésticas gamificadas para crianças.

## 🚀 Stack Técnica
- **Next.js 14 (App Router)** + TypeScript + Tailwind CSS
- **Supabase**: Postgres, Auth, Realtime e RLS.
- **Deploy**: Vercel.

## 🛠️ Configuração do Projeto

### 1. Supabase Setup
1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, execute o conteúdo de `supabase/seed.sql` para criar as tabelas e as políticas de segurança (RLS).
3. Crie um usuário em **Authentication** para acessar o painel dos pais.

### 2. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
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
