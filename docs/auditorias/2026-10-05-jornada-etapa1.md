# Jornada do cliente — etapa 1 (teste interno) · 05/10/2026

**Onde:** produção (`lucia-cilio-platform.vercel.app`, commit `2048e88`, após a migração 038).
**Como:** sessão de admin do Vinícius (equipa) + conta de teste `vinibohnb+teste-jornada@gmail.com`
(cliente), ficha `TESTE Jornada — apagar`. Tudo o que foi criado está listado no fim para a limpeza.

Legenda: ✅ passou · ❌ falhou · ⚠️ confuso / dúvida de produto · 📝 observação lateral

## Observações antes do roteiro

- 📝 O admin, ao entrar, cai em `/contabilidade/inicio` ("Bem-vinda de volta, Teste") e não na
  Gestão. É a Contabilidade de demonstração; faz sentido para a Lúcia testar, mas para a
  equipa o início natural é Gestão → Clientes. **Dúvida para a Lúcia.**
- 📝 Na lista de clientes a coluna "Próxima obrigação" está a "—" em **todos** os 19 clientes:
  nenhuma ficha tem calendário fiscal gerado. Enquanto for assim, "Tudo em dia" não diz nada.
- 📝 "Celia Munster" (PT) e "Célia Munster" (DE) continuam as duas na lista — a limpeza da
  duplicada está no BACKLOG.

## A. Equipa prepara o cliente

1. **Criar a ficha** (Gestão → Clientes → Novo cliente: DE, setor Teste, Contabilidade, Onboarding)
   - ❌ **O calendário gerado ao criar a ficha não fica gravado.** Erro no ecrã: *"insert or
     update on table fiscal_obligations violates foreign key constraint
     fiscal_obligations_cliente_id_fkey"*. Causa: `paraCliente()` em `src/portal/dados.js:73`
     tira o `id` da linha enviada, a base de dados atribui outro UUID, e as 16 obrigações do
     calendário apontam para o id que só existia no ecrã (`f11dcefa…` no ecrã, `e0642b4d…`
     na base). A ficha fica gravada; o calendário não. A espera `depoisDaFicha` existe mas
     não resolve isto. **Corrigir antes da etapa 2.** → enviar o `id` no insert.
   - ❌ **Abrir a página do cliente pelo endereço (ou atualizar) volta à lista.**
     `PaginaCliente.jsx:41` redireciona quando a ficha "não existe", mas no primeiro render os
     dados ainda não carregaram. Consequência: não dá para partilhar a ligação de uma ficha nem
     fazer F5. **Corrigir antes da etapa 2.** → esperar `s.carregado`.
   - ✅ A ficha aparece na lista com os valores por omissão (Einzelunternehmen, Regelbesteuerung,
     Lexware, trimestral, responsável = eu).
2. **Gerar o calendário 2026** (aba Obrigações → "Gerar calendário 2026")
   - ✅ 16 obrigações (USt-VA, GewSt-VZ e ESt-VZ trimestrais + EÜR, ESt, GewSt e USt anuais),
     sem duplicar.
   - ⚠️ Um cliente que entra hoje recebe as obrigações de Q1–Q3 já "em atraso" (9 das 16).
     Para um cliente novo, o que fazer com os períodos anteriores à entrada? (Os relatórios
     trimestrais já mostram "—" antes de `cliente_desde`; o calendário não.) **Dúvida para a
     Lúcia** — proposta: gerar só a partir de `cliente_desde`, com opção de incluir o resto.

3. **Pedir os documentos deste mês** (aba Documentos)
   - ✅ Cria os 3 pedidos de outubro de 2026 (faturas de venda, de compra, extrato) como "Em
     falta"; o Resumo passa a mostrar "Documentos em falta 3 · ver →".
4. **Tarefa, nota, horas, mensagem e relatório**
   - ✅ Tarefa ligada à obrigação USt-VA Q3, prazo 08/10, aparece em Tarefas e no Resumo.
   - ✅ Nota interna registada com autor e data.
   - ❌ **O botão "+" das horas, com os campos vazios, regista "Trabalho · 1 h".** Carreguei
     nele uma vez para abrir o formulário (os campos já estavam à vista, mas não é óbvio) e
     ficou uma entrada fantasma. Deve ignorar horas vazias/zero. **Corrigir antes da etapa 2.**
   - ✅ Horas: 1,5 h registadas e somadas ("2,5 h nos últimos 30 dias", com a fantasma).
   - ⚠️ Mensagens, sem conta ligada: diz "Este cliente não tem conta na plataforma… use o
     WhatsApp" e só regista. Correto, mas obriga a ligar a conta primeiro — a ordem natural
     seria criar a conta ao criar a ficha (Fase 2, R-C1).
   - ✅ Com conta ligada, a mensagem fica na conversa como "Visível ao cliente".
   - 📝 Ao enviar a mensagem apareceu um erro 400 na consola **sem** aviso no ecrã (o `gravar`
     não o apanhou — veio de outro pedido). A confirmar se o aviso chega ao cliente (passo 8).
   - ✅ Relatório T3 2026: valores, resultado calculado (€ 7 500), observações; "Guardar e
     marcar como enviado" → "Enviado · 05 out." na lista e "Último relatório T3 2026" no Resumo.
