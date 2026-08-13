# Varredura de interface — https://lucia-cilio-platform.vercel.app
16 rota(s) × 3 viewport(s) · capturas em C:\Users\vinic\OneDrive\Área de Trabalho\Lucia Cilio\docs\auditorias\qa-2026-08-13\demo
Sessão carregada de .qa/sessao-demo.json · 1 cookie(s) · 1 item(ns) de localStorage.

## Resumo por tipo
- `zoom-bloqueado` — 48
- `fonte-pequena` — 48
- `contraste-baixo` — 48
- `campo-sem-rotulo` — 36
- `alvo-pequeno` — 32
- `sem-h1` — 24
- `input-zoom-ios` — 12

## Por tela

### mobile

- **/contabilidade/dashboard**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 36 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 35 elemento(s) abaixo do mínimo WCAG AA
    span "2026" — 2.03:1 (mín. 4.5) · span "79%" — 2.29:1 (mín. 4.5) · span "30% sobre o resultado do perío" — 2.37:1 (mín. 4.5) · div "Sem resultado positivo — nada " — 2.37:1 (mín. 4.5) · div "Jan" — 2.37:1 (mín. 4.5) · div "Fev" — 2.37:1 (mín. 4.5)
  - 🟡 `alvo-pequeno` — 20 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a.active "Painel" (240×42) · a "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-dashboard.png

- **/contabilidade/caixa**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 134 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 53 elemento(s) abaixo do mínimo WCAG AA
    div "(recorrentes a confirmar)" — 2.29:1 (mín. 4.5) · div "RE-2026" — 2.37:1 (mín. 4.5) · div "RE-2027" — 2.37:1 (mín. 4.5) · div "RE-2028" — 2.37:1 (mín. 4.5) · div "RE-2026" — 2.37:1 (mín. 4.5) · div "RE-2027" — 2.37:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Todos os meses
Jan 2026
Fev 20"
  - 🟡 `alvo-pequeno` — 48 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a.active "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-caixa.png

- **/contabilidade/recorrentes**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 32 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 10 elemento(s) abaixo do mínimo WCAG AA
    strong "€ 3790,00" — 2.29:1 (mín. 4.5) · p "Defina os custos fixos e confi" — 2.65:1 (mín. 4.5) · div "DESCRIÇÃO" — 2.79:1 (mín. 4.5) · div "CATEGORIA" — 2.79:1 (mín. 4.5) · div "VALOR (€)" — 2.79:1 (mín. 4.5) · div "PERIODICIDADE" — 2.79:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 6 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Jan 2026
Fev 2026
Mar 2026
Abr" · input (só placeholder: "2200,00") · input (só placeholder: "380,00") · input (só placeholder: "120,00") · input (só placeholder: "640,00")
  - 🟡 `alvo-pequeno` — 33 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-recorrentes.png

- **/contabilidade/catalogo**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 13 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 7 elemento(s) abaixo do mínimo WCAG AA
    button "Todos" — 2.29:1 (mín. 4.5) · p "Produtos e serviços que pode v" — 2.65:1 (mín. 4.5) · div "DESIGNAÇÃO" — 2.79:1 (mín. 4.5) · div "TIPO" — 2.79:1 (mín. 4.5) · div "PREÇO (€)" — 2.79:1 (mín. 4.5) · div "CONTABILIDADE" — 3.93:1 (mín. 4.5)
  - 🟡 `alvo-pequeno` — 24 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a "Livro de Caixa" (240×42) · a.active "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-catalogo.png

- **/contabilidade/precificacao**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 21 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 17 elemento(s) abaixo do mínimo WCAG AA
    span "🍽️" — 2.29:1 (mín. 4.5) · span "Evento / Catering" — 2.29:1 (mín. 4.5) · span "(50 × €25,00 + 7 × €12,50)" — 2.37:1 (mín. 4.5) · div "sugestão: 30%" — 2.37:1 (mín. 4.5) · span "Valores estimados a partir dos" — 2.79:1 (mín. 4.5) · div "Adultos" — 2.98:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 13 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "50" · input "7" · input "25" · input "Chefe de Cozinha" (só placeholder: "Nome") · input "18"
  - 🟡 `alvo-pequeno` — 24 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a.active "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-precificacao.png

- **/contabilidade/planeamento**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 27 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 39 elemento(s) abaixo do mínimo WCAG AA
    div "PLANEAMENTO" — 2.03:1 (mín. 4.5) · div "BASE DO PLANEAMENTO" — 2.29:1 (mín. 4.5) · div "ⓘ O custo indireto de cada lin" — 2.37:1 (mín. 4.5) · p "Planeie tratamentos/serviços p" — 2.65:1 (mín. 4.5) · div "TRATAMENTO/SERVIÇO" — 2.65:1 (mín. 4.5) · div "DURAÇÃO (MIN)" — 2.65:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 23 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "3790" (só placeholder: "550") · input "640" (só placeholder: "100") · select "Lucro
Faturação" · input "Neubau – Rohbau" (só placeholder: "Tratamento/Serviço") · input "4800" (só placeholder: "60")
  - 🟡 `alvo-pequeno` — 27 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a.active "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-planeamento.png

