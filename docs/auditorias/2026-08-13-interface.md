# QA de interface — Lúcia Cílio · Office Consulting

Testado em 13/08/2026 · ambiente: **produção** (`lucia-cilio-platform.vercel.app`)
Papel testado: cliente final — conta de demonstração `demo.gruenbau@lc-demo.com` (plataforma
Contabilidade + ESG, empresa alemã)
Viewports: celular 390×844 · tablet 820×1180 · desktop 1440×900
Telas cobertas: **16 de 21** · não cobertas: as 5 da área de **Gestão** (Clientes Ativos, CRM,
Marketing, Financeiro, Gestão de Acessos), porque exigem papel de administrador
Capturas: `docs/auditorias/qa-2026-08-13/demo/` (48 imagens)

> ⚠️ **Restrição desta auditoria:** o projeto **não tem ambiente de staging** — o `.env.local`
> aponta para o mesmo Supabase da produção. Por decisão do Vinícius, a auditoria foi feita
> **só em leitura**: nada foi criado, editado ou apagado. Fica por testar o **estresse de
> formulários** (duplo clique em guardar, campo vazio, texto gigante, valor negativo), que é
> onde costumam aparecer os bugs de robustez.

## Veredito

**Pronto para o piloto, depois dos itens 🟠.**

A plataforma está **estruturalmente sólida**: nenhuma das 48 combinações de tela e tamanho
falhou ao carregar, não houve um único erro de consola nem uma requisição com erro, e nenhuma
página estoura para o lado — as tabelas largas têm rolagem própria, que é o comportamento
certo. Isso não é pouco e não deve ser mexido.

O que atrapalha é **legibilidade e acessibilidade**, e é sistémico e não pontual: a
plataforma inteira impede ampliar no telemóvel, usa texto abaixo do mínimo legível e tem
contraste abaixo do padrão WCAG AA em praticamente todos os ecrãs. Para o público da Lúcia —
empresários a consultar números fiscais no telemóvel — isto pesa mais do que qualquer
funcionalidade em falta. A boa notícia é que quase tudo se resolve em dois ou três sítios,
porque vem dos tokens de tema e não de cada página.

| | Itens |
|---|---|
| 🔴 Bloqueia | 0 |
| 🟠 Atrapalha | 6 |
| 🟡 Incomoda | 5 |
| 🔵 Oportunidade | 3 |

---

## 🟠 Atrapalha

- [ ] **#1 · Não é possível ampliar a página no telemóvel**
  **Onde:** todos os 16 ecrãs · celular · qualquer papel
  **Reproduzir:**
  1. Abrir qualquer página no telemóvel
  2. Tentar ampliar com dois dedos (*pinch to zoom*)
  **Esperado:** a página amplia
  **Aconteceu:** o gesto não faz nada. O `index.html` tem
  `maximum-scale=1.0` no `meta[name=viewport]`
  **Porque importa:** é o item de acessibilidade mais grave do lote. O público são
  empresários a ler valores fiscais pequenos no telemóvel; tirar-lhes o zoom é tirar-lhes a
  única forma de compensar.
  **Correção:** remover `maximum-scale=1.0` (e `user-scalable=no`, se existir) de `index.html`.
  **Evidência:** reportado nas 48 combinações da varredura

- [ ] **#2 · Contraste abaixo do mínimo WCAG AA em todos os ecrãs**
  **Onde:** todos os 16 ecrãs · os três tamanhos
  **Reproduzir:**
  1. Abrir o Painel
  2. Reparar no "2026" ao lado do seletor de período, nos nomes dos meses do gráfico e nos
     textos de apoio em cinzento
  **Aconteceu:** 35 elementos só no Painel abaixo de 4.5:1 — `2026` a **2.03:1**,
  `79%` a **2.29:1**, `Jan/Fev/…` e as notas de apoio a **2.37:1**
  **Causa:** vem dos tokens `subtle` (`#a2ab9f`) e `textMuted` (`#8a9990`) sobre o fundo creme
  `#f5f1e8` — não é problema de página, é do tema
  **Correção:** escurecer os dois tokens em `src/theme.js`. Um ajuste corrige a plataforma toda.

