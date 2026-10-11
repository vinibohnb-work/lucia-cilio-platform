# Teste de permissões da base — 11/10/2026

**Onde:** projeto DEV `jlgqvetehwpmywghpabz` (Frankfurt), montado com o `DEV_SETUP_2026-10-06.sql`
+ migrações 040–043 — o mesmo esquema da produção. Só dados fictícios.
**Como:** consultas feitas *com a identidade* de cada conta (papel `authenticated` + `auth.uid()`
da conta, exatamente como o Supabase faz para um pedido da app), sem palavras-passe. Cada
escrita corre numa transação desfeita no fim.
**Contas:** `admin@lcoffice.test` (admin), `cliente.a@lcoffice.test` e `cliente.b@lcoffice.test`
(clientes, cada um com a sua ficha), mais uma ficha sem conta e sessão anónima.

> Limite: o DEV vem dos scripts do repositório. Uma regra mudada à mão na produção, fora das
> migrações, não aparece aqui.

## 1. Leitura — cada sessão só vê o que é seu ✔

Linhas visíveis por tabela (dados de teste: 1 registo por cliente em cada tabela, mais extras):

| Tabela | Anónimo | Cliente A | Cliente B | Admin | Total |
|---|---|---|---|---|---|
| clientes (fichas) | 0 | 1 (a sua) | 1 (a sua) | 3 | 3 |
| fiscal_obligations | 0 | 1 | 1 | 4 | 4 |
| documentos_cliente | 0 | 1 | 1 | 2 | 2 |
| relatorios_trimestrais | 0 | 1 (só o *enviado*) | 1 | 3 | 3 |
| esg_consultorias / esg_reports | 0 | 1 (visível) | 0 (oculto) | 2 | 2 |
| cash_entries, company_settings, monthly_plans | 0 | 1 | 1 | 2 | 2 |
| client_billing, billing_payments, client_notices, consulting_notes | 0 | 1 | 1 | 2 | 2 |
| profiles | 0 | 1 (o seu) | 1 | 1 (o seu) | 3 |
| notas_cliente, horas_cliente, tarefas, mensagens_cliente | 0 | 0 | 0 | 2 | 2 |
| consultorias, crm_leads, diagnostico_submissoes, marketing_* | 0 | 0 | 0 | 1 | 1 |

O cliente A nunca vê nada do B (nem o B do A); notas internas, horas, tarefas, CRM,
diagnósticos e marketing são só da equipa; o rascunho do relatório trimestral e o caso ESG
oculto não aparecem ao cliente. O anónimo não lê nada.

## 2. Escrita — 35 tentativas do cliente A e do anónimo

Bloqueado como devia (✔): promover-se a admin ou mudar a plataforma no perfil; criar ou alterar
fichas; alterar/apagar obrigações da equipa (as suas e as do B); criar lançamentos de caixa na
conta do B ou alterar/apagar os dele; criar ou alterar documentos pedidos, mensagens, relatórios,
avenças, pagamentos, notas de consultoria, tarefas, leads; mostrar a si mesmo um caso ESG
oculto; mexer nas definições ou no plano do B; enviar ficheiros para a pasta do B ou para
`portal/…`; o anónimo inserir diagnósticos ou leads diretamente (só pela `/api/diagnostico`).

Achados (✗):

| # | Achado | Gravidade | Correção |
|---|---|---|---|
| P1 | **"+ Nova Obrigação" do cliente com ficha** — a obrigação é criada, mas o trigger da 038 liga-a à ficha e as regras só deixam o cliente alterar/apagar as que **não** têm ficha: não a consegue marcar como feita nem apagar, e aparece com a etiqueta "Equipa". (Era o teste que tinha ficado da etapa 1.) | 🟠 atrapalha | 044 + app: as que o cliente cria levam `source = 'cliente'` e continuam dele |
| P2 | Ao criar uma obrigação, o cliente podia indicar a ficha de **outro** cliente (`cliente_id`) — ela aparecia na ficha alheia, do lado da equipa. Exige saber o identificador da outra ficha (não está ao alcance do cliente), mas não devia passar. | 🟡 | 044: só a sua ficha (ou nenhuma) |
| P3 | O cliente podia mudar o **título e o texto** dos avisos que recebe (só devia marcar como lido). Afeta só a cópia dele. | 🔵 | 044: trigger — fora da equipa só `lido_em` muda |

**Depois da 044, no DEV:** "+ Nova" do cliente → ligada à ficha, marca como feita ✔, apaga ✔,
não a passa para a ficha do B ✔; calendário gerado pelo cliente (`auto`) continua da equipa ✔;
não se apropria de obrigações da equipa ✔; criar na ficha do B bloqueado ✔; aviso: título
mantém-se, leitura regista ✔. A equipa continua a criar, alterar e apagar tudo ✔.

## 3. Para decidir (não são erros)

- **Papéis "comercial" e "marketing"** passam no `is_equipa()`: leem todas as fichas,
  obrigações, documentos e a pasta de ficheiros de todos os clientes. Se a conta de marketing
  só precisa do Marketing, convém apertar (as regras de CRM e diagnósticos já são só
  admin + comercial). Não testado com contas desses papéis.
- **Ficheiros da ficha antes de haver conta** ficam em `portal/{ficha}/`; quando a conta é
  ligada, os novos vão para a pasta da conta, mas os antigos o cliente não consegue abrir.
- **O cliente não substitui nem apaga ficheiros** que enviou (não há regra de UPDATE/DELETE no
  storage para ele) — parece intencional; confirmar.
- `is_admin()`, `is_equipa()`, `has_role()` e `clear_must_change_password()` podem ser chamadas
  por qualquer sessão, mas só respondem sobre a própria conta — sem risco.

## Estado

Migração **044** (`supabase/migration_044.sql`) aplicada no DEV; **por aplicar na produção**.
A alteração da app está na branch `permissoes-obrigacoes` — só fazer merge depois da 044 na
produção.
