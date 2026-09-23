# Auditoria mobile — formulários e edição

Data: 2026-09-23
Projeto: Finance Pessoal PWA
Escopo: revisão geral das rotas e superfícies de formulário, com prioridade para edição em telefone.

## Resultado

As páginas principais já tinham adaptação mobile, mas havia diferenças nos formulários: títulos repetidos, espaçamento largo para telefone, cabeçalhos inconsistentes e foco automático capaz de abrir o teclado ao entrar na tela. Perfil e cadastro também não seguiam a mesma hierarquia compacta.

Foram padronizados os cabeçalhos de criação/edição; densidade dos formulários, dimensões e alvos de toque; comportamento dos botões; campos monetários e tipografia; e a organização do perfil. A foto do perfil fica em uma seção opcional recolhida. O modal de recorrência respeita a área segura e mantém conteúdo rolável em telas baixas. Os fluxos e dados existentes foram preservados.

## Capturas — viewport mobile

As capturas `01-cartao-editar.png`, `02-transacao-editar.png`, `03-perfil.png` e `04-cadastro.png` estão salvas nesta pasta para validação local. Não são incluídas no Git porque mostram dados de teste em telas financeiras.

## Rotas revisadas

- Transações, criação e edição.
- Cartões, listagem, criação e edição.
- Recorrências, listagem, criação, edição e modal.
- Perfil.
- Cadastro e login.
- Layout autenticado, navegação mobile e estilos globais responsivos.

As páginas de edição de recorrência e o modal foram revisados no código, mas não capturados no navegador: não havia recorrência disponível na conta de teste, e a sessão expirou durante a inspeção. Não se criaram nem alteraram dados para obter uma captura.

## Verificações

- `npx tsc --noEmit`: aprovado.
- `npm test -- --run`: 22 arquivos e 82 testes aprovados.
- `npm run lint`: 0 erros; 4 avisos preexistentes em `src/__tests__/components/Logo.test.tsx` e `src/lib/supabase/config.ts`.
- `npm run build`: aprovado (Next.js 16.3.5).
- `impeccable detect`: sem apontamentos estáticos nos arquivos de interface passados ao detector.
- `http://localhost:3000/api/health`: `200 {"status":"ok"}`.

## Validação manual restante

Recomenda-se validar no iPhone real os alvos de toque, abertura do teclado, rolagem e safe areas, especialmente no modal de recorrência. As mudanças permanecem locais; não houve commit nem deploy.