- **/contabilidade/clientes**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 19 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 9 elemento(s) abaixo do mínimo WCAG AA
    div "NOME" — 2.79:1 (mín. 4.5) · div "PAÍS" — 2.79:1 (mín. 4.5) · div "SETOR" — 2.79:1 (mín. 4.5) · div "SERVIÇO" — 2.79:1 (mín. 4.5) · div "ESTADO" — 2.79:1 (mín. 4.5) · span "Total" — 2.98:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Todos os países
Alemanha"
  - 🟡 `alvo-pequeno` — 21 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-clientes.png

- **/contabilidade/obrigacoes**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 17 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 12 elemento(s) abaixo do mínimo WCAG AA
    button "Todas" — 2.29:1 (mín. 4.5) · span "Valores estimados a partir dos" — 2.79:1 (mín. 4.5) · div "OBRIGAÇÃO" — 2.79:1 (mín. 4.5) · div "CLIENTE" — 2.79:1 (mín. 4.5) · div "PAÍS" — 2.79:1 (mín. 4.5) · div "PRAZO" — 2.79:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Todos os países
Alemanha"
  - 🟡 `alvo-pequeno` — 27 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a.active "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-obrigacoes.png

- **/contabilidade/empresa**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 9 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 6 elemento(s) abaixo do mínimo WCAG AA
    div "GERAL" — 2.29:1 (mín. 4.5) · div "FISCALIDADE" — 2.29:1 (mín. 4.5) · div "Sugestão: 20–30%" — 2.37:1 (mín. 4.5) · p "Base para IVA, calendário fisc" — 2.65:1 (mín. 4.5) · div "CONTABILIDADE" — 3.93:1 (mín. 4.5) · div "GESTÃO" — 3.93:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 8 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "GrünBau GmbH (Demo)" (só placeholder: "ex: Lúcia Cílio, Unip. Lda") · select "🇵🇹 Portugal
🇩🇪 Deutschland" · input "EUR" · select "Normal
Isento" · select "19%
7%"
  - 🟡 `alvo-pequeno` — 16 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-empresa.png

- **/contabilidade/rucklagen**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 32 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 34 elemento(s) abaixo do mínimo WCAG AA
    div "Distância ao limite" — 2.05:1 (mín. 4.5) · div "Para seguros e reservas" — 2.06:1 (mín. 4.5) · div "(30% de 20.272,50 €)" — 2.12:1 (mín. 4.5) · div "(30% do lucro)" — 2.12:1 (mín. 4.5) · div "(22.258,59 € − 7.446,16 €)" — 2.14:1 (mín. 4.5) · div "Ao Finanzamt" — 2.14:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 4 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input (só placeholder: "0,00") · input (só placeholder: "0,00") · input (só placeholder: "0,00") · input "565"
  - 🟡 `alvo-pequeno` — 18 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/contabilidade-rucklagen.png

- **/esg/materialidade**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 141 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 70 elemento(s) abaixo do mínimo WCAG AA
    div "MATERIALIDADE" — 2.03:1 (mín. 4.5) · span "Pontuados: 16/16" — 2.1:1 (mín. 4.5) · span "Consumo de energia, emissões d" — 2.37:1 (mín. 4.5) · span "Emissões para o ar, água e sol" — 2.37:1 (mín. 4.5) · span "Consumo e gestão de água." — 2.37:1 (mín. 4.5) · span "Geração de resíduos, reciclage" — 2.37:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 16 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "Clientes públicos exigem pegad" (só placeholder: "Nota (porquê?)") · input "Pó e ruído nas obras urbanas." (só placeholder: "Nota (porquê?)") · input (só placeholder: "Nota (porquê?)") · input "Resíduos de obra são o maior f" (só placeholder: "Nota (porquê?)") · input (só placeholder: "Nota (porquê?)")
  - 🟡 `alvo-pequeno` — 202 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a.active "Materialidade" (240×42) · a "Diagnóstico ESG" (240×42) · a "KPIs & Monitorização" (240×42) · a "Projetos ESG" (240×42) · a "Relatórios ESG" (240×42) · a "Consultoria" (240×42)
  - 📷 mobile/esg-materialidade.png

- **/esg/diagnostico**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 53 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 65 elemento(s) abaixo do mínimo WCAG AA
    div "DIAGNÓSTICO ESG" — 2.03:1 (mín. 4.5) · span "Valores pré-preenchidos podem " — 2.1:1 (mín. 4.5) · span "10/10" — 2.12:1 (mín. 4.5) · span "28 / 28" — 2.29:1 (mín. 4.5) · span "11/11" — 2.37:1 (mín. 4.5) · div "Erwarten Sie für Ihr Unternehm" — 2.37:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 46 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "2025
2024" · input "12000" (só placeholder: "0") · select "m³
kWh
Joule" · input (só placeholder: "0") · select "t
m³
kWh
Joule"
  - 🟡 `alvo-pequeno` — 59 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Materialidade" (240×42) · a.active "Diagnóstico ESG" (240×42) · a "KPIs & Monitorização" (240×42) · a "Projetos ESG" (240×42) · a "Relatórios ESG" (240×42) · a "Consultoria" (240×42)
  - 📷 mobile/esg-diagnostico.png

