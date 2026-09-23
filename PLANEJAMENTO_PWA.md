# Planejamento Vivo — Finance Pessoal PWA

> Documento de orientação do desenvolvimento. Deve ser atualizado ao concluir cada frente, após cada decisão técnica relevante e sempre que um risco, bloqueio ou critério de aceite mudar.

## 1. Estado atual

**Atualizado em:** 2026-09-22  
**Status geral:** P0, P1, P2, P7 e P8 concluídas; P3 validada em nível de API, produção e teste manual; P4 e P6 ainda em andamento. P5 foi explicitamente adiada.
**Próxima frente:** acompanhar a linha do tempo agrupada por dia após publicação e confirmar o comportamento no iPhone real. Exportações e avatar ficam fora da prioridade do MVP atual.

### Frentes concluídas

- [x] Acesso ao repositório remoto confirmado.
- [x] Branch `codex/p1-auth-ci-monitoring` confirmada.
- [x] Commit-base confirmado: `0397eb507a54358275c4dba54531cba66025a7e0`.
- [x] Inspeção técnica somente leitura concluída.
- [x] Projeto original não foi modificado.
- [x] Baseline validado: 60 testes aprovados, typecheck aprovado e build aprovado com placeholders públicos do CI.
- [x] P0 concluída: cópia independente criada, Git local inicializado sem remote e origem documentada.
- [x] P1 concluída: manifesto, ícones, metadados Apple e orientação de instalação implementados.
- [x] P2 concluída: service worker restritivo, tela offline, atualização controlada e headers de segurança implementados.
- [ ] P3 em andamento: contrato de callback de autenticação centralizado e cobertura automatizada ampliada; RLS/Storage reais ainda dependem de ambiente e contas de teste.
- [ ] P4 em andamento: navegação inferior, safe areas e viewport dinâmica ajustados.
- [ ] P6 em andamento: testes automatizados do manifesto, ícones e regras de cache adicionados.
- [x] P7 concluída: servidor local, endpoints PWA, ambiente Supabase real e validação manual preliminar verificados.
- [x] P8 concluída: projeto Vercel independente, variáveis públicas, Redirect URL, deployment e testes manuais de produção validados.
- [x] Plano de commits criado em `PLANO_DE_COMMITS.md`.
- [x] Linha do tempo mobile por dia: implementação e testes locais concluídos em 2026-09-22; usuário aprovou a versão local e autorizou commit e deploy.

### Frentes pendentes

- [x] Criar a cópia independente do projeto.
- [x] Criar manifesto e ícones PWA.
- [x] Criar service worker.
- [x] Implementar cache seguro e atualização controlada.
- [ ] Adaptar a experiência para iPhone.
- [ ] Validar autenticação, RLS, Storage e exportações.
- [ ] Executar validação local completa.
- [x] Obter aprovação explícita para commit, push e deploy; autorização foi concedida e o deployment independente foi executado.

## 2. Objetivo

Criar uma PWA independente para uso familiar em até cinco iPhones, mantendo o sistema web original intacto e utilizando o mesmo projeto Supabase, os mesmos usuários e os mesmos dados.

O PWA terá:

- repositório Git independente;
- configuração e deploy Vercel independentes;
- domínio próprio;
- pipeline próprio;
- manifesto, ícones e service worker próprios;
- experiência otimizada para toque e modo standalone;
- autenticação e RLS preservados;
- nenhuma gravação offline no MVP.

## 3. Fora do escopo do MVP

- Web Push e notificações.
- Fila de gravações offline.
- Alterações de tabelas, policies, funções ou buckets do Supabase.
- Migração ou aposentadoria do sistema web original.
- Recuperação de senha, OAuth ou magic link, caso não existam no projeto-base.
- Reescrita completa da interface ou mudança da identidade visual.

## 4. Regras de segurança e operação

1. O sistema web original não pode ser editado, reconfigurado ou usado como destino de deploy.
2. O novo trabalho deve ocorrer em diretório e repositório independentes.
3. O commit-base deve ser verificado antes da cópia.
4. Nunca expor `service_role`, chaves secretas, tokens ou arquivos `.env`.
5. O cliente pode usar somente a chave pública/publicável do Supabase.
6. RLS e policies de Storage continuam sendo o controle efetivo de autorização.
7. Não aplicar migrations, `supabase db push` ou alterações no Supabase durante o MVP.
8. A única alteração externa esperada é adicionar as Redirect URLs exatas do novo domínio, quando ele existir.
9. Testes destrutivos devem usar contas e dados de teste controlados.
10. Nenhum commit, push ou deploy será feito sem autorização explícita; nesta frente a autorização foi concedida pelo usuário.
11. O projeto deve ser servido localmente para validação antes de qualquer commit ou deploy.
12. Push e deploy só podem ocorrer após confirmação explícita do usuário e verificação dos remotes e do vínculo Vercel; a implantação atual usa somente o novo projeto `finance-pessoal-pwa`.

## 5. Baseline confirmado

### Origem

