# Design QA — extrato mobile agrupado por dia

Data: 2026-09-22

## Evidência e estado

- Fonte visual aprovada: `C:\Users\jcjju\.codex\visualizations\2026\09\22\01a0c8e8-7eea-7940-8266-6a7fad63cd63\extrato-mobile-por-dia.html`.
- Captura da fonte: `C:\Users\jcjju\.codex\visualizations\2026\09\22\01a0c8e8-7eea-7940-8266-6a7fad63cd63\extrato-mobile-referencia.png` (1265 × 712 px; o telefone do mock tem 390 px CSS e aparece dentro da página de referência).
- Captura da implementação: `C:\Users\jcjju\.codex\visualizations\2026\09\22\01a0c8e8-7eea-7940-8266-6a7fad63cd63\extrato-mobile-implementado.png` (375 × 811 px capturados, viewport configurado para 390 × 844 CSS px; escala do painel do navegador ~0,96). Comparação da composição feita pela largura do telefone, não por pixel bruto.
- Rota e estado: `http://localhost:3000/transactions`, setembro de 2026, dados reais do usuário já autenticado, valores visíveis. Os lançamentos não são os dados fictícios do esboço, portanto texto/valores diferem intencionalmente.

## Comparação

- Hierarquia e ritmo: mês → data → um balão com várias linhas. Um único balão contém três lançamentos de 22/09. A divisão para agosto aparece depois do balão, como na referência.
- Tipografia: título, mês, data, descrição, metadados e valores mantêm a hierarquia; descrições reais longas ocupam até duas linhas, para evitar truncamento excessivo sem voltar aos cartões grandes.
- Cores: fundo escuro, superfície azul-profundo, ciano de seleção/divisória e verde de receita seguem os tokens do app e o esboço. Despesas permanecem brancas conforme a identidade existente.
- Ícones e ativos: ícones Lucide já usados pelo app; o esboço não exige imagens, logos ou ilustrações novas. O logo e a navegação globais existentes foram preservados.
- Conteúdo: não foi inventado saldo diário. O resumo do app é explicitamente “Saldo projetado”, calculado pela lógica já existente; recorrências são identificadas como previstas.
- Interações: busca filtrou a lista, seleção de agosto e retorno a setembro funcionaram, linha individual aponta para edição ou gestão de recorrência. Console do navegador sem erros observados.
- Desktop: em 1100 px a lista antiga de cartões, o resumo completo e os controles existentes continuaram visíveis. No mobile, os filtros abrem em um menu compacto.

## Resultado

Nenhum P0/P1/P2 identificado na comparação das regiões legíveis. Diferenças intencionais: cabeçalho e navegação reais do PWA, conteúdo financeiro real e ausência do saldo diário fictício. A fonte é um esboço, não uma especificação pixel a pixel; a captura de referência veio em um painel com iframe e não permite equivalência exata de densidade. O usuário aprovou a visualização local no navegador em largura mobile e autorizou commit/deploy; fica recomendada a checagem de toque/safe area em iPhone real após publicar.

final result: passed