5. **Criar a conta e ligar à ficha**
   - ✅ Acessos → Novo utilizador (Contabilidade, DE, serviço Contabilidade). Palavra-passe
     temporária mostrada no ecrã; sem e-mail.
   - ✅ Não criou uma segunda ficha (país e serviço vão só para o perfil).
   - ✅ Ficha → Dados → "Conta na plataforma" lista a conta nova; ligar pede confirmação.
   - ⚠️ A confirmação é um `window.confirm` nativo — funciona, mas é a única confirmação
     nativa no portal; o resto usa diálogos próprios. Cosmético.
   - 📝 Ligar a conta é um passo manual em sítio diferente de onde se criou a conta (Acessos
     ↔ Dados do cliente). Para a Lúcia: criar a conta a partir da ficha, já ligada.
6. **Aba "Conta na plataforma" e Visualização completa**
   - ✅ Aparece depois de ligar; mostra o estado "○ pendente" (ainda não entrou) e o botão
     Visualização completa.
   - ⚠️ Para um cliente DE acabado de criar mostra "LUCRO / LIMITE (MÊS) € 0 / € 565 · 0%
     (média real)" e "ONBOARDING 1 de 6 feitos", "CLIENTES 0" — são os indicadores da conta
     de contabilidade dele (ainda sem nada). Confuso ao lado da ficha. **Dúvida para a Lúcia:**
     o que desta aba interessa mesmo à equipa?

## B. Cliente entra

7. **Entrar** (o Vinícius entrou com a palavra-passe temporária e definiu a definitiva)
   - ✅ Entra, cai em `/contabilidade/inicio`.
   - ⚠️ "Bem-vinda de volta" **sem nome** (a saudação usa um nome que a conta nova não tem) e
     no feminino para toda a gente. Para a Nicole fica bem; para um cliente homem não.
   - ⚠️ **Não há onde mudar a língua.** O menu só tem "Modo noturno" e "Terminar sessão";
     um cliente alemão vê a interface em português. Confirmar onde a língua é definida (país
     da conta? navegador?) — para a Vânia (etapa 3) isto importa.
8. **Início**
   - ✅ A mensagem da equipa está em "Mensagens da Lúcia"; "Marcar como lido" funciona e fica
     "· Lido" (o erro 400 do passo 4 não impediu a entrega).
   - ✅ Próxima obrigação (GewSt-VZ, 232 dias em atraso) e sino com 9 prazos.
   - ⚠️ "Documentos deste mês · outubro de 2026 · Enviar documentos →" **não diz quais** os 3
     documentos que a equipa pediu nem que estão em falta.
9. **Obrigações** (`/contabilidade/obrigacoes`)
   - ✅ As 16 da equipa aparecem com a etiqueta **EQUIPA**, estado só de leitura e a nota
     "Gerida pela equipa da Lúcia — é a equipa que atualiza o estado e o comprovativo" (038 ✔).
   - ✅ Banner "9 obrigações em atraso ou nos próximos 14 dias" (8 em atraso + USt-VA Q3 em 5
     dias).
   - ⏸ "+ Nova Obrigação" (obrigação própria do cliente): não testado — ver nota no fim.
10. **Documentos**
   - ❌ **"Enviar documentos →" leva a Gestão → "Dados da Empresa"**, a página de perfil fiscal
     da v1, com a secção DOCUMENTOS no fundo: um mês e um botão de ficheiro. Não há relação com
     os pedidos da equipa (faturas de venda, de compra, extrato) e o cliente não sabe o que
     falta. É a lacuna já conhecida ("ligar o portal do cliente"), mas para a etapa 2 a Nicole
     vai tropeçar aqui. **Mínimo antes da etapa 2:** mostrar no Início e nessa secção a lista
     do que foi pedido e o que falta; **ideal:** a página Documentos do portal em modo cliente.
   - ⚠️ Nessa página o nome da empresa está vazio e o regime/IVA são os valores por omissão —
     o cliente vê e pode editar um perfil fiscal paralelo ao da ficha (R-C2).
   - ⚠️ Tratamento inconsistente: "Ainda não **enviaste** nada" (tu) vs. "Bem-vinda" (você).
   - ✅ Carregar um ficheiro para outubro funciona (`TESTE-extrato-outubro.txt`, 1 kB, "Abrir",
     "só a Lúcia o pode remover"). A confirmar na parte C se a equipa o vê na ficha.