- **/esg/kpis**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 68 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 63 elemento(s) abaixo do mínimo WCAG AA
    div "MONITORIZAÇÃO ESG" — 2.03:1 (mín. 4.5) · span "Não" — 2.16:1 (mín. 4.5) · span "Não" — 2.16:1 (mín. 4.5) · div "kWh" — 2.22:1 (mín. 4.5) · div "Autogeração 20%" — 2.22:1 (mín. 4.5) · div "m³" — 2.22:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "2025
2024"
  - 🟡 `alvo-pequeno` — 13 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Materialidade" (240×42) · a "Diagnóstico ESG" (240×42) · a.active "KPIs & Monitorização" (240×42) · a "Projetos ESG" (240×42) · a "Relatórios ESG" (240×42) · a "Consultoria" (240×42)
  - 📷 mobile/esg-kpis.png

- **/esg/projetos**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 27 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 26 elemento(s) abaixo do mínimo WCAG AA
    div "PROJETOS ESG" — 2.03:1 (mín. 4.5) · span "Início: 2026-03" — 2.37:1 (mín. 4.5) · span "Início: 2026-09" — 2.37:1 (mín. 4.5) · span "Início: 2026-01" — 2.37:1 (mín. 4.5) · p "Os projetos nascem da material" — 2.65:1 (mín. 4.5) · div "INVESTIMENTO TOTAL" — 2.98:1 (mín. 4.5)
  - 🟡 `alvo-pequeno` — 19 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Materialidade" (240×42) · a "Diagnóstico ESG" (240×42) · a "KPIs & Monitorização" (240×42) · a.active "Projetos ESG" (240×42) · a "Relatórios ESG" (240×42) · a "Consultoria" (240×42)
  - 📷 mobile/esg-projetos.png

- **/esg/relatorios**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 18 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 24 elemento(s) abaixo do mínimo WCAG AA
    div "RELATÓRIO ESG" — 2.03:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · p "Estrutura pré-preenchida com o" — 2.65:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 5 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "2025
2024" · textarea (só placeholder: "O teu texto para esta secção…") · textarea (só placeholder: "O teu texto para esta secção…") · textarea (só placeholder: "O teu texto para esta secção…") · textarea (só placeholder: "O teu texto para esta secção…")
  - 🟡 `alvo-pequeno` — 15 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Materialidade" (240×42) · a "Diagnóstico ESG" (240×42) · a "KPIs & Monitorização" (240×42) · a "Projetos ESG" (240×42) · a.active "Relatórios ESG" (240×42) · a "Consultoria" (240×42)
  - 📷 mobile/esg-relatorios.png

- **/consultoria**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 8 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 7 elemento(s) abaixo do mínimo WCAG AA
    div "CONSULTORIA" — 2.03:1 (mín. 4.5) · div "Ainda não há registos partilha" — 2.1:1 (mín. 4.5) · div "DOCUMENTOS" — 2.29:1 (mín. 4.5) · div "Esta pasta está vazia." — 2.37:1 (mín. 4.5) · p "Notas, recomendações e relatór" — 2.65:1 (mín. 4.5) · div "CONTABILIDADE" — 3.93:1 (mín. 4.5)
  - 🟡 `alvo-pequeno` — 16 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (240×42) · a "Livro de Caixa" (240×42) · a "Catálogo" (240×42) · a "Obrigações Fiscais
2" (240×42) · a "Calculadora de Preços" (240×42) · a "Planeamento Mensal" (240×42)
  - 📷 mobile/consultoria.png

### tablet

- **/contabilidade/dashboard**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 36 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 35 elemento(s) abaixo do mínimo WCAG AA
    span "2026" — 2.03:1 (mín. 4.5) · span "79%" — 2.29:1 (mín. 4.5) · span "30% sobre o resultado do perío" — 2.37:1 (mín. 4.5) · div "Sem resultado positivo — nada " — 2.37:1 (mín. 4.5) · div "Jan" — 2.37:1 (mín. 4.5) · div "Fev" — 2.37:1 (mín. 4.5)
  - 🟡 `alvo-pequeno` — 19 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a.active "Painel" (214×42) · a "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-dashboard.png

- **/contabilidade/caixa**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 134 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 53 elemento(s) abaixo do mínimo WCAG AA
    div "(recorrentes a confirmar)" — 2.29:1 (mín. 4.5) · div "RE-2026" — 2.37:1 (mín. 4.5) · div "RE-2027" — 2.37:1 (mín. 4.5) · div "RE-2028" — 2.37:1 (mín. 4.5) · div "RE-2026" — 2.37:1 (mín. 4.5) · div "RE-2027" — 2.37:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Todos os meses
Jan 2026
Fev 20"
  - 🟡 `input-zoom-ios` — 1 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    select "Todos os meses
Jan 2026
Fev 20" (13px)
  - 🟡 `alvo-pequeno` — 47 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a.active "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-caixa.png

- **/contabilidade/recorrentes**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 32 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 10 elemento(s) abaixo do mínimo WCAG AA
    strong "€ 3790,00" — 2.29:1 (mín. 4.5) · p "Defina os custos fixos e confi" — 2.65:1 (mín. 4.5) · div "DESCRIÇÃO" — 2.79:1 (mín. 4.5) · div "CATEGORIA" — 2.79:1 (mín. 4.5) · div "VALOR (€)" — 2.79:1 (mín. 4.5) · div "PERIODICIDADE" — 2.79:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 6 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Jan 2026
