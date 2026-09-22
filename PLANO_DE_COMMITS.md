# Plano de commits — Finance Pessoal PWA

Este plano organiza o histórico para facilitar revisão, auditoria, rollback e identificação da origem de cada mudança.

## Regras gerais

- Usar mensagens no padrão Conventional Commits.
- Um commit deve representar uma única intenção técnica.
- Não misturar refatoração, correção visual e nova funcionalidade no mesmo commit.
- Cada commit deve passar pelos testes aplicáveis antes de ser criado.
- Não incluir `.env`, tokens, `service_role`, `.vercel`, `.next` ou `node_modules`.
- Não fazer push ou deploy sem autorização explícita.
- A branch inicial deve permanecer sem remote até o novo repositório GitHub ser confirmado.
- Commits devem ser criados somente após validação local e autorização explícita.

## Estado de execução

- Repositório independente confirmado: `https://github.com/Juniorreis25/finance-pessoal-pwa.git`.
- Primeiro commit publicado em `main`: `6336c03` (`chore: initialize independent finance pessoal pwa`).
- O primeiro commit consolidou o baseline, a documentação, a implementação PWA, a adaptação mobile e os testes que estavam preparados antes da publicação.
- A partir do próximo commit, seguir a separação C08–C11 e manter cada intenção técnica isolada.

## Ordem planejada

### C01 — Baseline independente

**Mensagem sugerida:**

```text
chore: bootstrap independent PWA from source baseline
```

**Incluir:**

- aplicação copiada do diretório `web` no commit-base;
- `package.json` e `package-lock.json`;
- configuração Next, TypeScript, Tailwind e Vitest;
- `src/`, `public/` e migrations existentes;
- `.env.example` e `.gitignore`;
- nome do pacote ajustado para `finance-pessoal-pwa`.

**Não incluir:**

- manifesto PWA;
- service worker;
- alterações de UX;
- `.next`, `node_modules` ou credenciais.

**Gate:** `npm ci`, `npm test`, `npx tsc --noEmit`, `npm run lint` e build com placeholders públicos.

### C02 — Origem e documentação inicial

**Mensagem sugerida:**

```text
docs: document source baseline and development plan
```

**Incluir:**

- `SOURCE_COMMIT.md`;
- `PLANEJAMENTO_PWA.md`;
- `PLANO_DE_COMMITS.md`;
- README do PWA.

**Gate:** SHA, branch e repositório de origem conferidos; nenhum remote configurado.

### C03 — Manifesto e identidade instalável

**Mensagem sugerida:**

```text
feat(pwa): add manifest icons and install guidance
```

**Incluir:**

- `src/app/manifest.ts`;
- metadados Apple Web App;
- viewport com `viewport-fit=cover`;
- `InstallPrompt`;
- ícones 192x192, 512x512, maskable e Apple touch icon.

**Gate:** `/manifest.webmanifest` responde corretamente; ícones carregam; build e testes passam.

### C04 — Service worker seguro

**Mensagem sugerida:**

```text
feat(pwa): add static asset service worker and offline fallback
```

**Incluir:**

- `public/sw.js`;
- `public/offline.html`;
- registro do service worker;
- atualização controlada;
- remoção de caches antigos.

**Regras de revisão:**

- Supabase, Auth, Storage, callbacks, APIs, RSC e dados de usuários não podem entrar no cache.
- A tela offline não pode mostrar dados financeiros.
- O service worker não deve bloquear a inicialização da aplicação.

**Gate:** `node --check public/sw.js`, testes de manifesto/cache e validação local dos endpoints estáticos.

### C05 — Headers e segurança de entrega

**Mensagem sugerida:**

```text
chore(security): configure PWA security headers
```

**Incluir:**

- CSP;
- HSTS;
- `X-Frame-Options`;
- `X-Content-Type-Options`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- regras de cache para manifesto e service worker.

**Gate:** headers conferidos no servidor local; build aprovado; CSP não bloqueia login ou assets.