- Repositório: `https://github.com/Juniorreis25/Finance_pessoal.git`
- Branch: `codex/p1-auth-ci-monitoring`
- Commit: `0397eb507a54358275c4dba54531cba66025a7e0`
- Mensagem: `fix: secure per-user signup and records`
- Aplicação: diretório `web/`

### Stack

- Next.js `16.3.5` com App Router e Turbopack.
- React `19.2.3`.
- TypeScript.
- Tailwind CSS `4`.
- Supabase JS `2.95.3`.
- `@supabase/ssr` `0.8.0`.
- Vitest `4.1.11`.
- Node.js usado na inspeção: `24.13.0`.

### Resultado da inspeção

| Verificação | Resultado | Evidência |
|---|---|---|
| Instalação | Aprovada | `npm ci`, 543 pacotes, 0 vulnerabilidades no audit |
| Testes | Aprovados | 16 arquivos, 60 testes |
| TypeScript | Aprovado | `npx tsc --noEmit` |
| Lint | Aprovado com ressalvas | 0 erros, 19 warnings |
| Build | Aprovado com placeholders | `npm run build` com variáveis públicas fictícias |
| PWA | Ainda inexistente | Sem manifesto ou service worker no baseline |
| Headers de segurança | Ainda inexistentes | Não configurados em `next.config.ts` |

### Arquitetura atual relevante

- Cliente browser Supabase: `web/src/lib/supabase/client.ts`.
- Cliente server Supabase: `web/src/lib/supabase/server.ts`.
- Proteção de rotas: `web/src/proxy.ts`.
- Callback de confirmação: `web/src/app/auth/callback/route.ts`.
- Health check: `web/src/app/api/health/route.ts`.
- RLS e Storage: `web/supabase/migrations/`.
- Modo de demonstração local: `web/src/lib/local-demo.ts`.

### Observações confirmadas

- A aplicação já usa cookies e `@supabase/ssr` para sessão no servidor.
- O callback usa `exchangeCodeForSession`.
- O cadastro e o reenvio de confirmação usam `${location.origin}/auth/callback`.
- A navegação mobile já existe parcialmente, mas não atende integralmente ao layout de cinco áreas planejado.
- A classe `pb-safe` aparece na interface, mas não há definição correspondente identificada.
- Não foram encontrados manifesto, service worker, tela offline ou controle de atualização PWA.
- O modo de demonstração usa `localStorage`, mas é condicionado ao ambiente de desenvolvimento.
- Não foram encontrados fluxos de recuperação de senha, OAuth ou magic link.
- Os scripts auxiliares `check-type.js` e `debug-data.js` não devem ser levados para o novo PWA.

## 6. Arquitetura alvo

```text
Sistema web original                 Finance Pessoal PWA
repositório e Vercel atuais          novo repositório e nova Vercel
domínio atual                        novo domínio
          \                              /
           \                            /
                 Mesmo Supabase
        Auth + Database + Storage + RLS
```

O código será independente, mas o backend será compartilhado. Portanto, alterações no Supabase continuam sendo alterações potencialmente compartilhadas pelos dois sistemas.

## 7. Plano de execução

### P0 — Fundação e separação segura

**Status:** concluída em 2026-09-22.  
**Estimativa:** 1–2 dias.

#### Atividades

- Criar uma cópia independente a partir do commit exato.
- Verificar que o diretório não está dentro do repositório web original.
- Preservar `package-lock.json`.
- Remover o vínculo `origin` original antes de qualquer push.
- Não copiar `.git`, `.vercel`, `.next`, `node_modules` ou `.env`.
- Remover ou excluir scripts de diagnóstico com configuração de produção.
- Criar `.env.example` sem valores reais.
- Criar documento de origem com repositório, branch e SHA.
- Reexecutar testes, lint, typecheck e build com placeholders.

#### Critérios de aceite

- O PWA está em diretório separado.
- O projeto original permanece sem alterações.
- O novo repositório não aponta para o repositório web original.
- O SHA de origem está documentado e verificável.
- Testes, typecheck e build passam.
- Nenhum segredo ou `.env` é copiado.

#### Evidências da conclusão

- Cópia criada em `C:\Users\jcjju\Documents\Finance_Pessoal_PWA`.
- `SOURCE_COMMIT.md` registra o repositório, branch e SHA de origem.
- Git local inicializado na branch `main`, sem remotes configurados.
- `.git`, `.vercel`, `.next`, `node_modules`, `.env` e scripts de diagnóstico foram excluídos da cópia.
- `npm ci`: aprovado, 543 pacotes instalados e 0 vulnerabilidades no audit.
- `npm test`: 16 arquivos e 60 testes aprovados.
- `npx tsc --noEmit`: aprovado.
- `npm run lint`: aprovado com 19 warnings preexistentes, sem erros.
- `npm run build` com placeholders públicos do CI: aprovado.

### P1 — Manifesto, ícones e instalação

**Status:** concluída em 2026-09-22.  
**Estimativa:** 1–2 dias.

#### Atividades