Fev 2026
Mar 2026
Abr" · input (só placeholder: "2200,00") · input (só placeholder: "380,00") · input (só placeholder: "120,00") · input (só placeholder: "640,00")
  - 🟡 `input-zoom-ios` — 6 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    select "Jan 2026
Fev 2026
Mar 2026
Abr" (13px) · input (13px) · input (13px) · input (13px) · input (13px)
  - 🟡 `alvo-pequeno` — 32 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-recorrentes.png

- **/contabilidade/catalogo**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 13 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 7 elemento(s) abaixo do mínimo WCAG AA
    button "Todos" — 2.29:1 (mín. 4.5) · p "Produtos e serviços que pode v" — 2.65:1 (mín. 4.5) · div "DESIGNAÇÃO" — 2.79:1 (mín. 4.5) · div "TIPO" — 2.79:1 (mín. 4.5) · div "PREÇO (€)" — 2.79:1 (mín. 4.5) · div "CONTABILIDADE" — 3.93:1 (mín. 4.5)
  - 🟡 `alvo-pequeno` — 23 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a "Livro de Caixa" (214×42) · a.active "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-catalogo.png

- **/contabilidade/precificacao**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 21 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 17 elemento(s) abaixo do mínimo WCAG AA
    span "🍽️" — 2.29:1 (mín. 4.5) · span "Evento / Catering" — 2.29:1 (mín. 4.5) · span "(50 × €25,00 + 7 × €12,50)" — 2.37:1 (mín. 4.5) · div "sugestão: 30%" — 2.37:1 (mín. 4.5) · span "Valores estimados a partir dos" — 2.79:1 (mín. 4.5) · div "Adultos" — 2.98:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 13 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "50" · input "7" · input "25" · input "Chefe de Cozinha" (só placeholder: "Nome") · input "18"
  - 🟡 `input-zoom-ios` — 13 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    input "50" (13px) · input "7" (13px) · input "25" (13px) · input "Chefe de Cozinha" (13px) · input "18" (13px)
  - 🟡 `alvo-pequeno` — 23 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a.active "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-precificacao.png

- **/contabilidade/planeamento**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 27 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 39 elemento(s) abaixo do mínimo WCAG AA
    div "PLANEAMENTO" — 2.03:1 (mín. 4.5) · div "BASE DO PLANEAMENTO" — 2.29:1 (mín. 4.5) · div "ⓘ O custo indireto de cada lin" — 2.37:1 (mín. 4.5) · p "Planeie tratamentos/serviços p" — 2.65:1 (mín. 4.5) · div "TRATAMENTO/SERVIÇO" — 2.65:1 (mín. 4.5) · div "DURAÇÃO (MIN)" — 2.65:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 23 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "3790" (só placeholder: "550") · input "640" (só placeholder: "100") · select "Lucro
Faturação" · input "Neubau – Rohbau" (só placeholder: "Tratamento/Serviço") · input "4800" (só placeholder: "60")
  - 🟡 `input-zoom-ios` — 27 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    input "3790" (13px) · input "640" (13px) · select "Lucro
Faturação" (13px) · input "Neubau – Rohbau" (13px) · select "▾
Altbausanierung (Rate)
Energ" (13px)
  - 🟡 `alvo-pequeno` — 26 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a.active "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-planeamento.png

- **/contabilidade/clientes**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 19 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 9 elemento(s) abaixo do mínimo WCAG AA
    div "NOME" — 2.79:1 (mín. 4.5) · div "PAÍS" — 2.79:1 (mín. 4.5) · div "SETOR" — 2.79:1 (mín. 4.5) · div "SERVIÇO" — 2.79:1 (mín. 4.5) · div "ESTADO" — 2.79:1 (mín. 4.5) · span "Total" — 2.98:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Todos os países
Alemanha"
  - 🟡 `input-zoom-ios` — 1 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    select "Todos os países
Alemanha" (13px)
  - 🟡 `alvo-pequeno` — 20 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-clientes.png

- **/contabilidade/obrigacoes**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 17 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 12 elemento(s) abaixo do mínimo WCAG AA
    button "Todas" — 2.29:1 (mín. 4.5) · span "Valores estimados a partir dos" — 2.79:1 (mín. 4.5) · div "OBRIGAÇÃO" — 2.79:1 (mín. 4.5) · div "CLIENTE" — 2.79:1 (mín. 4.5) · div "PAÍS" — 2.79:1 (mín. 4.5) · div "PRAZO" — 2.79:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Todos os países
Alemanha"
  - 🟡 `input-zoom-ios` — 2 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    select "Todos os países
Alemanha" (13px) · input "2026" (13px)
  - 🟡 `alvo-pequeno` — 26 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a.active "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-obrigacoes.png

- **/contabilidade/empresa**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟠 `fonte-pequena` — 9 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 6 elemento(s) abaixo do mínimo WCAG AA
    div "GERAL" — 2.29:1 (mín. 4.5) · div "FISCALIDADE" — 2.29:1 (mín. 4.5) · div "Sugestão: 20–30%" — 2.37:1 (mín. 4.5) · p "Base para IVA, calendário fisc" — 2.65:1 (mín. 4.5) · div "CONTABILIDADE" — 3.93:1 (mín. 4.5) · div "GESTÃO" — 3.93:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 8 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "GrünBau GmbH (Demo)" (só placeholder: "ex: Lúcia Cílio, Unip. Lda") · select "🇵🇹 Portugal