### C06 — Navegação e safe areas para iPhone

**Mensagem sugerida:**

```text
feat(mobile): adapt dashboard navigation for iPhone
```

**Incluir:**

- barra inferior com cinco áreas;
- safe area superior e inferior;
- `100dvh`;
- padding para evitar conteúdo sob a barra;
- áreas de toque mínimas;
- estado ativo e `aria-current`.

**Não incluir:**

- redesign de formulários;
- alterações de regras financeiras;
- alterações no Supabase.

**Gate:** build, testes, typecheck e inspeção visual em viewport mobile.

### C07 — Formulários e interação touch

**Mensagem sugerida:**

```text
feat(mobile): optimize forms and dialogs for touch input
```

**Incluir:**

- teclado numérico para valores;
- seletores de data;
- foco e rolagem com teclado aberto;
- modais/painéis móveis;
- confirmações acessíveis;
- remoção de dependências de hover em ações essenciais.

**Gate:** testes manuais em viewport pequena, typecheck e testes de componentes.

### C08 — Autenticação e fluxo de domínio

**Mensagem sugerida:**

```text
test(auth): cover PWA callback and session boundaries
```

**Incluir:**

- testes para callback no novo domínio;
- sessão expirada;
- logout e troca de usuário;
- confirmação de e-mail;
- nenhum teste dependente de credencial real versionada.

**Gate:** testes automatizados aprovados e checklist manual preparado.

**Intervenção externa:** adicionar Redirect URLs exatas no Supabase somente quando o novo domínio estiver definido.

### C09 — Exportações e avatar no iPhone

**Mensagem sugerida:**

```text
feat(mobile): improve exports and avatar upload fallback
```

**Incluir:**

- `Web Share API` com `navigator.canShare`;
- fallback de download;
- tratamento de fotos e orientação;
- validações de tamanho e tipo.

**Gate:** testes com arquivos pequenos e grandes; validação manual pendente registrada se não houver iPhone.

### C10 — Testes e auditoria PWA

**Mensagem sugerida:**

```text
test(pwa): add manifest cache and install coverage
```

**Incluir:**

- testes de manifesto;
- testes do registro do service worker;
- testes de atualização e cache;
- testes de isolamento de estado local;
- testes de responsividade que possam ser automatizados.

**Gate:** suíte completa, lint, typecheck, build e auditoria de dependências.

### C11 — Validação final e documentação

**Mensagem sugerida:**

```text
docs: record validation results and remaining limitations
```

**Incluir:**

- resultados finais;
- limitações de iOS;
- passos manuais do Supabase e Vercel;
- atualização dos status no planejamento;
- checklist de rollback.

**Gate:** servidor local validado e aprovação explícita do usuário.

## Como separar o estado atual

Como o primeiro commit já consolidou a preparação inicial, a sequência daqui em diante deve ser:

1. Criar C08 com a validação de autenticação e domínio.
2. Criar C09 com exportações e avatar.
3. Criar C10 com a cobertura automatizada restante do PWA.
4. Criar C11 após a validação local, Supabase e domínio.

Antes de cada commit, conferir:

```powershell
git status --short
git diff --cached --check
git diff --cached --stat
git diff --cached
```

## Checklist de revisão por commit

- [ ] O commit tem uma única intenção.
- [ ] A mensagem descreve a mudança, não o processo.
- [ ] Nenhum segredo ou artefato local foi incluído.
- [ ] O diff não altera o sistema web original.
- [ ] Testes aplicáveis foram executados.
- [ ] O planejamento foi atualizado se uma frente mudou de status.
- [ ] O rollback do commit é compreensível.
- [ ] A mudança não exige alteração de banco não documentada.

## Fluxo de integração futuro

Correções no sistema web original não serão sincronizadas automaticamente. Cada correção deverá ser avaliada e portada conscientemente para o PWA, gerando um commit próprio ou sendo incluída na próxima frente funcional.

O SHA original deve permanecer registrado para que qualquer diferença entre web e PWA possa ser rastreada.
