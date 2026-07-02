# Plano de Implementação — Melhorias LC Office Consulting

Documento para acompanhamento. **Decisões já validadas** (jun/2026) incorporadas abaixo.
Esforço: **P** ≤ meio dia · **M** 1–2 dias · **G** 3+ dias. Cada fase entra com a sua
migração SQL própria (`supabase/migration_00X.sql`) + páginas.

---

## Fase 0 — Dados da Empresa *(base, desbloqueia o resto)*
IVA, calendário fiscal e reserva de IR dependem do enquadramento da empresa.
- **BD:** `company_settings` por utilizador — nome, **país (PT/DE)**, moeda,
  regime de IVA (isento / normal + taxa por defeito do país), **% de reserva de IR**,
  enquadramento de Segurança Social, início do ano fiscal.
- **Frontend:** página "Empresa" (ou Definições) com formulário.
- **Esforço:** M

---

## Fase 1 — Despesas Recorrentes (previsto → confirmar realizado) ✅ decidido
**Decisão:** o utilizador regista despesas recorrentes que entram nos custos do mês; depois
**confirma o valor final gasto (realizado) vs o previsto**.
- **BD:** `recurring_expenses` — descrição, categoria (reusa as 16), **valor previsto**,
  periodicidade (mensal/trimestral/anual), dia de vencimento, destino (caixa/banco), ativo.
- **Fluxo mensal:** para cada despesa recorrente, gerar uma **ocorrência do mês** com estado
  *previsto*; o utilizador **confirma** (mantendo ou ajustando o valor real) → passa a
  *realizado* e conta como saída efetiva no fluxo de caixa. Enquanto não confirmado, entra
  como **custo fixo previsto** no Dashboard (previsto vs realizado).
- **Frontend:** página "Despesas Recorrentes" + widget no Dashboard/Livro de Caixa para
  confirmar as do mês; comparação previsto vs realizado.
- **Esforço:** M–G

---

## Fase 2 — Visão do IVA (por país) ✅ decidido
**Decisão:** IVA de **Portugal e Alemanha** conforme o país do utilizador.
- **Taxas por defeito:** PT **23%** · DE **19%** (com taxas reduzidas selecionáveis:
  PT 6%/13%, DE 7%); taxa por defeito vem dos Dados da Empresa, editável por lançamento.
- **BD:** `cash_entries` ganha `vat_rate` e `vat_amount` (opcionais).
- **Cálculo:** IVA liquidado (entradas) − IVA dedutível (saídas) = **IVA a entregar**,
  por período (trimestral).
- **Frontend:** secção/cartão "IVA" com apuramento do período.
- **Dependência:** Fase 0.
- **Esforço:** M

---

## Fase 3 — Reserva de Imposto de Renda ✅ decidido
**Decisão:** **% definida pelo utilizador**, com sugestões **PT e DE: 20–30%**.
- **BD:** `% reserva IR` em `company_settings`.
- **Dashboard:** cartão "Reserva para IR" = % × rendimento do período (quanto pôr de lado);
  opção de ver saldo líquido dessa reserva.
- **Calculadora de preços:** opção de acrescentar a fatia de IR ao preço.
- **Dependência:** Fase 0.
- **Esforço:** P–M

---

## Fase 4 — Calendário Fiscal + Notificações (in-app) ✅ decidido
**Decisão:** notificações **in-app** por agora (sem email/infra de agendamento).
- **Calendário fiscal:** gerar obrigações recorrentes conforme país/regime —
  **IVA**, **Segurança Social**, **IRS/IRC** (PT) / USt, ESt, Gewerbesteuer (DE),
  distinguindo **entrega da declaração** vs **pagamento**. Reaproveita `fiscal_obligations`
  (datas-modelo geradas automaticamente).
- **Notificações in-app:** aviso no Dashboard X dias antes de cada prazo.
- **Dependência:** Fase 0.
- **Esforço:** M
- *(Email agendado fica para o futuro, se necessário.)*

---

## Fase 5 — Relatórios Internos
- Relatórios por período: fluxo de caixa, IVA, SS, reserva IR, receita por produto, resultado.
- Vista imprimível / PDF (CSS de impressão como 1.ª abordagem).
- **Dependência:** Fases 1–4.
- **Esforço:** M

---

## Fase 6 — Material Consumido na Calculadora de Serviços
- Substituir o campo único "materiais" por **lista de materiais consumidos**
  (quantidade × custo unitário), opcionalmente a partir do Catálogo.
- **Esforço:** M

---

## Fase 7 — Gestão de Finanças Pessoais *(add-on, última)*
- Módulo separado da contabilidade do negócio: contas, orçamento, receitas/despesas pessoais.
- **BD:** tabelas próprias (`personal_*`).
- **Esforço:** G
- **A definir:** âmbito mínimo da v1.

---

## Removidos / fora de âmbito
- **Convite de utilizadores por email** — desconsiderado (mantém-se criação com password no Admin).
- **Rever versão "sem login"** — desconsiderado (app está 100% protegida).

---

## Ordem de execução
1. Fase 0 — Dados da Empresa
2. Fase 1 — Despesas recorrentes (previsto → realizado)
3. Fase 2 — IVA (PT/DE)
4. Fase 3 — Reserva de IR
5. Fase 4 — Calendário fiscal + notificações in-app
6. Fase 5 — Relatórios
7. Fase 6 — Material na calculadora
8. Fase 7 — Finanças pessoais (add-on)