11. **O que o cliente não vê**
   - ✅ `/gestao/clientes`, `/gestao/clientes/<id>` e `/esg/kpis` redirecionam para o Início.
   - ✅ O menu não tem ESG nem Gestão.
   - ⚠️ A conta foi criada como "Contabilidade" (completa): o cliente vê 14 páginas —
     Painel, Livro de Caixa, Conciliação, Catálogo, Calculadora, Planeamento, Clientes,
     Empresa, Consultoria, Reservas, EÜR… A reunião de 25/09 decidiu **portal só
     informativo**; para isso a conta teria de ser "Contabilidade Lite". **Dúvida para a
     Lúcia:** qual é a plataforma por omissão de um cliente novo? (Sugestão: Lite, e a
     completa só para quem a contratou.)
   - ⏸ **Verificação de permissões na base de dados** (ler as tabelas com a sessão do cliente
     para confirmar que só vê o que é dele): não feita — a política desta sessão bloqueou
     leituras diretas à base de produção. Fica para fazer com o Vinícius a autorizar, ou no
     ambiente de DEV.
12. **Relatórios trimestrais**
   - ❌ **O cliente não tem onde ver o relatório T3 "enviado".** Não há página de relatórios
     na vista do cliente; "enviado" significa que a Lúcia exportou o PDF e o mandou por fora.
     Lacuna conhecida (BACKLOG: ligar o portal do cliente). Confirmar com a Lúcia se é para
     já ou se o PDF por WhatsApp chega para esta fase.
13. **Telemóvel (375 px)** — ✅ Início sem transbordo horizontal, menu em gaveta, sino com 9.

## C. Equipa recebe o retorno

14. **Lista de clientes** — ✅ a linha do teste mostra "8 obrigações em atraso · 3 doc. em
    falta" na coluna Atenção (acerto dos 16 ✔) e a próxima obrigação.
15. **Ficha → Documentos** — ✅ o ficheiro do cliente aparece em "Enviados pelo cliente em
    outubro" com "Classificar…" (venda/compra/extrato…). ⚠️ Enquanto a equipa não o
    classificar, os 3 pedidos continuam "em falta" e o Resumo diz "3" — é por desenho (a equipa
    valida), mas convém a Lúcia saber que o número só baixa depois de classificar.
16. **Ficha → Conta na plataforma** — ✅ passou a "● ativo" depois do primeiro acesso.
    - ❌ **Erro 400 em cada abertura desta aba:** `column client_billing.contract_path does not
      exist`. A **migração 035** (contrato anexado à avença: `contract_path`, `contract_name`)
      **não está aplicada em produção**. Afeta também Gestão → Financeiro (anexar contrato) e
      o Início do cliente (botão do contrato). Sem aviso no ecrã. **Aplicar a 035** — são só
      dois `add column if not exists`.
17. **Ficha → Mensagens** — ✅ a mensagem aparece como "LC Office Consulting · lida".
18. **Ficha → Relatórios**
    - ❌ **"Guardar e marcar como enviado" não grava o "enviado".** Depois de recarregar o
      relatório T3 está "Rascunho" e o Resumo diz "ainda nenhum". Causa:
      `Relatorio.jsx:106` chama `acoes.marcarRelatorioEnviado(guardar())` — o `update` corre
      antes de o `upsert` do `guardar()` chegar à base, não encontra a linha e atualiza 0 linhas
      **sem erro**. **Corrigir antes da etapa 2** → gravar `estado: 'enviado'` no próprio upsert
      (ou encadear).
19. **Comprovativo** (USt-VA Q3 → Pago, anexar, remover)
    - ✅ Estado "Pago" gravado (a linha passou para "Entregues").
    - ✅ Anexar o comprovativo marca "Comprovativo arquivado" (Checklist 1/9).
    - ✅ Remover (✕) desmarca (Checklist 0/9) — acerto dos 16 ✔.
20. **Segunda mensagem / não lida no cliente** — ⏸ não testado (exigia trocar de sessão outra
    vez). A primeira já provou o caminho equipa → Início do cliente → lida.

## D. Limpeza

- ⚠️ **Não há forma de apagar uma ficha de cliente na plataforma** (nem na lista nem em
  Dados do cliente). Para a Lúcia isto importa já: a "Celia Munster" duplicada e qualquer
  ficha criada por engano só saem por SQL. **Proposta:** botão "Eliminar ficha" em Dados do
  cliente, só admin, com confirmação a escrever o nome.