- [ ] **#3 · Texto abaixo de 12px espalhado pela interface**
  **Onde:** todos os ecrãs · 36 elementos só no Painel
  **Exemplos:** `OFFICE CONSULTING` (9px), rótulos de secção `CONTABILIDADE`/`GESTÃO` (10px),
  iniciais do avatar (11px), botões do seletor de plataforma (11px)
  **Porque importa:** 9px é ilegível para grande parte do público adulto, e combina-se com o
  item #1 (sem zoom) e #2 (pouco contraste) para tornar alguns textos praticamente invisíveis.

- [ ] **#4 · Os cartões "Em Caixa" e "No Banco" partem-se no telemóvel**
  **Onde:** `/contabilidade/caixa` · celular
  **Reproduzir:**
  1. Abrir o Livro de Caixa no telemóvel (390×844)
  2. Olhar para a segunda linha de indicadores, abaixo de "Total Saídas"
  **Esperado:** `💵 EM CAIXA` à esquerda e `€ -4436,50` à direita
  **Aconteceu:** o rótulo e o valor quebram os dois e as linhas entrelaçam-se — lê-se
  **"EM €"** numa linha e **"CAIXA -4436,50"** na seguinte. O mesmo em "No Banco".
  **Causa:** `src/pages/contabilidade/LivroCaixa.jsx:286` — um `flex` com
  `justifyContent: 'space-between'` dentro de um cartão de ~180px; ambos os textos quebram.
  **Nota:** os quatro cartões da linha de cima usam layout empilhado (valor sobre o rótulo) e
  ficam impecáveis — esta linha é a exceção, o que também a torna inconsistente.
  **Correção:** empilhar em coluna no telemóvel, como os cartões de cima.
  **Evidência:** `qa-2026-08-13/demo/mobile/contabilidade-caixa.png`

- [ ] **#5 · 36 campos de formulário sem rótulo associado**
  **Onde:** vários ecrãs, incluindo o de entrada (`/login`)
  **Aconteceu:** os campos têm texto visível ao lado, mas sem `label for` ou `aria-label`.
  Um leitor de ecrã não liga o rótulo ao campo, e tocar no texto não foca o campo — no
  telemóvel isso é uma frustração concreta, porque o alvo fica só o campo.
  **Correção:** associar `htmlFor`/`id` ou pôr `aria-label` nos campos.

- [ ] **#6 · O Painel demora a mostrar dados**
  **Onde:** `/contabilidade/dashboard` · celular
  **Reproduzir:**
  1. Abrir o Painel no telemóvel
  2. Observar o primeiro segundo
  **Aconteceu:** na primeira varredura (espera de 1,2 s) a página ainda mostrava
  **"A carregar…"** com o ecrã vazio — só com 4 s é que apareceu conteúdo. Enquanto carrega,
  o botão flutuante **"+ Nova Entrada"** já está visível sobre o vazio, convidando a agir numa
  página que ainda não existe.
  **Correção sugerida:** esqueleto de carregamento em vez de "A carregar…", e esconder o botão
  flutuante enquanto não há dados.
  **Nota:** a causa (várias consultas em série ao carregar) é diagnóstico da `/revisao-codigo` —
  aqui fica só o sintoma.
  **Evidência:** `qa-2026-08-12/demo/mobile/contabilidade-dashboard.png` (captura da 1.ª passagem)

---

## 🟡 Incomoda

- [ ] **#7 · No telemóvel, a matriz de materialidade fica no fim de uma página de 9.000 px**
  **Onde:** `/esg/materialidade` · celular
  **Reproduzir:** abrir a Materialidade no telemóvel e procurar a matriz
  **Aconteceu:** é preciso passar pelos 16 temas antes de a ver. No computador ela está fixa
  na coluna da direita, sempre visível; no telemóvel vai para o fim.
  **Porque importa:** a matriz é o resultado da página — no telemóvel, o utilizador pontua às
  cegas e só vê o efeito no fim.
  **Sugestão:** no telemóvel, colocar a matriz no topo (ou fixá-la em rodapé recolhível).

- [ ] **#8 · Alvos de toque abaixo de 44×44 px**
  **Onde:** 32 ocorrências · celular
  **Exemplos:** itens do menu com 42px de altura (perto do limite), botão "Mostrar" da
  palavra-passe com **42×17**, botão de tema com 32×32
  **Correção:** subir para 44px de altura mínima nos alvos tocáveis.