- Criar `app/manifest.ts`.
- Definir `name`, `short_name`, `description`, `start_url`, `scope`, `display`, `orientation` e cores.
- Criar ícones 192x192, 512x512, maskable e Apple touch icon.
- Configurar `appleWebApp` e `viewport-fit=cover`.
- Detectar Safari iOS e modo standalone.
- Criar orientação de instalação sem depender de `beforeinstallprompt`.

#### Critérios de aceite

- Manifesto válido.
- Ícones carregam nos tamanhos exigidos.
- A aplicação abre em modo standalone quando iniciada pela tela inicial.
- A orientação só aparece quando aplicável e pode ser reaberta.

#### Evidências da conclusão

- Manifesto criado em `src/app/manifest.ts`.
- Build confirma a rota estática `/manifest.webmanifest`.
- Metadados `appleWebApp` e `viewport-fit=cover` adicionados ao layout.
- Prompt de instalação criado em `src/components/pwa/InstallPrompt.tsx`.
- Prompt detecta Safari iOS e modo standalone, permite dispensa e não depende de `beforeinstallprompt`.
- Ícones criados em `public/icon-192x192.png`, `public/icon-512x512.png`, `public/icon-maskable-512x512.png` e `public/apple-touch-icon.png`.
- 60 testes aprovados, typecheck aprovado e build aprovado com placeholders públicos do CI.
- Lint aprovado com 19 warnings preexistentes e nenhum erro.

### P2 — Service worker e cache seguro

**Status:** concluída em 2026-09-22.  
**Estimativa:** 2–3 dias.

#### Política

O service worker só poderá armazenar assets estáticos versionados, como ícones, fontes, CSS e JavaScript imutável.

Não armazenar pelo service worker:

- respostas do Supabase;
- Auth, cookies, tokens ou sessões;
- HTML ou RSC de páginas autenticadas;
- banco, Storage, uploads ou avatares;
- lançamentos, cartões, recorrências ou perfis;
- exportações CSV, XLSX ou PDF.

#### Atividades

- Implementar service worker mínimo e com escopo explícito.
- Usar rede para autenticação, callbacks e dados de usuário.
- Criar tela offline genérica, sem dados financeiros.
- Versionar caches.
- Remover caches obsoletos na ativação.
- Implementar atualização controlada e aviso de nova versão.
- Limpar estado de aplicação e caches aplicáveis no logout.
- Confirmar que o modo de demonstração não é ativado em produção.

#### Critérios de aceite

- Nenhuma requisição ao Supabase é armazenada pelo service worker.
- Offline não apresenta dados financeiros antigos.
- Logout seguido de login com outro usuário não reutiliza estado anterior.
- Atualização não deixa chunks incompatíveis.
- A tela offline não revela informações do usuário.

#### Evidências da conclusão

- Service worker criado em `public/sw.js` sem biblioteca adicional.
- Cache limitado a `offline.html`, manifesto, ícones e assets `/_next/static/`.
- Navegações, callbacks, `/api`, `/_next/data/`, Supabase e Storage não usam cache do service worker.
- Tela offline criada em `public/offline.html` sem dados financeiros.
- Registro do service worker restrito ao build de produção.
- Atualização controlada implementada por `SKIP_WAITING` acionado pelo usuário.
- Caches antigos são removidos na ativação.
- Headers de segurança adicionados em `next.config.ts`.
- `sw.js` passou em `node --check`.
- Servidor local respondeu `200` para manifesto, service worker, tela offline e ícone.
- Headers CSP, `X-Frame-Options`, `X-Content-Type-Options` e `Referrer-Policy` confirmados localmente.
- CSP permite `unsafe-eval` somente no desenvolvimento, mantendo a política de produção restritiva.
- 60 testes, typecheck e build aprovados; lint sem erros, com 19 warnings preexistentes.

### P3 — Autenticação, RLS e Storage

**Status:** em andamento; autenticação, RLS e isolamento por API validados com duas contas em 2026-09-22.  
**Estimativa:** 2–3 dias.

#### Atividades

- Preservar o fluxo atual de `@supabase/ssr`.
- Manter `proxy.ts` ou adaptar a nomenclatura sem alterar a lógica de proteção.
- Manter cadastro, login, confirmação, logout e renovação de sessão.
- Usar o novo domínio dinamicamente no callback.
- Validar o fluxo com confirmação de e-mail.
- Testar sessão expirada, troca de usuário e abertura do link fora do PWA.
- Validar RLS com duas contas reais de teste.
- Validar Storage de avatar e políticas de acesso.

#### Intervenção externa esperada

Adicionar ao Supabase as URLs exatas do novo domínio, preservando a URL do web original. Não alterar tabelas, policies, funções ou buckets.

#### Critérios de aceite

- Usuário A não acessa dados de usuário B.
- Transações, cartões, recorrências, categorias, perfil e avatares permanecem isolados.
- O callback do novo domínio cria a sessão corretamente.
- O callback do domínio original continua funcionando.
- Sessão expirada redireciona para login.

#### Evidências parciais