- A conta de teste apaga-se em Acessos → Eliminar (a API apaga também a pasta de ficheiros).
- A ficha e tudo o que lhe está ligado (16 obrigações, 1 tarefa, 1 nota, 2 registos de horas,
  3 pedidos de documento, 1 relatório, ligação à mensagem) saem com um `delete` em
  `clientes` — as tabelas da 037 têm `on delete cascade`. Consulta em
  `supabase/limpeza_teste_jornada_2026-10-05.sql` (lista primeiro, apaga depois).

**06/10:** a 035 foi aplicada e a conta de teste eliminada em Acessos. A ficha **ainda
estava na lista** depois disso (o bloco B da consulta não chegou a apagar) — com "3 doc. em
falta" e **sem nenhuma obrigação**.
- ❌ **Eliminar a conta apagou as 16 obrigações da ficha.** As obrigações da equipa levam
  `user_id` da conta (para o cliente as ver) e `fiscal_obligations.user_id` tem `on delete
  cascade` das migrações antigas. Se a Lúcia eliminar a conta de um cliente (trocar de e-mail,
  limpar um acesso), o calendário fiscal da ficha desaparece com ela. **Corrigir:** `on delete
  set null` para as obrigações ligadas a uma ficha (ou a API pôr `user_id` a null antes de
  apagar). Mesma pergunta para `client_notices` (mensagens) e para a pasta de ficheiros, que a
  API apaga de propósito.
- A ficha sai com o bloco B (delete por id).

## Dados de teste criados (apagados a 06/10)

| O quê | Onde | Identificador |
|---|---|---|
| Ficha `TESTE Jornada — apagar` | `clientes` | `e0642b4d-658c-4623-b11f-96525433bbae` |
| Conta `vinibohnb+teste-jornada@gmail.com` | `auth.users` / `profiles` | `50234829-1f59-469c-a603-265f9f81a0c9` |
| 16 obrigações 2026 (calendário) | `fiscal_obligations` | `cliente_id` da ficha |
| Tarefa "TESTE — preparar USt-VA Q3" | `tarefas` | `cliente_id` da ficha |
| Nota interna + 2 registos de horas (1 h fantasma, 1,5 h) | `notas_cliente`, `horas_cliente` | `cliente_id` da ficha |
| 3 pedidos de documentos (outubro) | `documentos_cliente` | `cliente_id` da ficha |
| Relatório T3 2026 (rascunho) | `relatorios_trimestrais` | `cliente_id` da ficha |
| Mensagem "TESTE — Bem-vinda!…" | `client_notices` | `user_id` da conta |
| `TESTE-extrato-outubro.txt` (cliente), comprovativo removido | storage `client-docs/50234829…/` | sai com a conta |

## Correções — 06/10

Publicadas em `main` (`0d44073` + `6ebc100`) e verificadas em produção com uma ficha de teste
nova (`TESTE Correções — apagar`, criada e eliminada pelo botão novo):

| Erro | Correção | Verificado |
|---|---|---|
| Criar ficha não grava o calendário | o `id` vai no insert | ✅ 7 obrigações PT persistem após F5 |
| F5 na ficha volta à lista | espera por `s.carregado` | ✅ ligação direta abre a ficha |
| Relatório não fica "enviado" | estado vai no upsert | ✅ "Enviado · 06 out." após F5 |
| "+" das horas regista 1 h | campo nasce vazio | ✅ 0 h depois de carregar em "+" |
| Saudação sem nome / feminino | "Olá, {primeiro nome}" (metadados da conta) | ✅ "Olá, …" |
| "enviaste" | impessoal | — (texto) |
| Sem eliminar ficha | cartão "Eliminar ficha" (admin, escrever o nome) | ✅ botão desativado até o nome bater; ficha some da lista |
| Eliminar conta apaga obrigações | API desliga `user_id` antes de apagar | — (não exercitado; código) |

**Incidente durante a publicação (≈10 min):** a primeira versão lia `display_name` de
`profiles`, que não tem essa coluna; a leitura do perfil falhava e o fallback dava a toda a
gente o papel "user" — o admin caía na Contabilidade e perdia a Gestão. Corrigido em
`6ebc100` (o nome vem dos metadados da conta). Se a Lúcia entrou nesse intervalo, bastou
recarregar.

**Em branch (`jornada-docs-cliente`, à espera da migração 039):** o cliente passa a ver no
Início e em Dados da Empresa → Documentos os pedidos do mês com o estado e quantos faltam.
