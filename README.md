# Finance Pessoal PWA

Aplicação PWA independente para gestão financeira pessoal em dispositivos iPhone.

Este projeto nasceu do commit `0397eb507a54358275c4dba54531cba66025a7e0` do repositório original. O sistema web original possui ciclo de vida, repositório e deploy separados.

## ✨ Funcionalidades

- 📊 **Visão Geral**: Dashboard com saldo mensal e gráficos.
- 💸 **Transações**: Controle total de receitas e despesas.
- 🔁 **Recorrentes**: Gerenciamento de despesas fixas mensais.
- 💳 **Cartões**: Controle de faturas e limites de cartões de crédito.
- 👤 **Perfil**: Personalização de avatar e mensagens de boas-vindas.
- 🌓 **Interface**: Design premium com suporte a Dark Mode.
- 🔒 **Privacidade**: Modo oculto para esconder valores sensíveis.
- 📱 **PWA**: Manifesto, modo standalone, instalação guiada e cache restrito a assets estáticos.

## 🚀 Tecnologias

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **Estização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Validação**: [Zod](https://zod.dev/)

## 🛠️ Instalação

### Pré-requisitos
- Node.js 24+
- Conta no Supabase

### Passo a passo

1. **Instale as dependências**
   ```bash
   npm ci
   ```

2. **Configure as variáveis de ambiente**
Copie `.env.example` para `.env.local` e preencha a URL do seu projeto Supabase e a chave anon/publicável:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
   ```
   Essas variáveis `NEXT_PUBLIC_` ficam disponíveis no navegador. Use somente a chave anon/publicável; nunca coloque `service_role` ou uma chave secreta nelas nem versione arquivos `.env`.

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

## 🧪 Testes

Para rodar a suíte de testes unitários:
```bash
npm test
```

## CI e monitoramento

- O workflow `.github/workflows/ci.yml` executa lint, testes e build em Node.js 24.x nos pushes e pull requests para `main`. O build usa apenas valores públicos fictícios do Supabase.
- O workflow `.github/workflows/production-health.yml` verifica a aplicação e o serviço Supabase Auth em produção a cada 15 minutos. Também pode ser iniciado manualmente em **GitHub Actions**. Uma falha gera uma execução marcada como falha no GitHub Actions.
- O endpoint `/api/health` retorna somente `ok` ou `unavailable`; não inclui URL, chave, sessão ou dados de usuário. Falhas no callback de confirmação são registradas no Vercel com um identificador fixo, sem detalhes do erro ou dados de autenticação.
- Para receber avisos de falha, habilite notificações de falha do GitHub Actions na conta responsável pelo repositório.

## 📄 Notas de Versão

### v0.1.0
- Estrutura inicial do projeto.
- Implementação de transações e cartões.
- Dashboard dinâmico com gráficos.
- Adição de despesas recorrentes.
- Perfil de usuário com upload de imagem.