- [ ] **#9 · Campos com fonte abaixo de 16px fazem o iPhone ampliar sozinho**
  **Onde:** 12 ocorrências, incluindo os campos do login (14px)
  **Aconteceu:** ao tocar num campo, o iOS amplia e a página sai do sítio.
  **Correção:** 16px nos `input`/`select`/`textarea` (só no telemóvel, se preferires manter a
  densidade no computador).

- [ ] **#10 · Oito ecrãs não têm `<h1>`**
  **Onde:** Painel, Livro de Caixa, Obrigações, Precificação, Catálogo, Clientes, Empresa e
  o próprio login
  **Aconteceu:** estas páginas começam direto nos controlos, sem título. Além da
  acessibilidade, o utilizador não tem confirmação visual de onde está — e no telemóvel, onde
  o menu está fechado, isso conta.
  **Nota:** as páginas de ESG e as mais recentes têm cabeçalho; a inconsistência é entre as
  antigas e as novas.

- [ ] **#11 · A tabela do Planeamento Mensal exige rolagem lateral no telemóvel**
  **Onde:** `/contabilidade/planeamento` · celular
  **Aconteceu:** a tabela tem largura mínima de 1120px e rola dentro do próprio cartão (não
  estoura a página, o que está certo). Ainda assim, no telemóvel só se veem 3 das 12 colunas,
  e os cabeçalhos aparecem truncados (`DURAÇÃO…`, `PREÇO LÍQUI…`).
  **Sugestão:** no telemóvel, apresentar cada linha como cartão em vez de tabela.
  **Evidência:** `qa-2026-08-13/demo/mobile/contabilidade-planeamento.png`

---

## 🔵 Oportunidades

- [ ] **#12 · O Painel não respeita o tema noturno**
  Encontrado na revisão de design (12/08), fora da varredura: `Dashboard.jsx` mistura tokens
  de tema com **7 cores fixas** — `#f0fdf4`, `#eff6ff`, `#fff7ed`, `#fffbeb`, `#fdeaea`,
  `#e2e8f0`, `#f2f6f3`. No modo noturno, os cartões pastel claros ficam a flutuar sobre o
  fundo escuro. Reproduzível em `REVISAO_PAINEL_ADMIN.html` → botão "Noturno".

- [ ] **#13 · Dois formatadores de número no mesmo ecrã**
  No Painel, `€ 7200,00` (sem separador de milhares) aparece a poucos centímetros de
  `€ 11 400,00` (com separador). São o `fmt` e o `fmt2` de `Dashboard.jsx:23-24`.

- [ ] **#14 · O Livro de Caixa não tem paginação**
  Com os 30 lançamentos da conta demo, a página no telemóvel tem ~8.000 px. Com um ano real
  de lançamentos, será várias vezes isso. Vale um limite por página ou rolagem infinita antes
  de a Lúcia trazer clientes com volume.

---

## Não reproduzível / a confirmar

- Na captura de página inteira do Livro de Caixa, o botão **"+ Nova Entrada"** aparece sobre
  uma linha da tabela. Muito provavelmente é **artefacto da captura** (elementos `position:
  fixed` são desenhados na posição do primeiro ecrã), e não um defeito real. Fica registado
  para confirmação num telemóvel a sério — não deve virar tarefa sem isso.

## O que ficou por testar

- **Área de Gestão** (5 ecrãs) — exige papel de administrador
- **Estresse de formulários** — proibido nesta auditoria por não haver staging
- **Fluxos que gravam** — criar lançamento, guardar diagnóstico, arrastar cartão no CRM
- **Tema noturno na varredura** — a varredura correu em tema claro; o item #12 vem da revisão
  de design, não de medição automática

## Limpeza

Nada foi criado nem alterado na base de dados — auditoria só de leitura.
O ficheiro de sessão `.qa/sessao-demo.json` (contém token válido) foi apagado ao terminar, e
`.qa/` foi acrescentado ao `.gitignore`.

## Nota para a próxima auditoria

A aplicação usa uma chave de armazenamento personalizada para a sessão —
`storageKey: 'lc-office-auth'` em `src/lib/supabase.js`, em vez do `sb-<ref>-auth-token`
predefinido. O `sessao-api.mjs` grava com a chave predefinida, por isso é **preciso remapear
a chave** no ficheiro de sessão, senão a varredura corre inteira deslogada e audita 16 vezes
o ecrã de login sem se queixar.