🇩🇪 Deutschland" · input "EUR" · select "Normal
Isento" · select "19%
7%"
  - 🟡 `input-zoom-ios` — 8 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    input "GrünBau GmbH (Demo)" (14px) · select "🇵🇹 Portugal
🇩🇪 Deutschland" (14px) · input "EUR" (14px) · select "Normal
Isento" (14px) · select "19%
7%" (14px)
  - 🟡 `alvo-pequeno` — 20 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-empresa.png

- **/contabilidade/rucklagen**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 32 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 34 elemento(s) abaixo do mínimo WCAG AA
    div "Distância ao limite" — 2.05:1 (mín. 4.5) · div "Para seguros e reservas" — 2.06:1 (mín. 4.5) · div "(30% de 20.272,50 €)" — 2.12:1 (mín. 4.5) · div "(30% do lucro)" — 2.12:1 (mín. 4.5) · div "(22.258,59 € − 7.446,16 €)" — 2.14:1 (mín. 4.5) · div "Ao Finanzamt" — 2.14:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 4 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input (só placeholder: "0,00") · input (só placeholder: "0,00") · input (só placeholder: "0,00") · input "565"
  - 🟡 `input-zoom-ios` — 4 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    input (15px) · input (15px) · input (15px) · input "565" (15px)
  - 🟡 `alvo-pequeno` — 17 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/contabilidade-rucklagen.png

- **/esg/materialidade**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 141 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 70 elemento(s) abaixo do mínimo WCAG AA
    div "MATERIALIDADE" — 2.03:1 (mín. 4.5) · span "Pontuados: 16/16" — 2.1:1 (mín. 4.5) · span "Consumo de energia, emissões d" — 2.37:1 (mín. 4.5) · span "Emissões para o ar, água e sol" — 2.37:1 (mín. 4.5) · span "Consumo e gestão de água." — 2.37:1 (mín. 4.5) · span "Geração de resíduos, reciclage" — 2.37:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 16 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "Clientes públicos exigem pegad" (só placeholder: "Nota (porquê?)") · input "Pó e ruído nas obras urbanas." (só placeholder: "Nota (porquê?)") · input (só placeholder: "Nota (porquê?)") · input "Resíduos de obra são o maior f" (só placeholder: "Nota (porquê?)") · input (só placeholder: "Nota (porquê?)")
  - 🟡 `input-zoom-ios` — 17 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    input "Clientes públicos exigem pegad" (12px) · input "Pó e ruído nas obras urbanas." (12px) · input (12px) · input "Resíduos de obra são o maior f" (12px) · input (12px)
  - 🟡 `alvo-pequeno` — 201 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a.active "Materialidade" (214×42) · a "Diagnóstico ESG" (214×42) · a "KPIs & Monitorização" (214×42) · a "Projetos ESG" (214×42) · a "Relatórios ESG" (214×42) · a "Consultoria" (214×42)
  - 📷 tablet/esg-materialidade.png

- **/esg/diagnostico**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 53 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 65 elemento(s) abaixo do mínimo WCAG AA
    div "DIAGNÓSTICO ESG" — 2.03:1 (mín. 4.5) · span "Valores pré-preenchidos podem " — 2.1:1 (mín. 4.5) · span "10/10" — 2.12:1 (mín. 4.5) · span "28 / 28" — 2.29:1 (mín. 4.5) · span "11/11" — 2.37:1 (mín. 4.5) · div "Erwarten Sie für Ihr Unternehm" — 2.37:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 46 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "2025
2024" · input "12000" (só placeholder: "0") · select "m³
kWh
Joule" · input (só placeholder: "0") · select "t
m³
kWh
Joule"
  - 🟡 `input-zoom-ios` — 46 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    select "2025
2024" (14px) · input "12000" (14px) · select "m³
kWh
Joule" (14px) · input (14px) · select "t
m³
kWh
Joule" (14px)
  - 🟡 `alvo-pequeno` — 58 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Materialidade" (214×42) · a.active "Diagnóstico ESG" (214×42) · a "KPIs & Monitorização" (214×42) · a "Projetos ESG" (214×42) · a "Relatórios ESG" (214×42) · a "Consultoria" (214×42)
  - 📷 tablet/esg-diagnostico.png

- **/esg/kpis**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 68 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 63 elemento(s) abaixo do mínimo WCAG AA
    div "MONITORIZAÇÃO ESG" — 2.03:1 (mín. 4.5) · span "Não" — 2.16:1 (mín. 4.5) · span "Não" — 2.16:1 (mín. 4.5) · div "kWh" — 2.22:1 (mín. 4.5) · div "Autogeração 20%" — 2.22:1 (mín. 4.5) · div "m³" — 2.22:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "2025
2024"
  - 🟡 `input-zoom-ios` — 1 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    select "2025
