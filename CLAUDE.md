# Plataforma LC Office — Lúcia Cílio · Office Consulting

Contexto deste projeto para quem trabalha nele (e para o Claude Code de cada pessoa). Mantido pela Scalasys; atualize quando algo aqui mudar.

Sistema interno: cliente `52b83a81-a61f-4a4c-98a5-b8b1b43c9ee5` (Lúcia Cílio). O backlog fica em Clientes Ativos → Lúcia Cílio → Backlog; no Claude Code, `/backlog`.

## O cliente e o produto

- **Cliente:** Lúcia Cílio · Office Consulting — contabilista (TOC) e consultora ESG, com clientes em Portugal e na Alemanha. A Letícia é da equipa dela (administradora desde 08/10/2026).
- **O que é:** uma plataforma só, em PT-PT/DE/EN, com duas metades: **Gestão interna** (clientes, agenda, tarefas, horas, mensagens, relatórios trimestrais, CRM/prospeção, diagnósticos, marketing, financeiro, acessos, consultorias e consultorias ESG) e **área do cliente** (Contabilidade: livro de caixa, obrigações fiscais, reservas, planeamento, preços; ou ESG: percurso, diagnóstico, materialidade, KPIs, projetos, relatórios).
- **Perfis** (`profiles.role`): `admin` (Lúcia, Letícia), `comercial` e `marketing` (equipa com áreas limitadas), `user` (cliente final). O cliente pertence a uma plataforma (`profiles.platform`: `accounting`, `accounting_lite`, `esg` ou `both`) e entra direto nela, sem seletor (`src/lib/platformHome.js`). **Lite** = só o dia a dia (Início, Painel, Caixa, Recorrentes, Catálogo, Obrigações), bloqueado por rota no `ProtectedRoute`, não só no menu.
- **Fase:** em produção, a ser validada com clientes reais. Contrato até **14/11/2026**, pausa em dezembro, retoma em fevereiro (o contrato inclui dois anos de suporte para correções pontuais). A identidade visual da LC Office (a antiga "V2") é a única desde 19/10/2026. A Lúcia quer, no futuro, vender a plataforma como SaaS para microempresas em PT e DE — por isso a exigência de RGPD desde já.

## Stack

- React 19 + Vite 8, React Router 7 (SPA com code splitting por rota), JavaScript (sem TypeScript).
- Estilos inline com tokens de tema (`src/theme.js` via `useTheme()`); Tailwind 4 está instalado mas quase não se usa.
- Supabase: Auth (só login, sem registo público), Postgres com RLS, Storage (buckets `client-docs` privado e `logos` público).
- Vercel: front estático + funções serverless em `api/`, região `fra1`.
- Chart.js (gráficos), read-excel-file (importação de extratos), `@anthropic-ai/sdk` (relatório de consultoria, só no servidor).
- PWA instalável (`public/manifest.webmanifest`, `public/sw.js`).

## Rodar localmente

```bash
npm install
npm run dev          # http://localhost:5174 (porta fixa no vite.config.js)
npm run dev -- --mode dev   # usa o .env.dev.local (Supabase DEV) por cima do .env.local
npm run build        # gera dist/
npm run preview      # serve o build (o .claude/launch.json usa a porta 4173)
npm run lint
```

