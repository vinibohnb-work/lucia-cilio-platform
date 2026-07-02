# Plano de Implementação — Melhorias LC Office Consulting

Documento para **validação** antes de desenvolver. Cada item indica: o que é, alterações
(BD / frontend / infra), dependências, esforço (P/M/G) e decisões em aberto.
Legenda esforço: **P** ≤ meio dia · **M** 1–2 dias · **G** 3+ dias.

---

## Fase 0 — Dados da Empresa *(base, desbloqueia quase tudo)*
**Porquê primeiro:** IVA, calendário fiscal, IR e relatórios dependem do enquadramento da empresa.

- **BD:** nova tabela `company_settings` por utilizador — nome, país (PT/DE/…), moeda,
  regime de IVA (isento/normal + taxa por defeito), enquadramento IRS/IRC, regime de
  Segurança Social, início do ano fiscal.
- **Frontend:** nova página "Empresa" (ou secção em Definições) com formulário.
- **Esforço:** M
- **Decisão:** que campos são mesmo necessários já? (mínimo: país + regime IVA + % IR)

---

## Fase 1 — Catálogo de Despesas Recorrentes
- **BD:** tabela `recurring_expenses` — descrição, categoria (reusa as 16 já existentes),
  valor, periodicidade (mensal/trimestral/anual), dia de vencimento, destino (caixa/banco),
  ativo, data início/fim.
- **Computar no fluxo de caixa** — duas abordagens (a validar):
  - **(A) Materialização:** gerar automaticamente os lançamentos no Livro de Caixa nas datas
    devidas (marcados como "recorrente"). Fluxo real fica completo, mas cria entradas que é
    preciso poder editar/saltar.
  - **(B) Projeção:** não cria lançamentos; mostra no Dashboard uma linha "custos fixos
    previstos" e um fluxo projetado (previsto vs realizado).
  - **Recomendação:** começar por **(B) projeção** (mais simples e seguro) e, se quiseres,
    adicionar **(A)** depois com botão "confirmar lançamento do mês".
- **Frontend:** página "Despesas Recorrentes" + cartão de custos fixos no Dashboard.
- **Esforço:** M (projeção) / G (com materialização)
- **Decisão:** A, B, ou B→A faseado?

---

## Fase 2 — Visão do IVA
- **BD:** adicionar a `cash_entries` a taxa de IVA e valor de IVA por lançamento
  (`vat_rate`, `vat_amount`), com valor por defeito vindo dos dados da empresa.
- **Cálculo:** IVA liquidado (entradas) − IVA dedutível (saídas) = **IVA a entregar**,
  por período (trimestral em PT).
- **Frontend:** nova secção/aba "IVA" ou cartão no Dashboard com apuramento do período.
- **Dependência:** Fase 0 (regime/taxa).
- **Esforço:** M
- **Decisão:** o IVA é introduzido lançamento a lançamento, ou estimado por uma taxa global?

---

## Fase 3 — Calendário Fiscal + Notificações
- **Calendário fiscal:** gerar obrigações recorrentes conforme país/regime:
  - **IVA** (entrega + pagamento, trimestral PT)
  - **Segurança Social** (mensal/trimestral PT)
  - **IRS/IRC** (anual) · equivalentes DE (USt, ESt, Gewerbesteuer)
  - Distinguir **entrega da declaração** vs **pagamento**.
  - Reaproveita a tabela `fiscal_obligations` (gerar automaticamente as datas-modelo).
- **Notificações:**
  - **In-app:** aviso no Dashboard X dias antes (simples, sem infra).
  - **Email:** requer agendador (**Vercel Cron**) + serviço de email (Resend/SMTP) — função
    serverless que corre diariamente e envia lembretes.
- **Dependência:** Fase 0.
- **Esforço:** M (in-app) / G (email agendado)
- **Decisão:** notificação in-app chega para já, ou email desde o início?

---