- Redirect de autenticação centralizado em `src/lib/supabase/redirect.ts`.
- Redirect URLs locais informadas pelo usuário no painel do Supabase.
- Cadastro e reenvio de confirmação usam o callback baseado no domínio atual.
- O callback existente continua preservando a troca de `code` por sessão.
- Teste automatizado cobre domínio, caminho e query string do callback.
- Login de `usuario_a@teste.com.br` e `usuario_b@teste.com.br` aprovados com IDs distintos.
- Consultas autenticadas de `cards`, `transactions`, `recurring_expenses`, `categories` e `user_profiles` não retornaram linhas de outro usuário.
- Acesso cruzado direto por ID retornou zero registros nos testes B→A e A→B.
- Listagem autenticada do bucket `avatars` não expôs caminhos de outro usuário.
- Token inválido foi rejeitado com HTTP 403.
- Rotas protegidas sem sessão redirecionaram para `/login` com HTTP 307.
- Testes manuais realizados pelo usuário aparentam estar funcionando sem erro bloqueante relatado.
- 18 arquivos e 68 testes aprovados.
- Typecheck e build aprovados com placeholders públicos.

#### Validação remota somente leitura

- Projeto confirmado: `finance_pessoal_v2` (`giuaayoosrujxtlgdift`).
- Projeto `ACTIVE_HEALTHY`, região `us-east-2`.
- Migrations de segurança `secure_rls_storage_and_rpc` e `secure_avatar_storage` presentes.
- Tabelas financeiras (`cards`, `transactions`, `categories`, `recurring_expenses`, `user_profiles`) com RLS habilitado.
- `storage.buckets` e `storage.objects` com RLS habilitado.
- Nenhum dado de negócio foi lido ou alterado durante essa inspeção.

#### Pendências externas

- Domínio Vercel definido: `https://finance-pessoal-pwa.vercel.app`.
- Adicionar a Redirect URL exata `https://finance-pessoal-pwa.vercel.app/auth/callback` no Supabase, preservando as URLs existentes do web original e do ambiente local.
- Testar cadastro e confirmação de e-mail com conta de teste.
- Testar sessão expirada, logout, troca de usuário e renovação.
- Executar upload real de avatar com as duas contas e confirmar isolamento do Storage.
- Confirmar o fluxo completo pela interface do navegador, incluindo logout e troca de usuário.
- Avaliar no painel do Supabase a ativação da proteção contra senhas vazadas, apontada pelo advisor de segurança.
- Avaliar posteriormente os três índices de chaves estrangeiras apontados pelo advisor de performance, sem aplicar alteração neste MVP.

- Redirect URL do domínio de produção foi adicionada no painel do Supabase; o usuário informou que os testes de produção foram concluídos com sucesso.

### P4 — UX específica para iPhone

**Status:** em andamento; primeira rodada de navegação, safe areas, formulários e gráficos concluída e validada em viewport mobile em 2026-09-22.
**Estimativa:** 4–6 dias.

#### Atividades

- Criar barra inferior com Início, Lançamentos, Recorrentes, Cartões e Perfil.
- Corrigir safe areas com `env(safe-area-inset-top/bottom)`.
- Usar `100dvh` onde apropriado.
- Garantir áreas de toque de pelo menos 44px.
- Remover dependências de hover em ações essenciais.
- Ajustar teclado, campos monetários, datas e selects.
- Transformar modais em painéis adequados ao mobile.
- Evitar conteúdo oculto pela barra inferior.
- Preservar privacidade e acessibilidade.
- Simplificar gráficos em telas pequenas sem remover informação essencial.

#### Critérios de aceite

- Nenhuma tela exige zoom manual.
- Formulários continuam utilizáveis com o teclado aberto.
- Ações principais ficam acessíveis com uma mão.
- A barra inferior não cobre conteúdo.
- Não há dependência de hover para completar fluxos.

#### Evidências parciais

- Navegação mobile agora exibe as cinco áreas: Início, Lançamentos, Recorrentes, Cartões e Perfil.
- Barra inferior usa safe area inferior e áreas de toque mínimas.
- Layout principal e sidebar usam `100dvh`.
- Padding inferior impede que a barra de navegação cubra o conteúdo.
- Header mobile respeita a safe area superior.
- Formulários principais receberam espaçamento responsivo, áreas de toque mínimas e campos numéricos adequados para teclado móvel.
- Modal de recorrência recebeu rolagem limitada e padding de safe area para uso com teclado aberto.
- Hostname do Storage Supabase configurado no `next/image`, permitindo exibir avatares remotos no perfil.
- Controles principais receberam altura mínima de 44px para toque e o Safari recebe fontes de 16px em campos para evitar zoom automático.
- Containers de dashboard e formulários foram ajustados com `min-w-0`, espaçamento responsivo e títulos/valores adaptáveis a telas estreitas.
- Containers Recharts receberam dimensão inicial e mínimos explícitos; a validação visual não registrou mais avisos de dimensão.
- Rotas `/dashboard`, `/transactions`, `/transactions/new`, `/cards`, `/cards/new`, `/recurring`, `/recurring/new` e `/profile` foram verificadas em viewport 390x844 sem overflow horizontal.
- Navegação inferior e abertura do menu lateral foram acionadas e verificadas por toque em viewport mobile.
- Build, typecheck e 68 testes continuam aprovados; lint permanece sem erros.