2024" (13px)
  - 🟡 `alvo-pequeno` — 12 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Materialidade" (214×42) · a "Diagnóstico ESG" (214×42) · a.active "KPIs & Monitorização" (214×42) · a "Projetos ESG" (214×42) · a "Relatórios ESG" (214×42) · a "Consultoria" (214×42)
  - 📷 tablet/esg-kpis.png

- **/esg/projetos**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 27 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 26 elemento(s) abaixo do mínimo WCAG AA
    div "PROJETOS ESG" — 2.03:1 (mín. 4.5) · span "Início: 2026-03" — 2.37:1 (mín. 4.5) · span "Início: 2026-09" — 2.37:1 (mín. 4.5) · span "Início: 2026-01" — 2.37:1 (mín. 4.5) · p "Os projetos nascem da material" — 2.65:1 (mín. 4.5) · div "INVESTIMENTO TOTAL" — 2.98:1 (mín. 4.5)
  - 🟡 `alvo-pequeno` — 18 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Materialidade" (214×42) · a "Diagnóstico ESG" (214×42) · a "KPIs & Monitorização" (214×42) · a.active "Projetos ESG" (214×42) · a "Relatórios ESG" (214×42) · a "Consultoria" (214×42)
  - 📷 tablet/esg-projetos.png

- **/esg/relatorios**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 18 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 24 elemento(s) abaixo do mínimo WCAG AA
    div "RELATÓRIO ESG" — 2.03:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · p "Estrutura pré-preenchida com o" — 2.65:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 5 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "2025
2024" · textarea (só placeholder: "O teu texto para esta secção…") · textarea (só placeholder: "O teu texto para esta secção…") · textarea (só placeholder: "O teu texto para esta secção…") · textarea (só placeholder: "O teu texto para esta secção…")
  - 🟡 `input-zoom-ios` — 5 campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar
    select "2025
2024" (13px) · textarea (13px) · textarea (13px) · textarea (13px) · textarea (13px)
  - 🟡 `alvo-pequeno` — 14 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Materialidade" (214×42) · a "Diagnóstico ESG" (214×42) · a "KPIs & Monitorização" (214×42) · a "Projetos ESG" (214×42) · a.active "Relatórios ESG" (214×42) · a "Consultoria" (214×42)
  - 📷 tablet/esg-relatorios.png

- **/consultoria**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟠 `fonte-pequena` — 8 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 7 elemento(s) abaixo do mínimo WCAG AA
    div "CONSULTORIA" — 2.03:1 (mín. 4.5) · div "Ainda não há registos partilha" — 2.1:1 (mín. 4.5) · div "DOCUMENTOS" — 2.29:1 (mín. 4.5) · div "Esta pasta está vazia." — 2.37:1 (mín. 4.5) · p "Notas, recomendações e relatór" — 2.65:1 (mín. 4.5) · div "CONTABILIDADE" — 3.93:1 (mín. 4.5)
  - 🟡 `alvo-pequeno` — 15 alvo(s) abaixo de 44×44px — difícil acertar com o dedo
    a "Painel" (214×42) · a "Livro de Caixa" (214×42) · a "Catálogo" (214×42) · a "Obrigações Fiscais
2" (214×42) · a "Calculadora de Preços" (214×42) · a "Planeamento Mensal" (214×42)
  - 📷 tablet/consultoria.png

### desktop

- **/contabilidade/dashboard**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟡 `fonte-pequena` — 36 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 35 elemento(s) abaixo do mínimo WCAG AA
    span "2026" — 2.03:1 (mín. 4.5) · span "79%" — 2.29:1 (mín. 4.5) · span "30% sobre o resultado do perío" — 2.37:1 (mín. 4.5) · div "Sem resultado positivo — nada " — 2.37:1 (mín. 4.5) · div "Jan" — 2.37:1 (mín. 4.5) · div "Fev" — 2.37:1 (mín. 4.5)
  - 📷 desktop/contabilidade-dashboard.png

- **/contabilidade/caixa**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟡 `fonte-pequena` — 134 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 53 elemento(s) abaixo do mínimo WCAG AA
    div "(recorrentes a confirmar)" — 2.29:1 (mín. 4.5) · div "RE-2026" — 2.37:1 (mín. 4.5) · div "RE-2027" — 2.37:1 (mín. 4.5) · div "RE-2028" — 2.37:1 (mín. 4.5) · div "RE-2026" — 2.37:1 (mín. 4.5) · div "RE-2027" — 2.37:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Todos os meses
Jan 2026
Fev 20"
  - 📷 desktop/contabilidade-caixa.png

- **/contabilidade/recorrentes**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟡 `fonte-pequena` — 32 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 10 elemento(s) abaixo do mínimo WCAG AA
    strong "€ 3790,00" — 2.29:1 (mín. 4.5) · p "Defina os custos fixos e confi" — 2.65:1 (mín. 4.5) · div "DESCRIÇÃO" — 2.79:1 (mín. 4.5) · div "CATEGORIA" — 2.79:1 (mín. 4.5) · div "VALOR (€)" — 2.79:1 (mín. 4.5) · div "PERIODICIDADE" — 2.79:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 6 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Jan 2026
Fev 2026
Mar 2026
Abr" · input (só placeholder: "2200,00") · input (só placeholder: "380,00") · input (só placeholder: "120,00") · input (só placeholder: "640,00")
  - 📷 desktop/contabilidade-recorrentes.png