## Fase 4 — Imposto de Renda (reserva + calculadora)
- **Reserva de IR definida pelo utilizador:** % alvo (ex.: 20–30% PT IRS / DE).
  - Guardar em `company_settings`.
  - **Dashboard:** cartão "Reserva para IR" = % × rendimento do período (quanto pôr de lado).
  - **Livro de Caixa:** opcional mostrar saldo "líquido de reserva IR".
- **Na calculadora de preços:** opção de acrescentar a fatia de IR ao preço (para o preço já
  cobrir o imposto).
- **Dependência:** Fase 0.
- **Esforço:** P–M
- **Decisão:** % única global ou por país; aplicar sobre rendimento bruto ou líquido de custos.

---

## Fase 5 — Convite de Utilizadores por Email
- **Estado atual:** Admin cria conta com password (`createUser`, `email_confirm`) — **sem email de convite**.
- **Mudança:** usar `inviteUserByEmail` (envia convite, utilizador define a própria password).
- **Infra:** exige **SMTP configurado no Supabase** (o email default tem limites baixos;
  produção precisa de SMTP próprio, ex.: Resend). Verificar/configurar.
- **Esforço:** P (código) + configuração de SMTP
- **Decisão:** manter criação com password OU passar a convite por email? (ou os dois)

---

## Fase 6 — Relatórios Internos
- **O quê:** relatórios por período com dados da plataforma — fluxo de caixa, IVA, SS, IR,
  receita por produto, resultado.
- **Como:** geração para impressão/PDF (CSS de impressão no browser é o caminho mais rápido;
  serverless/PDF se for preciso layout fixo).
- **Dependência:** Fases 1–4 (para ter os números).
- **Esforço:** M
- **Decisão:** PDF para arquivo/partilha, ou só vista imprimível?

---

## Fase 7 — Material Consumido na Calculadora de Serviços
- **Hoje:** a calc de "Serviço por hora" tem um campo único de "materiais" (valor).
- **Melhoria:** lista de materiais consumidos (com quantidade × custo unitário), opcionalmente
  a partir do Catálogo de produtos, somando ao custo do serviço.
- **Dependência:** Catálogo (já existe).
- **Esforço:** M

---

## Fase 8 — Gestão de Finanças Pessoais *(add-on, última)*
- **O quê:** módulo separado para finanças pessoais do utilizador (contas, orçamento,
  receitas/despesas pessoais), distinto da contabilidade do negócio.
- **BD:** tabelas próprias (`personal_accounts`, `personal_transactions`, `personal_budget`).
- **Frontend:** secção nova, isolada da parte de negócio.
- **Esforço:** G
- **Decisão:** âmbito mínimo da v1 (só registo entradas/saídas pessoais + saldo?).

---

## Item transversal — Rever versão "sem login"
- **Estado atual:** app **100% protegida** (tudo sob login; `/` → `/login`). Não há dados
  expostos publicamente. A versão antiga com dados sem login era a demo inicial com dados de
  exemplo (antes do Supabase).
- **A validar:** queres (a) manter tudo fechado (recomendado, seguro), (b) uma página pública
  de demonstração com dados fictícios, ou (c) outra coisa?

---

## Ordem sugerida (por dependência e valor)
1. **Fase 0 — Dados da Empresa** (base)
2. **Fase 1 — Despesas recorrentes** (projeção)
3. **Fase 2 — IVA**
4. **Fase 4 — Reserva de IR** (rápida, alto valor)
5. **Fase 3 — Calendário fiscal + notificações**
6. **Fase 6 — Relatórios**
7. **Fase 7 — Material na calculadora**
8. **Fase 5 — Convite por email** (quando houver SMTP)
9. **Fase 8 — Finanças pessoais** (add-on)

> Cada fase entra com a sua migração SQL própria (`supabase/migration_00X.sql`) + páginas.
> Decisões marcadas acima precisam do teu OK antes de arrancar cada fase.