#### Linha do tempo de transações — publicada

- A lista de `/transactions` passou a exibir o mês em foco e o mês anterior, com cabeçalhos e divisores horizontais. O seletor de mês desloca essa janela de dois meses.
- Busca e filtros valem para os dois meses; o resumo e a exportação continuam limitados ao mês em foco. O agrupamento usa a data do lançamento (`date`), inclusive para parcelas.
- Ocorrências recorrentes aparecem nos dois meses com indicação de previsão. Meses sem resultados recebem mensagem própria quando há lançamentos no outro mês.
- Foram adicionados testes para virada de ano, separação dos totais, paginação, filtros, recorrências e navegação mensal. A suíte completa passou com 74 testes; build, typecheck e lint dos arquivos alterados passaram. A tela foi conferida em viewport de iPhone no navegador local e aprovada pelo usuário para commit e deploy. A validação no iPhone real continua pendente na frente P4.
- Commit de implementação `3bd0f65` publicado em `main`. Deployment de produção `dpl_3u3os68hRAdeSca7GPF9GFYwrKdb` ficou `Ready` e foi associado a `https://finance-pessoal-pwa.vercel.app`; `/api/health` respondeu HTTP 200. A funcionalidade autenticada em produção ainda depende da validação do usuário no iPhone.

Ainda pendentes nesta frente: validação visual e funcional em iPhone real, teclado nativo, modo standalone, rotação, conexão lenta e sessão expirada.

### P5 — Exportações e avatar (adiada)

**Status:** adiada por decisão do usuário; não bloqueia o MVP funcional mobile.
**Estimativa:** 2–3 dias.

Esta frente não será executada antes da conclusão da compatibilidade mobile e da validação dos fluxos essenciais no iPhone.

#### Atividades

- Preservar CSV, XLSX e PDF.
- Usar `navigator.canShare({ files })` antes de compartilhar arquivos.
- Usar download tradicional como fallback.
- Testar abertura no app Arquivos.
- Testar compartilhamento quando suportado.
- Testar seleção, compressão e orientação de fotos do iPhone.
- Evitar armazenamento de exportações no service worker.

#### Critérios de aceite

- Os três formatos continuam disponíveis.
- O fallback de download funciona.
- O avatar é selecionável da biblioteca de fotos.
- Relatórios maiores não bloqueiam ou travam a interface de forma crítica.

### P6 — Testes automatizados e auditoria

**Status:** em andamento; contrato de PWA e regras de cache cobertos automaticamente em 2026-09-22.  
**Estimativa:** 2–4 dias.

#### Testes automatizados

- Suíte existente: 60 testes devem continuar passando.
- Manifesto válido.
- Ícones PNG presentes e com dimensões esperadas.
- Registro e atualização do service worker.
- Exclusão de caches antigos.
- Rotas autenticadas.
- Cadastro, login, callback e logout.
- Troca de usuário sem vazamento de estado.
- Regras de cache do Supabase.
- Responsividade básica.
- Lint, typecheck e build.
- Auditoria de dependências e segredos.

#### Evidências parciais

- Novo teste `src/__tests__/pwa-assets.test.ts` valida manifesto, ícones e isolamento de dados no service worker.
- Redirect de autenticação também possui cobertura automatizada em `src/lib/supabase/redirect.test.ts`.
- Total atual: 18 arquivos e 68 testes aprovados.
- Typecheck aprovado.

Ainda pendentes nesta frente: testes de registro/atualização do service worker em navegador real, responsividade visual e auditoria final de dependências/segredos.

#### Testes manuais em iPhone

- Safari normal.
- PWA instalado.
- Modo retrato.
- Tela pequena e grande.
- Teclado aberto em formulários.
- Internet lenta.
- Perda e retorno de conexão.
- Sessão expirada.
- Atualização de versão.
- Dois usuários distintos.
- Exclusão e reinstalação do ícone.
- Exportação e upload de avatar.

Sem aparelho real, os testes acima devem ser registrados como pendentes; auditoria automática não comprova comportamento completo do Safari/iOS.

### P7 — Validação local e entrega preparada

**Status:** concluída em 2026-09-22; validação automatizada e manual preliminar aprovadas.  
**Estimativa:** 1–2 dias.

#### Atividades

- Rodar a aplicação localmente.
- Executar health check local.
- Confirmar que o web original não foi modificado.
- Conferir `git remote -v`.
- Conferir ausência ou conteúdo seguro de `.vercel/project.json`.
- Conferir arquivos staged e não staged.
- Registrar limitações e passos manuais.
- Preparar commit local, sem push.

#### Critérios de aceite

- Servidor local funcionando.
- Build, lint, typecheck e testes aprovados.
- Nenhuma alteração externa pendente além das explicitamente documentadas.
- Usuário recebe instrução curta para qualquer ação manual.

#### Evidências parciais