- **/contabilidade/catalogo**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟡 `fonte-pequena` — 13 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 7 elemento(s) abaixo do mínimo WCAG AA
    button "Todos" — 2.29:1 (mín. 4.5) · p "Produtos e serviços que pode v" — 2.65:1 (mín. 4.5) · div "DESIGNAÇÃO" — 2.79:1 (mín. 4.5) · div "TIPO" — 2.79:1 (mín. 4.5) · div "PREÇO (€)" — 2.79:1 (mín. 4.5) · div "CONTABILIDADE" — 3.93:1 (mín. 4.5)
  - 📷 desktop/contabilidade-catalogo.png

- **/contabilidade/precificacao**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟡 `fonte-pequena` — 21 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 17 elemento(s) abaixo do mínimo WCAG AA
    span "🍽️" — 2.29:1 (mín. 4.5) · span "Evento / Catering" — 2.29:1 (mín. 4.5) · span "(50 × €25,00 + 7 × €12,50)" — 2.37:1 (mín. 4.5) · div "sugestão: 30%" — 2.37:1 (mín. 4.5) · span "Valores estimados a partir dos" — 2.79:1 (mín. 4.5) · div "Adultos" — 2.98:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 13 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "50" · input "7" · input "25" · input "Chefe de Cozinha" (só placeholder: "Nome") · input "18"
  - 📷 desktop/contabilidade-precificacao.png

- **/contabilidade/planeamento**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `fonte-pequena` — 27 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 39 elemento(s) abaixo do mínimo WCAG AA
    div "PLANEAMENTO" — 2.03:1 (mín. 4.5) · div "BASE DO PLANEAMENTO" — 2.29:1 (mín. 4.5) · div "ⓘ O custo indireto de cada lin" — 2.37:1 (mín. 4.5) · p "Planeie tratamentos/serviços p" — 2.65:1 (mín. 4.5) · div "TRATAMENTO/SERVIÇO" — 2.65:1 (mín. 4.5) · div "DURAÇÃO (MIN)" — 2.65:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 23 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "3790" (só placeholder: "550") · input "640" (só placeholder: "100") · select "Lucro
Faturação" · input "Neubau – Rohbau" (só placeholder: "Tratamento/Serviço") · input "4800" (só placeholder: "60")
  - 📷 desktop/contabilidade-planeamento.png

- **/contabilidade/clientes**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟡 `fonte-pequena` — 19 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 9 elemento(s) abaixo do mínimo WCAG AA
    div "NOME" — 2.79:1 (mín. 4.5) · div "PAÍS" — 2.79:1 (mín. 4.5) · div "SETOR" — 2.79:1 (mín. 4.5) · div "SERVIÇO" — 2.79:1 (mín. 4.5) · div "ESTADO" — 2.79:1 (mín. 4.5) · span "Total" — 2.98:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Todos os países
Alemanha"
  - 📷 desktop/contabilidade-clientes.png

- **/contabilidade/obrigacoes**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟡 `fonte-pequena` — 17 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 12 elemento(s) abaixo do mínimo WCAG AA
    button "Todas" — 2.29:1 (mín. 4.5) · span "Valores estimados a partir dos" — 2.79:1 (mín. 4.5) · div "OBRIGAÇÃO" — 2.79:1 (mín. 4.5) · div "CLIENTE" — 2.79:1 (mín. 4.5) · div "PAÍS" — 2.79:1 (mín. 4.5) · div "PRAZO" — 2.79:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "Todos os países
Alemanha"
  - 📷 desktop/contabilidade-obrigacoes.png

- **/contabilidade/empresa**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `sem-h1` — a tela não tem <h1>
    body
  - 🟡 `fonte-pequena` — 9 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 6 elemento(s) abaixo do mínimo WCAG AA
    div "GERAL" — 2.29:1 (mín. 4.5) · div "FISCALIDADE" — 2.29:1 (mín. 4.5) · div "Sugestão: 20–30%" — 2.37:1 (mín. 4.5) · p "Base para IVA, calendário fisc" — 2.65:1 (mín. 4.5) · div "CONTABILIDADE" — 3.93:1 (mín. 4.5) · div "GESTÃO" — 3.93:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 8 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "GrünBau GmbH (Demo)" (só placeholder: "ex: Lúcia Cílio, Unip. Lda") · select "🇵🇹 Portugal
🇩🇪 Deutschland" · input "EUR" · select "Normal
Isento" · select "19%
7%"
  - 📷 desktop/contabilidade-empresa.png

- **/contabilidade/rucklagen**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `fonte-pequena` — 32 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 34 elemento(s) abaixo do mínimo WCAG AA
    div "Distância ao limite" — 2.05:1 (mín. 4.5) · div "Para seguros e reservas" — 2.06:1 (mín. 4.5) · div "(30% de 20.272,50 €)" — 2.12:1 (mín. 4.5) · div "(30% do lucro)" — 2.12:1 (mín. 4.5) · div "(22.258,59 € − 7.446,16 €)" — 2.14:1 (mín. 4.5) · div "Ao Finanzamt" — 2.14:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 4 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input (só placeholder: "0,00") · input (só placeholder: "0,00") · input (só placeholder: "0,00") · input "565"
  - 📷 desktop/contabilidade-rucklagen.png