- Variáveis (nomes em `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL` (domínio usado no link de convite), `VITE_TURNSTILE_SITE_KEY` (opcional) no front; `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY` (opcional) e `ANTHROPIC_API_KEY` (não está no `.env.example`) só no servidor. Valores: pedir ao Vinícius.
- Para desenvolver, aponte o `.env.local` para o projeto **DEV** (dados fictícios), nunca para a produção.
- As funções de `api/` (Acessos, formulário `/diagnostico`, relatório com IA, exportação RGPD) **não correm no `npm run dev`**: o Vite não as serve. Testá-las localmente exige o Vercel CLI (`vercel dev`) ligado ao projeto.
- Contas de teste do DEV usam o domínio `@lcoffice.test` (ver `docs/auditorias/2026-10-11-permissoes.md`); a palavra-passe não está no repositório.
- Scripts em `scripts/`: `seed_demo_esg.mjs` (cria clientes ESG de demonstração) e `scripts/migracao/` (migração para Frankfurt, já feita) usam a service role do `.env.local` — confira para que projeto ele aponta antes de correr. `gera-guia-plataforma.py` gera o PDF do guia.

## Ambientes e deploy

- **Produção:** https://lucia-cilio-platform.vercel.app — projeto Vercel `lucia-cilio-platform`. Todo push na `main` publica automaticamente. Supabase "LC Office (EU)", Frankfurt, ref `smytrevdozsiyuoaxkaa`, plano Pro (backups diários).
- **`/v2`:** endereço antigo da validação visual; desde 19/10 redireciona (no `vercel.json` e no `App.jsx`) para o mesmo ecrã sem o prefixo.
- **DEV / staging de banco:** Supabase `jlgqvetehwpmywghpabz` (Frankfurt), só dados fictícios, numa organização Supabase separada da produção (para não pagar o segundo projeto no Pro). Não há front de staging: o DEV é usado localmente. Toda migração passa aqui antes da produção.
- O projeto antigo `wefdhqurbdvsmzmtweno` (EUA) foi apagado em 11/10/2026; docs antigos ainda o citam.
- `vercel.json`: rewrite de tudo o que não é `/api/` para a SPA, `maxDuration` 300 s no relatório de consultoria, região `fra1`.

## Banco de dados

- SQL em `supabase/`: `schema.sql` (base), `migration_002.sql` … `migration_048.sql` (a próxima é a 049), `SETUP_COMPLETO.sql` (consolida até à 031, idempotente) e `DEV_SETUP_2026-10-06.sql` (base nova até à 039; depois aplicar 040+ pela ordem).
- Cabeçalho de cada migração: número e título, porquê, o que muda, se apaga dados, e "Executar no Supabase: SQL Editor → New query → colar → Run". Escrever idempotente (`if not exists`, `drop policy if exists` antes do `create policy`).
- Aplicação é manual no SQL Editor: primeiro no DEV, depois o Vinícius corre na produção. Código que depende de uma migração só vai para a `main` depois de ela estar aplicada.
- RLS em tudo. Funções `public.is_admin()` e `public.is_equipa()` (admin, comercial, marketing). O cliente só lê o que tem o seu `user_id` ou a sua ficha; anónimo não lê nada; o formulário público grava só via `api/diagnostico.js` (migração 042).
- Tabelas centrais:
  - `profiles` — papel e plataforma de cada conta.
  - `clientes` — a ficha do cliente na Gestão (com ou sem conta; `user_id` liga à conta).
  - `clients` — clientes **do próprio utilizador** na Contabilidade (não confundir com `clientes`).
  - `fiscal_obligations` — obrigações fiscais (estados, valor, comprovativo; `source` distingue as do cliente).
  - `cash_entries`, `catalog_items`, `recurring_expenses`, `monthly_plans`, `company_settings` — Contabilidade do cliente.
  - `bank_imports`, `bank_transactions` — extratos importados e conciliação.
  - `tarefas`, `documentos_cliente`, `mensagens_cliente`, `relatorios_trimestrais`, `notas_cliente`, `horas_cliente`, `client_notices` — portal da Gestão.
  - `consultorias`, `consulting_notes`, `crm_leads`, `diagnostico_submissoes`, `client_billing`, `billing_payments` — consultoria, CRM e financeiro.
  - `esg_consultorias` (casos ESG; `nivel` e `metodo` jsonb do método da Lúcia, migração 046), `esg_diagnostics`, `esg_materiality`, `esg_projects` (também o plano de ação), `esg_reports`, `esg_interno` (notas internas e opinião por reunião, só admin), `esg_comentarios` (comentário por item, lados equipa/cliente; é a única coisa que o cliente escreve na ESG, migração 047).
  - `marketing_posts`, `marketing_notas` — aba de Marketing.
  - `eventos`, `evento_participantes` (+ bucket privado `eventos`) — área de participantes dos eventos da Lúcia (migração 048). Só admin pela app; os participantes não têm conta e passam sempre por `api/evento.js`, que confere o link pessoal (token).

## Mapa do código

```
api/                    funções Vercel (service role e chave da IA só aqui)
  admin-users.js        criar/editar/apagar contas (só admin)
  consultoria-relatorio.js  relatório da consultoria com a API da Anthropic
  diagnostico.js        formulário público /diagnostico com anti-robôs
  exportar-cliente.js   exportação RGPD de um cliente (JSON)
  agenda-fiscal.js      quadros oficiais de prazos da AT (Portugal)
  evento.js             área de participantes dos eventos (link pessoal, sem conta)
public/momentos/        landing do evento de 24/10 e /participantes (HTML estático, servido antes da SPA)
src/App.jsx             rotas e guardas (ProtectedRoute, RoleRoute, PlatformRoute)
src/pages/contabilidade/  área do cliente: Contabilidade
src/pages/esg/          área do cliente: ESG (reutilizada nos casos ESG da Gestão)
src/pages/gestao/       Gestão: consultorias, ESG, CRM, diagnósticos, financeiro, marketing
src/pages/admin/        Acessos (gestão de contas)
src/portal/             portal da Gestão: ficha do cliente, agenda, tarefas, horas, mensagens
  dados.js / regras.js  armazém em memória + gravação no Supabase / regras (calendário fiscal, datas)
src/components/         peças partilhadas (Sidebar, InfoTooltip, EstimateNote, MFA, ViewAs…)
src/context/            Auth, Lang, Theme, Sidebar, ViewAs (ver como o cliente), AlvoESG (caso ESG ativo)
src/lib/                cálculos (planCalc, treatmentCalc, eurCalc, consultoriaCalc, leadScore, triagem, periodicidade), formato.js, v2.js
src/data/               conteúdo fixo: perguntas da consultoria e da ESG, categorias, países
src/i18n/translations.js  textos PT/DE/EN
supabase/               schema e migrações SQL
docs/                   planos, auditorias, guia da plataforma
```

## Regras e decisões do projeto

- **Simplicidade antes de funcionalidade nova.** Decisão de 08/10: simplificar os ecrãs antes de os clientes testarem; o que ninguém usa sai em vez de ser corrigido. A Lúcia repete o conselho "o mais simples possível". Excesso de funcionalidades foi apontado como risco (25/09 e 08/10).
- **O portal do cliente é só informativo e sem valores** (25/09 e 08/10): obrigações, datas, documentos pedidos, mensagens. Nada de financeiro interno visível ao cliente. Todos os clientes têm acesso básico, mesmo os que só compram consultoria: a plataforma é o canal de contrato, documentos e avisos (10/09).
- **Isolamento de dados:** um cliente nunca pode ver dados de outro. Qualquer tabela nova nasce com RLS e é testada no DEV com contas de clientes diferentes (modelo em `docs/auditorias/2026-10-11-permissoes.md`). Pendente com a Lúcia: hoje `comercial` e `marketing` leem todas as fichas.
- **Segredos só no servidor:** a service role e a `ANTHROPIC_API_KEY` vivem em `api/` e no Vercel; nunca com prefixo `VITE_`. As funções leem os dados pelo id em vez de confiar no browser. No Vercel, `VITE_*` e `SUPABASE_URL` são "Config" (públicas por desenho); service role e chave da IA são "Secret".
- **Dados na UE (RGPD):** produção e DEV em Frankfurt, funções em `fra1`. Clientes em dois países; o relatório de consultoria envia a ficha para a API da Anthropic (EUA) e está no pacote RGPD pendente. Dados reais de clientes não vão para PDFs de demonstração, prints nem pastas sincronizadas na nuvem.
- **Modo apresentação e "ver como o cliente":** na consultoria e na ESG há modos que escondem notas internas e a lista de outros clientes, porque a Lúcia partilha o ecrã com o cliente. Ao criar uma consultoria ou um caso ESG também não aparece a lista dos outros clientes (o caso ESG nasce sem o campo de conta; é ligado depois em "Editar"). Ao mexer nesses ecrãs, não volte a expor isso. As notas internas nunca vão para o PDF da consultoria; a IA recebe-as marcadas como contexto que nunca se cita (13/10).
- **Relatório de consultoria:** destino é o banco (plano de negócio), na ordem do documento da IHK. **Os números saem sempre do `consultoriaCalc`, nunca da IA**; a IA só escreve prosa **descritiva, não analítica** (a análise é da Lúcia). Seções sem dados não aparecem (vale também para os relatórios ESG).
- **Valores fiscais são estimativas:** páginas de cálculo mostram o `EstimateNote` (remete para a Autoridade Tributária ou o contabilista — foi o pedido da Lúcia). As regras fiscais alemãs e portuguesas não foram validadas por especialista; o calendário fiscal é gerado por regras fixas no código (`src/portal/regras.js`). Não invente regra fiscal, pergunte.
- **As regras fiscais dependem do país da empresa (PT/DE), nunca da língua da interface** — um usuário com a interface em inglês segue as regras de Portugal ("não sou certificada em Inglaterra"). Módulos alemães (Reservas & Impostos, Relatório EÜR) só aparecem com país DE.
- **Três línguas:** todo texto novo entra em `src/i18n/translations.js` em `pt`, `de` e `en`. A interface é em **português de Portugal** (ecrã, ficheiro, palavra-passe, utilizador), por ser o público da Lúcia — isto prevalece sobre a regra geral de idioma no fim deste arquivo. A nomenclatura final é revista pela Lúcia (decidido 04/08: não somos nós a revê-la).
- **Números e datas:** formatar com `src/lib/formato.js` (locale pela língua). Em pt-PT, números de 4 dígitos não levam separador de milhar (`1337,50`) — é a norma, não um bug. Datas só-data (`AAAA-MM-DD`) passam por `dataSo`/`dataCurta`; `new Date('2026-09-01')` aparece um dia atrás a oeste de Greenwich (bug já corrigido uma vez).
- **Identidade visual:** desde 19/10 só existe a da LC Office (antiga V2: verde #0E3D33, dourado #C89B3C, Archivo). `src/theme.js` exporta `THEMES_V2`, que herda da V1 os tokens que não redefine — use sempre os tokens do tema (nada de cor fixa). O dourado como texto usa o token `accentText` (o dourado puro falha contraste sobre fundo claro); números em tabelas usam `tabular-nums`.
- **Componentes:** não declare componentes dentro de outro componente — recria a cada render e os campos perdem o foco (corrigido em 28/09 em toda a plataforma).
- **Acessibilidade e telemóvel:** alvos de toque ≥ 44 px por regra global em `src/index.css` (exceção: classe `lc-compacto`); texto mínimo de 11 px; ícones SVG em vez de emojis (bandeiras incluídas: o Windows mostra emojis de bandeira como letras); zoom no celular nunca bloqueado; páginas sem largura máxima e sem rolagem horizontal; o `<h1>` das páginas é só para leitores de ecrã (`so-leitores`) — as páginas não têm título nem subtítulo visíveis (10/10). Tudo o que se faz arrastando (ex.: CRM) precisa de alternativa por toque/campo.
- **Layout preferido:** botões "+ Novo…" na mesma linha dos filtros, à direita (Clientes, Tarefas, CRM, Financeiro); listas em tabela; menu lateral compacto, sem rolagem, só com o logotipo no topo; sem quadrados de iniciais.
- **Gravação:** campos de texto gravam ao sair do campo, não a cada tecla. No portal, `src/portal/dados.js` muda o armazém em memória e grava a seguir; ids gerados no cliente com `crypto.randomUUID()`. Antes de fechar um formulário com texto por gravar, pergunte.
- **Contas:** não há convite por e-mail — a equipe cria a conta com senha temporária gerada (sem caracteres ambíguos) e o usuário é obrigado a trocá-la no primeiro acesso (requisitos: 8 caracteres, maiúscula, minúscula, número, especial). "Redefinir palavra-passe" gera outra temporária. Verificação em dois passos (TOTP) é opcional por conta.
- **CRM:** leads entram manualmente ("Juntar ao CRM"), por decisão de 18/09, para evitar registos indevidos. O formulário público `/diagnostico` substituiu o JotForm e faz triagem (`src/lib/triagem.js`): quem fica abaixo do corte não desaparece, aparece com o motivo. Contratos (CRM e Financeiro) ligam-se à ficha escolhida da lista, nunca pelo nome escrito.
- **ESG é ferramenta interna da Lúcia** (18/09): um caso ESG (`esg_consultorias`) é o dono dos dados, a Lúcia preenche e o cliente só vê (se `visivel_cliente`). O caso abre numa aba própria do navegador com o menu da ESG, para ela compartilhar a tela. Fluxo (método da Lúcia, documento e reunião de 15/10): Arranque (7 perguntas, as três primeiras reuniões com protocolo à mão, documentos) → Diagnóstico (+ fotografia por pilar e primeira devolução) → Materialidade (+ problemas sintoma → causa → impacto) → Plano de ação → KPIs → Acompanhamento (reuniões, feedback trimestral, avaliação, documentos em `client-docs/esg/<id>`) → Relatório, vendido em três níveis (Diagnóstico · Desenvolvimento · Reporting), com o financeiro (investimento, poupança, payback) em cada elo; KPIs seguem os temas materiais; nada de dados fictícios nas telas ao vivo.
- **Extratos bancários por ficheiro (CSV/Excel)**, sem integração bancária direta (13/08); o formato é detectado pelo conteúdo e reimportar é inofensivo. WhatsApp não é integrado: a plataforma só gera o texto para copiar ou abrir no WhatsApp (01/10).
- **Checklists derivadas, não manuais:** o onboarding (e indicadores parecidos) lê o estado dos dados (contrato anexado, país preenchido, primeiro acesso…), em vez de caixas marcadas à mão.
- **Eliminar um cliente** apaga também os ficheiros da pasta dele no Storage (RGPD); ao mexer em eliminação, mantenha isso. Eliminar uma conta desliga primeiro as obrigações da ficha, para não as apagar em cascata. Contratos e extratos de um cliente com conta vivem na pasta dele em `client-docs`.
- **Logotipos:** bucket `logos` público (não é informação reservada); só PNG, JPEG ou WebP até 2 MB — SVG fica de fora porque pode levar código.
- **Ficheiros fora do git:** `ref/` tem material de referência do cliente e não vai para o repositório.

## Pegadinhas técnicas que já custaram tempo

- **RLS não dá erro:** um `update`/`delete` bloqueado pela RLS retorna sucesso com 0 linhas. Confirme as linhas afetadas (foi a causa de "não consigo apagar" e de um relatório que não ficava "enviado").
- **Tela em branco com build verde:** usar `t` (tema) ou `fmt` ao nível do módulo, fora de um componente, quebra só em runtime (`t is not defined`). O `npm run lint` (`no-undef`) pega isso — rode-o nos arquivos alterados, não só nos novos. O `ErrorBoundary` mostra o erro em vez da página branca.
- **Ficha sem `id` do cliente:** gravar uma ficha sem o id gerado na tela faz a base criar outro e as obrigações ficam apontando para um id inexistente.
- **Cascata em `user_id`:** chaves antigas com `on delete cascade` apagavam dados da ficha ao eliminar a conta. Ao criar FKs para `auth.users`, pense em `set null`.
- **Vercel:** o limite de tempo de uma função vai no `vercel.json`; `export const config = { maxDuration }` dentro da função foi ignorado (504 no relatório). O relatório usa `effort` baixo para caber no tempo.
- **Supabase Auth:** links de convite expiram no máximo em 24 h (limite do Supabase, não configurável para dias) — razão da senha temporária.
- **SQL Editor:** confirme no topo se está no projeto DEV ou na produção antes de rodar (já se rodou uma consulta no projeto errado). O aviso "Run and enable RLS" ao ler `auth.users` é falso positivo: use "Run without RLS" e nunca ative RLS no schema `auth`.
- **Impressão de relatórios** (EÜR, ESG, consultoria) usa `window.open` + escrita na janela — não funciona de forma confiável numa WebView; resolver antes de embrulhar em app nativa.
- **Service worker** escrito à mão: navegação rede-primeiro, `/assets/` cache-primeiro (seguro só porque o Vite põe hash no nome). Não troque por pré-cache gerado sem pensar em versões presas.
- **Deploy:** uma página aberta antes do deploy terminar mostra a versão antiga; recarregar (Ctrl+F5) antes de concluir que "não mudou".

## Tentado e descartado

- **Projetos separados para Contabilidade e ESG** — descartado em 08/07: um repositório, um Supabase e um login; o destino vem de `profiles.platform`.
- **Convite por e-mail do Supabase** e botão "Reenviar convite" — substituídos em 06/08 pela senha temporária.
- **Entrada automática de leads** (Instagram, JotForm) — descartada em 18/09; entrada manual. Instagram e analytics da Meta ficaram para depois da entrega.
- **Consultoria gratuita como fluxo próprio e página "Consultoria" do lado do cliente** — retiradas do escopo (13/08 e 30/09); o diagnóstico inicial vive no Bloco 0 e no `/diagnostico`.
- **ESG preenchida pelo cliente** — o modelo original gravava na conta de quem tinha sessão (e o "ver como" escrevia na ESG da própria Lúcia); invertido em 18/09 para casos ESG.
- **`consulting_notes` para consultorias** — exigia conta; criou-se a tabela `consultorias` (contato embutido, `lead_id`/`user_id` opcionais).
- **Seletor Gestão/Contábil/ESG para a admin** — removido em 30/09; em 01/10 voltou só "Gestão / Demonstração" (Contabilidade com os dados da conta da própria admin, com faixa "Demonstração", para testar e mostrar).
- **Página de Marketing retirada** (proposta da revisão de 01/10) — revertido no mesmo dia: virou a aba de Marketing compartilhada pela equipe.
- **Mockups HTML escritos à mão para revisão de design** — divergiam do código real; preferir builds da app real com dados fictícios ou prints.

## Histórico de decisões

- **Mai–jun/2026** — Plataforma contábil v1 (Caixa, Preços, Clientes, Obrigações), login Supabase com dados por usuário, PWA, raiz vai direto ao login (sem landing).
- **01/07** — Plano de melhorias validado: dados da empresa como base fiscal, despesas recorrentes (previsto → confirmar), IVA por lançamento, reserva de IR (`docs/PLANO_MELHORIAS.md`).
- **07/07** — Repaginação visual com tema claro (marfim, serif, dourado) e noturno (verde).
- **08/07** — Módulo alemão "Rücklagen & Steuern" separado do português (reserva de Einkommensteuer 25 % editável; USt só em Regelbesteuerung; seguros manuais). Campo de quantidade no Livro de Caixa. ESG entra no mesmo produto com login unificado; diagnóstico ESG = questionário Creditreform Advanced 2023 (28 perguntas).
- **09/07** — A pedido de uma cliente alemã da Lúcia: movimentos privados (Privatentnahme/Privateinlage — contam para o saldo, nunca para lucro, IVA ou reservas), calculadora de Tratamento, Planeamento Mensal e alerta do limite da Familienversicherung.
- **15/07** — Inglês com bandeira do Reino Unido; calendário fiscal automático por país e regime; notificações de obrigações.
- **16–17/07** — Gestão como terceira área, só admin; "ver como" só leitura; alertas de limite de lucro (80 % / 100 %) para a Lúcia e para a cliente; repositório de documentos (bucket privado, URLs assinadas); CRM kanban de 8 etapas; Financeiro (contratos e recebimentos).
- **20–21/07** — Dupla materialidade no modelo VSME (micro e pequenas empresas: o tema pode "não se aplicar"), 16 temas ESRS em linguagem de PME. Acesso `both` (Contabilidade + ESG).
- **23/07** — Modelo ESG da Lúcia (`docs/PLANO_ESG.md`): diagnóstico multi-ano, KPIs 100 % ao vivo, materialidade financeira com payback, projetos e relatório. Code splitting por rota (carregamento inicial −43 %).
- **30/07** — Foco declarado: "CRM e consultoria"; a contabilidade "está excelente, é só corrigir o português". Aviso de valores estimados.
- **04/08** — CRM com origem, temperatura, follow-up aos 7 dias, pontuação de cliente ideal e lead fechado → contrato. Papéis `comercial` e `marketing`, restritos também na RLS, não só no menu.
- **06–07/08** — Senha temporária com troca obrigatória; `BACKLOG.md` passa a documento único de acompanhamento; Contabilidade Lite.
- **13–14/08** — QA de interface (zoom, contraste WCAG AA nos tokens). Módulo de consultoria (IHK, 4 blocos + Bloco 0, SWOT/TOWS, gravação automática, relatório com IA em PDF no modelo de design aprovado). Conciliação caixa/banco por extrato.
- **20/08** — Performance não é preocupação por agora; construir para o caso de uma cliente real, mas replicável. Relatório EÜR alemão (regime normal → valores líquidos; Kleinunternehmer → brutos).
- **21–25/08** — Pedido da Lúcia de arquitetura RGPD ao nível de Lexware/DATEV → auditoria; a base estava nos EUA (us-west-2) e migrou para Frankfurt; funções em `fra1`; plano Pro com backups; DEV separado da produção.
- **27/08** — Formulário de qualificação dentro da plataforma (sai o JotForm), a servir de filtro antes do CRM. Números formatados pela língua da interface.
- **09–10/09** — `/diagnostico` público + "Juntar ao CRM"; eliminar cliente apaga os ficheiros. Plataforma organizada em gestão interna × serviços; nasce a consultoria de organização administrativa (liderada pela Letícia, ainda por desenhar).
- **14–16/09** — Cliente cai no Início (avisos, próximo prazo, documentos); bandas de faturação baixas no CRM (os clientes reais são pequenos); contrato em PDF visível ao cliente; checklist de onboarding derivada; app nativa decidida com Capacitor (não React Native), fase 1 = PWA com ícones e service worker.
- **18/09** — ESG passa a uso interno da Lúcia, com casos ESG (migração 036); entrada de leads manual.
- **22–29/09** — Documento "Portal de gestão de clientes" da Lúcia e da Letícia vira uma v2 de demonstração; em 25/09 fica decidido que é a definitiva e em 29/09 passa a oficial com dados reais (037). Modo apresentação ESG.
- **30/09–01/10** — Administradoras vivem na Gestão (com a Demonstração da Contabilidade); páginas usam a largura toda; fase de validação; contabilidade e gestão ficam no mesmo produto por agora; simplificação fase 1 (038: cliente não edita obrigações da equipe, ESG não aceita gravação do cliente).
- **05–07/10** — Teste da jornada do cliente, etapa 1 (`docs/auditorias/2026-10-05-jornada-etapa1.md`): 8 erros corrigidos, botão "Eliminar ficha" (escrever o nome para confirmar). Checklist de fecho até 14/11; DEV novo.
- **08/10** — Simplificar antes dos testes; Letícia passa a administradora; Início da equipe; "ver como o cliente" na ficha; modo apresentação na consultoria; identidade visual da LC Office (paleta e fontes enviadas pela Letícia).
- **09–11/10** — Início do cliente enxuto (040); Horas por cliente ou atividade, só a quantidade (041, pedido da Letícia); menu Início › Clientes › Gestão › Serviços; páginas sem título; anti-robôs no `/diagnostico` (042); aba de Marketing (043); exportação RGPD e 2FA opcional; teste de permissões no DEV e correção das obrigações criadas pelo cliente (044).
- **12/10** — Projeto fora do OneDrive (`C:\Dev`); logotipo novo e menu só com o logotipo; V2 com a identidade visual em `/v2` sobre os dados reais; ficha do cliente simplificada (`docs/auditorias/2026-10-12-simplificacao-ficha-cliente.md`); logotipo do cliente (045).
- **13/10** — Simplificação da Gestão, fases A e B: 12 erros corrigidos, menu reagrupado (Comercial, Serviços, Escritório), botões "+ Novo" nas linhas dos filtros. A fase C são 13 perguntas para a Lúcia.

## Estado e pendências combinadas

- A lista viva é o grupo **Checklist de fecho** do backlog no sistema interno (`/backlog`). Em aberto em 13/10: reunião de decisões com a Lúcia (pontos 6–10: calendário de cliente novo, Lite ou completa, língua do cliente, relatórios trimestrais, acessos de comercial/marketing, reserva de imposto com ou sem IVA, regras da Calculadora de Preços, que páginas do cliente se usam) junto com a validação visual da V2 (16-B, semana de 13 a 17/10).
- Depois da reunião: **uma ficha por cliente** (12 — hoje o cliente existe em vários lugares sem chave comum, incluindo a lista `clients` que a Lúcia usava como lista do escritório), ligar o portal do cliente (13), resto da simplificação (13-D, prazo 3/11).
- Validação com usuários reais (uma pessoa da equipe e uma cliente externa), CSVs bancários reais, pacote RGPD com a advogada (inclui DPA da Anthropic), domínio próprio e e-mail (dependem do fornecedor do site), guia da plataforma e sessão de entrega.
- Depois da entrega: app nativa (Android primeiro), integração WhatsApp/Instagram, audit log, aceite dos termos (quando for SaaS), limite de faturação português.

## Documentos do repositório

- `BACKLOG.md` antigo (se existir na sua pasta): arquivo morto, importado para o sistema interno em 14/10/2026. A fonte é o backlog do painel, pela skill `/backlog`.
- [docs/PLANO_CONSULTORIA.md](docs/PLANO_CONSULTORIA.md) — desenho do módulo de consultoria (base IHK).
- [docs/PLANO_ESG.md](docs/PLANO_ESG.md) — modelo da plataforma ESG (diagnóstico → materialidade → projetos → KPIs → relatório).
- [docs/PLANO_MELHORIAS.md](docs/PLANO_MELHORIAS.md) — fases da Contabilidade (empresa, recorrentes, planeamento).
- [docs/MIGRACAO_FRANKFURT.md](docs/MIGRACAO_FRANKFURT.md) — runbook da migração do Supabase para a UE (concluída).
- [docs/Guia-da-Plataforma-Origem-dos-Dados.pdf](docs/Guia-da-Plataforma-Origem-dos-Dados.pdf) — guia ecrã a ecrã: quem vê e de onde vem cada número.
- [docs/auditorias/2026-08-21-seguranca-gdpr.md](docs/auditorias/2026-08-21-seguranca-gdpr.md) — auditoria de segurança e RGPD (itens R1–R6).
- [docs/auditorias/2026-10-11-permissoes.md](docs/auditorias/2026-10-11-permissoes.md) — teste de RLS por papel, no DEV.
- [docs/auditorias/2026-10-12-simplificacao-gestao.md](docs/auditorias/2026-10-12-simplificacao-gestao.md) — revisão da Gestão ecrã a ecrã e perguntas para a Lúcia.
- [docs/auditorias/2026-10-05-jornada-etapa1.md](docs/auditorias/2026-10-05-jornada-etapa1.md) — teste da jornada do cliente, etapa 1.
- [docs/auditorias/2026-08-13-interface.md](docs/auditorias/2026-08-13-interface.md) — QA de interface.

## Como trabalhamos neste repositório

- **Tarefas:** o backlog do projeto vive no sistema interno (Clientes Ativos → cliente → Backlog), compartilhado entre o Vinícius e a Raquel. No Claude Code, use `/backlog` para ver o próximo item, marcar o que terminou (com o que foi entregue) e anotar o que surgir; é preciso o token pessoal (painel → Backlog → Conectar o Claude Code). A sprint da semana (meta + 3 entregas) fica no painel.
- **Mudanças passam por revisão:** quem não é o Vinícius trabalha numa branch própria (`nome/assunto`) e abre um Pull Request para a `main`. Nada de push direto na `main`: ela é o que está no ar para o cliente. O Vinícius revisa a prévia e aprova.
- **Banco de dados:** mudança de estrutura vira um arquivo `.sql` versionado no repositório (`supabase/migration_NNN.sql`, testado antes no projeto DEV). Quem roda SQL em produção é o Vinícius; desenvolvimento usa o ambiente de testes.
- **Segredos e dados:** nunca commitar `.env*` (exceto `.env.example`), chaves, tokens, nem planilhas/CSVs/PDFs com dados do cliente. Valores das variáveis de ambiente: pedir ao Vinícius.
- **Antes de abrir o PR:** `npm run build` passando, a tela testada no navegador e a descrição do PR dizendo o que mudou e como conferir.
- **Idioma:** a interface é em PT-PT, alemão e inglês (todo texto novo em `translations.js`); commits e documentação em português do Brasil.