- Servidor local iniciado em `http://localhost:3101`.
- `/manifest.webmanifest`, `/sw.js`, `/offline.html` e ícone 192x192 responderam HTTP 200.
- Manifesto servido com `display: standalone` e `start_url: /dashboard`.
- `/api/health` respondeu `200 {"status":"ok"}` com as credenciais públicas reais do projeto.
- `git remote -v` aponta somente para o repositório independente `finance-pessoal-pwa`.
- `.vercel/project.json` existe apenas localmente, está ignorado pelo Git e aponta para o novo projeto Vercel `finance-pessoal-pwa`; `.env.local` também existe apenas localmente e está ignorado pelo Git.

> A chave pública foi gravada apenas no `.env.local`, que está ignorado pelo Git. Nenhuma chave secreta foi armazenada ou enviada ao repositório.

Não há pendências locais bloqueantes nesta frente. A validação de produção está registrada na P8.

### P8 — Commit, push e deploy independente

**Status:** concluída em 2026-09-22; deployment, callback e testes manuais de produção validados.
**Estimativa:** 1 dia, sem contar credenciais ou configuração externa.

#### Pré-condições obrigatórias

- Validação local concluída.
- Aprovação explícita do usuário.
- Novo repositório GitHub confirmado.
- Novo projeto Vercel confirmado.
- `git remote -v` não aponta para o sistema web original.
- `.vercel/project.json`, se existir, não aponta para o projeto original.
- Variáveis públicas do Supabase configuradas no ambiente correto.
- Redirect URL do novo domínio adicionada ao Supabase.
- Plano de rollback definido.

#### Evidências da execução

- Repositório independente: `https://github.com/Juniorreis25/finance-pessoal-pwa.git`.
- Projeto Vercel independente: `finance-pessoal-pwa` (`prj_MHWJpaYdWPPeQOCS6syyXIivEUtw`).
- Preset do projeto corrigido de `Other` para `Next.js`; o primeiro deployment servia apenas arquivos públicos e foi descartado operacionalmente.
- Variáveis públicas do Supabase configuradas nos ambientes Development, Preview e Production do novo projeto, sem expor valores neste documento.
- Deployment de produção validado após o commit mobile `5bc15a1` (`feat(mobile): harden iPhone touch and responsive layouts`), deployment `dpl_GZ5jwHipqbkz7dkDeCmakXo9hmxK`.
- URL permanente: `https://finance-pessoal-pwa.vercel.app`.
- Deployment verificado como `READY`; build Next.js concluiu TypeScript, geração estática e rotas App Router.
- `/api/health` respondeu `200 {"status":"ok"}` no deployment e no alias permanente.
- `/login` respondeu com a interface de autenticação; `/manifest.webmanifest` respondeu com `display: standalone` e `start_url: /dashboard`.
- O alias `https://finance-pessoal-pwa.vercel.app` foi atualizado após a rodada de compatibilidade mobile.
- Após a adição da Redirect URL, a abertura de `/auth/callback?code=invalid-test-code` redirecionou corretamente para `/login?error=auth_callback`, sem 404.
- A validação de produção não registrou erros ou warnings no console do navegador.
- Não foram encontrados erros de runtime no projeto Vercel no período de verificação.

#### Pendências relacionadas a outras frentes

- Confirmar em iPhone real a instalação PWA e os fluxos essenciais em produção; avatar e exportações permanecem adiados na P5.

#### Validação final registrada

- Redirect URL de produção foi adicionada ao Supabase pelo usuário.
- O usuário realizou os testes de produção e informou sucesso.
- A validação inclui o acesso ao app publicado no domínio Vercel e o fluxo de autenticação após a configuração do callback.

Não fazer push ou deploy se qualquer vínculo com o projeto web original for encontrado.

## 8. Riscos e mitigação

| Risco | Impacto | Mitigação | Status |
|---|---|---|---|
| Testes escreverem no Supabase produtivo | Alto | Contas/dados de teste e ambiente controlado | Aberto |
| Cache exibir dados de outro usuário | Crítico | Network-only para dados, limpeza de estado e testes com duas contas | Aberto |
| Callback voltar ao domínio errado | Alto | Redirect URL exata e teste de confirmação | Aberto |
| Service worker servir chunks incompatíveis | Médio/alto | Versionamento, atualização controlada e fallback | Aberto |
| RLS remota divergir das migrations locais | Alto | Não aplicar SQL; reconciliar apenas em frente separada | Aberto |
| PWA mobile cobrir conteúdo com barra/teclado | Médio | Safe areas, `100dvh` e testes reais | Aberto |
| Exportação falhar no iOS | Médio | Frente P5 adiada; validar somente após estabilizar o MVP mobile | Adiado |
| Correções divergirem entre web e PWA | Médio | Registro de origem e processo de portabilidade | Aberto |
| Deploy apontar para projeto errado | Crítico | Verificação obrigatória de remote e `.vercel/project.json` | Mitigado; projeto independente conferido |

## 9. Definição de pronto

O MVP só será considerado concluído quando:

- o PWA estiver em repositório separado;
- o sistema web original estiver intacto;
- o commit de origem estiver documentado;
- manifesto, ícones e standalone funcionarem;
- o service worker não armazenar dados financeiros;
- autenticação e callback funcionarem no novo domínio;
- RLS e Storage forem validados com duas contas;
- navegação e formulários estiverem adequados ao iPhone;
- CSV, XLSX, PDF e avatar forem validados;
- testes, lint, typecheck e build passarem;
- limitações de iOS estiverem registradas;
- health check estiver funcionando;
- push/deploy só ocorrerem após autorização explícita.

## 10. Procedimento de atualização deste documento

Ao concluir qualquer frente:

1. Alterar o status da frente para concluída, parcial ou bloqueada.
2. Registrar a data e os comandos/testes executados.
3. Atualizar os critérios de aceite com evidências objetivas.
4. Mover riscos resolvidos para o histórico ou marcar a mitigação.
5. Registrar novas decisões na tabela abaixo.
6. Atualizar a seção “Próxima frente”.
7. Não marcar uma frente como concluída apenas porque o código foi escrito; a validação correspondente também precisa estar registrada.

## 11. Registro de decisões

| Data | Decisão | Motivo | Impacto |
|---|---|---|---|
| 2026-09-22 | Usar o commit `0397eb5` como baseline | Origem estável e verificável | Evita copiar estado não auditado |
| 2026-09-22 | Manter o Supabase compartilhado | Preserva usuários e dados existentes | Exige cuidado com redirects, RLS e testes |
| 2026-09-22 | Não implementar gravação offline | Evita duplicidade, conflito e exposição local | Offline será somente informativo |
| 2026-09-22 | Não alterar migrations no MVP | Banco compartilhado e histórico remoto precisa de reconciliação | Mudanças de schema ficam fora do escopo |
| 2026-09-22 | Usar um projeto Vercel independente com preset explícito `Next.js` | O projeto criado inicialmente ficou com preset `Other` e não executou o build | Evita publicação apenas de arquivos estáticos |
| 2026-09-22 | Publicar em `https://finance-pessoal-pwa.vercel.app` | Domínio Vercel independente definido pelo usuário | Exige Redirect URL correspondente no Supabase |
| 2026-09-22 | Executar push/deploy após autorização explícita | Usuário autorizou a publicação do PWA independente | Deployment de produção validado; autenticação ainda precisa de teste no domínio |
| 2026-09-22 | Priorizar funcionalidade e compatibilidade mobile no iPhone | Uso familiar depende primeiro de fluxos essenciais estáveis no dispositivo | Exportações e avatar foram adiados para depois do MVP mobile |
| 2026-09-22 | Exibir dois meses na linha do tempo de Transações | Facilita identificar o corte do mês sem trocar de tela | Resumo e exportação continuam restritos ao mês em foco; commit `3bd0f65` e deployment de produção `dpl_3u3os68hRAdeSca7GPF9GFYwrKdb` publicados |
| 2026-09-22 | Agrupar transações por dia em um único balão no mobile, mantendo cartões no desktop | Reduz rolagem e melhora a leitura do extrato no iPhone | Paginação mobile por dias inteiros; cabeçalho mensal preservado; não exibir saldo diário sem dados para calculá-lo; validação local antes de commit/deploy |

### Validação local da linha do tempo mobile

- Esboço aprovado pelo usuário e implementado na rota `/transactions` para telas abaixo de 640 px.
- Cabeçalho do mês, data e balão único para todos os lançamentos do dia; lançamentos recorrentes continuam marcados como previstos e levam à gestão de recorrências.
- Seletor de mês em chips, resumo compacto e busca/filtros funcionais no mobile; layout desktop anterior preservado.
- Paginação mobile por até 10 dias, sem separar lançamentos da mesma data entre páginas.
- `npm test -- --reporter=dot`: 76 testes aprovados, incluindo agrupamento e paginação mobile.
- `npx tsc --noEmit`: aprovado. `npm run build`: aprovado. `npm run lint`: 0 erros; 19 avisos preexistentes fora dos arquivos desta frente.
- Navegador local em 390 px: lista carregou com dados reais, agrupamento, busca e troca de mês verificados; sem erros de console observados. Comparação visual registrada em `design-qa.md`.
- Usuário validou a tela no navegador local renderizado em 390 × 844 px e autorizou commit e deploy. Código, testes e QA versionados em `b75011d` e enviados ao repositório independente.
- Primeira publicação de produção: `dpl_67hwrnbaxngqKz9zyARr5ohSuKqw`, status `READY`, alias `https://finance-pessoal-pwa.vercel.app`. `/api/health` respondeu `200 {"status":"ok"}`; `/transactions` sem sessão redirecionou para `/login`, sem erros de console observados.
- A checagem de toque e safe area no iPhone real continua recomendada. Nenhuma alteração de Supabase ou do projeto web original foi necessária.

### Ajustes mobile em validação local — recorrentes, cartões e sessão