- **/esg/materialidade**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `fonte-pequena` — 141 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 70 elemento(s) abaixo do mínimo WCAG AA
    div "MATERIALIDADE" — 2.03:1 (mín. 4.5) · span "Pontuados: 16/16" — 2.1:1 (mín. 4.5) · span "Consumo de energia, emissões d" — 2.37:1 (mín. 4.5) · span "Emissões para o ar, água e sol" — 2.37:1 (mín. 4.5) · span "Consumo e gestão de água." — 2.37:1 (mín. 4.5) · span "Geração de resíduos, reciclage" — 2.37:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 16 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    input "Clientes públicos exigem pegad" (só placeholder: "Nota (porquê?)") · input "Pó e ruído nas obras urbanas." (só placeholder: "Nota (porquê?)") · input (só placeholder: "Nota (porquê?)") · input "Resíduos de obra são o maior f" (só placeholder: "Nota (porquê?)") · input (só placeholder: "Nota (porquê?)")
  - 📷 desktop/esg-materialidade.png

- **/esg/diagnostico**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `fonte-pequena` — 53 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 65 elemento(s) abaixo do mínimo WCAG AA
    div "DIAGNÓSTICO ESG" — 2.03:1 (mín. 4.5) · span "Valores pré-preenchidos podem " — 2.1:1 (mín. 4.5) · span "10/10" — 2.12:1 (mín. 4.5) · span "28 / 28" — 2.29:1 (mín. 4.5) · span "11/11" — 2.37:1 (mín. 4.5) · div "Erwarten Sie für Ihr Unternehm" — 2.37:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 46 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "2025
2024" · input "12000" (só placeholder: "0") · select "m³
kWh
Joule" · input (só placeholder: "0") · select "t
m³
kWh
Joule"
  - 📷 desktop/esg-diagnostico.png

- **/esg/kpis**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `fonte-pequena` — 68 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 63 elemento(s) abaixo do mínimo WCAG AA
    div "MONITORIZAÇÃO ESG" — 2.03:1 (mín. 4.5) · span "Não" — 2.16:1 (mín. 4.5) · span "Não" — 2.16:1 (mín. 4.5) · div "kWh" — 2.22:1 (mín. 4.5) · div "Autogeração 20%" — 2.22:1 (mín. 4.5) · div "m³" — 2.22:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 1 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "2025
2024"
  - 📷 desktop/esg-kpis.png

- **/esg/projetos**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `fonte-pequena` — 27 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 26 elemento(s) abaixo do mínimo WCAG AA
    div "PROJETOS ESG" — 2.03:1 (mín. 4.5) · span "Início: 2026-03" — 2.37:1 (mín. 4.5) · span "Início: 2026-09" — 2.37:1 (mín. 4.5) · span "Início: 2026-01" — 2.37:1 (mín. 4.5) · p "Os projetos nascem da material" — 2.65:1 (mín. 4.5) · div "INVESTIMENTO TOTAL" — 2.98:1 (mín. 4.5)
  - 📷 desktop/esg-projetos.png

- **/esg/relatorios**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `fonte-pequena` — 18 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "ESG CONSULTING" (10px) · div "GR" (11px) · button "Contabilidade" (11px) · button "ESG" (11px)
  - 🟠 `contraste-baixo` — 24 elemento(s) abaixo do mínimo WCAG AA
    div "RELATÓRIO ESG" — 2.03:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · div "DADOS AO VIVO DA PLATAFORMA" — 2.37:1 (mín. 4.5) · p "Estrutura pré-preenchida com o" — 2.65:1 (mín. 4.5)
  - 🟠 `campo-sem-rotulo` — 5 campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem `label for`/`aria-label` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)
    select "2025
2024" · textarea (só placeholder: "O teu texto para esta secção…") · textarea (só placeholder: "O teu texto para esta secção…") · textarea (só placeholder: "O teu texto para esta secção…") · textarea (só placeholder: "O teu texto para esta secção…")
  - 📷 desktop/esg-relatorios.png

- **/consultoria**
  - 🟠 `zoom-bloqueado` — meta viewport impede ampliar: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    meta[name=viewport]
  - 🟡 `fonte-pequena` — 8 elemento(s) abaixo de 12px
    div "OFFICE CONSULTING" (9px) · div "CONTABILIDADE" (10px) · div "GESTÃO" (10px) · div "GR" (11px) · button "Contabilidade" (11px)
  - 🟠 `contraste-baixo` — 7 elemento(s) abaixo do mínimo WCAG AA
    div "CONSULTORIA" — 2.03:1 (mín. 4.5) · div "Ainda não há registos partilha" — 2.1:1 (mín. 4.5) · div "DOCUMENTOS" — 2.29:1 (mín. 4.5) · div "Esta pasta está vazia." — 2.37:1 (mín. 4.5) · p "Notas, recomendações e relatór" — 2.65:1 (mín. 4.5) · div "CONTABILIDADE" — 3.93:1 (mín. 4.5)
  - 📷 desktop/consultoria.png

---
Isto é o mensurável. Abra as capturas e olhe: hierarquia, espaçamento, texto ambíguo,
estado vazio sem explicação e fluxo que não faz sentido não aparecem em nenhuma métrica.