- Recorrências e cartões receberam listas compactas no mobile, inclusive busca, ações e estados vazios. A apresentação de cartão agora mostra nome, situação, vencimento, fechamento e **limite cadastrado** sem recorte; não há cálculo de limite bancário disponível no modelo atual.
- O conteúdo pode ser puxado para baixo a partir do topo para atualizar a página e recarregar os dados. O gesto tem indicação visual e limiar para evitar atualizações acidentais.
- Com 30 segundos sem interação, o app solicita nova autenticação. O logout usa escopo local do Supabase, preservando as sessões em outros dispositivos; o prazo também é verificado ao retornar de segundo plano ou reabrir a página. Trata-se de controle de sessão no cliente, não de redução do prazo de validade dos JWTs emitidos pelo servidor.
- Validação automatizada em 2026-09-22: 82 testes aprovados, `tsc` e build aprovados, lint sem erros e 15 avisos preexistentes fora dos arquivos alterados.
- Navegador local em viewport de iPhone: recorrências reais, cartão real do usuário de teste e mensagem de sessão expirada conferidos sem cortes. O gesto de toque e o comportamento em PWA instalado ainda requerem validação no iPhone real.
- **Status:** alterações locais não versionadas nem publicadas; aguardar validação do usuário antes de commit e deploy.

### Padronização mobile das páginas de edição e formulários

- Revisão de responsividade nas rotas de dashboard, transações, recorrências, cartões e perfil, além de login/cadastro e modal de recorrência. O layout principal de transações e recorrências já tinha adaptação mobile; os principais pontos pendentes estavam nos formulários de edição/criação, perfil, cadastro e modal.
- Cabeçalhos de formulário agora compartilham hierarquia, tamanho e descrição; formulários de transação, cartão e recorrência usam espaçamento compacto, campos legíveis, botões de toque e composição adequada à largura do telefone.
- No perfil, nome e mensagem de boas-vindas vêm antes da foto, que fica recolhida como ajuste opcional. O foco automático nos campos foi removido para impedir que o teclado abra sozinho ao navegar.
- A regra de tamanho mínimo de 16 px para evitar zoom no Safari agora preserva o destaque dos campos de valores monetários.
- O modal de recorrência usa área segura, rolagem interna, rótulo de diálogo e ações compatíveis com telas menores.
- Evidências visuais do navegador mobile: `.audit/mobile-review/01-cartao-editar.png`, `02-transacao-editar.png`, `03-perfil.png` e `04-cadastro.png`. A rota de recorrência/modal foi revisada no código, mas não capturada: a conta de teste não tinha recorrências e a sessão expirou; nenhum dado foi criado ou alterado para contornar isso.
- `impeccable detect` não apontou falhas visuais estáticas nos arquivos revistos. Em 2026-09-23, `npx tsc --noEmit`, 82 testes (22 arquivos) e `npm run build` passaram. `npm run lint` passou sem erros, com 4 avisos preexistentes em arquivos fora do escopo desta frente. `/api/health` respondeu `200 {"status":"ok"}`.
- Relatório e sequência da auditoria: `.audit/mobile-review/README.md`.
- **Status:** implementação e verificações automatizadas concluídas; commit `c265902` enviado para `main` e publicado em produção. Recomenda-se conferir interação/toque em iPhone real.

### Refino mobile dos controles de parcelamento e recorrência

- No mobile, “Compra parcelada” e “Despesa recorrente” agora aparecem agrupadas em um painel compacto com separador e uma orientação explícita de exclusividade. No desktop, os dois cartões independentes e seus estilos permanecem.
- O trilho visual dos interruptores foi reduzido no mobile, preservando alvos de toque de 44 × 44 px, foco visível e rótulos acessíveis. Campos de quantidade e resumo do parcelamento continuam condicionais.
- Verificação visual local em 390 × 844 px e 1280 × 900 px, sem salvar transação; a renderização mobile ficou agrupada e a desktop manteve os cartões separados.
- Testes: 83 aprovados em 22 arquivos; `npx tsc --noEmit` e `npm run build` aprovados; lint sem erros, com 4 avisos preexistentes; detector Impeccable sem apontamentos antes do último ajuste de divisor.
- Validação de release: `098564c` (`fix: compact recurring options on mobile`) enviado à `main`; deployment Vercel `dpl_B53WXuW4thuqhMb8rkBgjhhfPAEX` concluído como `READY` e associado ao alias de produção. `/api/health` respondeu `200 {"status":"ok"}`.
- **Status:** ajuste implementado, validado, versionado, enviado e publicado. Interações no iPhone físico continuam recomendadas para conferência de toque.

## 12. Evidências e referências

- Repositório de origem: `https://github.com/Juniorreis25/Finance_pessoal.git`
- Aplicação original: `web/`
- Instrução local de validação: `.agent/rules/implementacao-teste-local.md`
- Arquitetura local: `.agent/ARCHITECTURE.md`
- Fluxo de autenticação: `web/src/proxy.ts` e `web/src/app/auth/callback/route.ts`
- Migrações e cautelas do Supabase: `web/supabase/README.md`
- Testes: `web/src/**/*.test.*`
- Plano de versionamento: `PLANO_DE_COMMITS.md`
