# Checklist — Correções e Melhorias

> Base: reuniões com a Lúcia (22/07 e 30/07/2026) + itens em aberto de reuniões anteriores.
> Prazo do projeto: início de maio → **início de novembro de 2026** (6 meses).
> Cada item tem o **porquê** (contexto da reunião).
>
> **Convenção:** logo que um item fica resolvido, sai desta lista e passa para
> **[✅ Concluído](#-concluído)**, no fim do ficheiro — as secções de prioridade mostram
> apenas o que falta fazer.

**Prioridades definidas pela Lúcia (30/07):** *"CRM e consultoria"* é o foco agora.
A contabilidade *"está excelente como está, é só corrigir o português"*.

> **Fora do nosso âmbito:** revisão de nomenclatura (PT-PT / DE / EN) — a Lúcia faz esta
> revisão e envia-nos as correções.

---

## 🔴 P1 — CRM

- [ ] **Entrada automática de leads: formulários JotForm / landing page / e-book** → CRM,
      já numa fase definida do funil.
      **Porquê:** ela vai lançar um e-book ("o que fazer depois de abrir atividade") com formulário —
      *"todos estes dados, isto é CRM, não é? São leads"*.
      ⚠️ **Bloqueado por decisão:** falta saber que campos os formulários vão enviar. A alinhar na
      reunião com o Filipe. O campo `source` já está pronto para os receber.
- [ ] **Instagram → CRM**: importar os ~250 seguidores atuais (ela limpa manualmente na plataforma)
      + automação da Meta API com mensagem inicial de abordagem.
      **Porquê:** pedido repetido em duas reuniões. ⚠️ Investigar primeiro o estado atual da API da
      Meta e os custos antes de prometer prazo.

## 🟡 P3 — Consultoria e jornada do cliente

- [ ] **Página de Consultoria** — validar com a Lúcia o desenho atual (hoje está focada em documentos).
      **Porquê:** Vinícius ficou de *"mandar para validar contigo"*.
- [ ] **Cliente poder enviar documentos** pela aplicação — hoje o cliente só consegue **ver e
      descarregar** (`DocsBrowser readOnly`); o envio é só do lado do admin.
      **Porquê:** *"os clientes enviarem uma documentação através da aplicação"*.
- [ ] **Guião de reunião** — roteiro base (data, tema, próximos passos, diagnóstico) na ficha do cliente.
      **Porquê:** *"para eu ter um guião básico também, quando eu abro isso"*.
- [ ] **IA nas transcrições** — resumo + próximos passos com datas + checklist para o cliente.
      **Porquê:** foi o que mais a entusiasmou; princípio **human-in-the-loop** — a IA propõe,
      a Lúcia valida (*"eu não quero que seja tudo automatizado"*).
- [ ] **Mapear a jornada do cliente** (documento, antes de automatizar): Instagram/formulário →
      filtro quente/frio → primeiro contacto → **diagnóstico de 20 min** → serviço.
      **Porquê:** *"o meu receio é dispersar... que façamos isto de uma forma organizada"*.
- [ ] **Agendamento do diagnóstico inicial (20 min)** a partir do formulário.

## 🟡 P3 — Contabilidade

- [ ] **Reserva pessoal** — campo na página da Empresa (quanto o empresário quer reservar
      para si, à semelhança da reserva de IR).
      **Nota:** não confundir com os movimentos privados do Livro de Caixa
      (*Privatentnahme/Privateinlage*), que já existem — isto é uma **meta de reserva** configurável.
- [ ] **Painel consolidado de reservas no Dashboard** — IVA + IR + pessoal numa lista
      expansível (recolhida por omissão).
      **Estado atual:** o IVA e a reserva de IR já aparecem, mas em cartões separados e sem
      a reserva pessoal. Falta juntar e permitir expandir.
- [ ] **Limite de faturação (PT)** — o limite já é editável manualmente, mas só existe na versão
      alemã (Familienversicherung). Falta o equivalente português e o rótulo por país.
      **Porquê:** *"em Portugal será o limite da faturação, mas depois eu confirmo melhor"*.
      ⚠️ Depende da confirmação das regras por ela.

## 🟡 P3 — Onboarding

- [ ] **Página de onboarding de clientes** — checklist/formulário de entrada do cliente novo
      (dados da empresa, documentos, acessos, expectativas).
- [ ] **Botão "Fazer Onboarding"** na visão do administrador, para a Lúcia conduzir o processo
      com o cliente (ou o próprio cliente preencher).
      **Liga-se a:** guião de reunião e diagnóstico inicial de 20 min.

## 🟡 P3 — Gestão interna

- [ ] **Dashboard macro** — próximos pagamentos, pagamentos em aberto, faturação total.
      **Porquê:** *"é mesmo mais na perspetiva comercial"* (controlling comercial).
- [ ] **Anexar contrato (PDF)** ao contrato do Financeiro.
      **Porquê:** *"contratos ficam aqui, qualquer coisa tem acesso"*.
- [ ] **Exportação no formato do Excel dela** — para o que já entrega ao contabilista/IRS.
      ⚠️ Depende do ficheiro que a Lúcia vai enviar.

## 🔵 P4 — Infraestrutura, dados e segurança

- [ ] **Definir estratégia de backup** — comparar Microsoft (100–200 €/mês para 50 utilizadores)
      com alternativas (AWS / GCP), que tendem a ser mais baratas. Apresentar proposta com custos.
      **Porquê:** *"a questão dos dados, de colocar isto num servidor onde eu tenho toda esta parte
      dos dados protegida"*.
- [ ] **`docs/SEGURANCA_DADOS.md`** — documento de segurança e backup para o projeto jurídico dela.
      ⚠️ Continua à procura de advogada.
- [ ] **Integração de analytics de marketing** (Meta / Google) na plataforma — a alinhar com o Filipe.
- [ ] **Performance** — monitorizar. Já feito o code splitting (arranque −43%); avaliar o plano pago
      do Supabase se os *cold starts* incomodarem nas demonstrações.

## 🟣 Contínuo — Qualidade

- [ ] **Correção de bugs e ajustes menores** encontrados no uso (texto cortado, etc.).
- [ ] **Recolher feedback dos testadores** — pedir sugestões a quem já está a usar.
      **Porquê:** *"pede pra eles fazerem sugestões também"*; ela precisa de *"ouvir opiniões"*.

## ⏳ A aguardar da Lúcia (não bloqueia o nosso trabalho)

- [ ] Validação das 28 perguntas ESG com o mentor economista (adiado — ele esteve doente) e com o professor
- [ ] Revisão da nomenclatura PT-PT / DE / EN
- [ ] Confirmação das regras do limite de faturação em Portugal
- [ ] Ficheiro Excel das contas dela + dados de faturação dos 8 clientes
- [ ] Testadores para a plataforma
- [ ] Trazer o **Filipe** (gestor de tráfego) a uma próxima reunião
- [ ] Piloto real de consultoria ESG do zero com o **co-work** (e uma distribuidora)

---

# ✅ Concluído

> Histórico, do mais recente para o mais antigo. Não mexer nos itens acima desta linha.

### Acessos — papéis de equipa · migração 026
- [x] **Papel "comercial"** (assistente Carla) — vê **apenas o CRM**; menu, rotas e RLS
      restritos. O botão "criar contrato" fica escondido (o Financeiro é do admin).
- [x] **Papel "marketing"** (gestor de tráfego Filipe) — vê **apenas a página de Marketing**.
- [x] **Página `/gestao/marketing`** (placeholder) — espaço reservado para métricas Meta/Google,
      origem dos leads, formulários/e-book e desempenho de conteúdos; conteúdo real a definir
      com o Filipe.
- [x] **Segurança:** ambos os papéis não acedem a dados de clientes (caixa, ESG, financeiro,
      documentos) — as políticas `admin_read_all` continuam restritas a `is_admin()`; o CRM
      passou a `has_role(['admin','comercial'])`. A gestão de utilizadores continua só do admin.

### CRM — perfil e follow-up · migração 025
- [x] **Origem do lead** (`source`) — Instagram, formulário, site, LinkedIn, indicação, evento,
      manual. Etiqueta no cartão + filtro. É a base das automações de entrada.
- [x] **Temperatura do lead** (🔥 quente / 🌤 morno / ❄ frio) + filtro e cor na margem do cartão.
- [x] **Alerta de follow-up** — `last_contact_at` gravado; aos 7 dias sem contacto em etapa ativa
      o cartão fica vermelho, aparece banner com a contagem, filtro "só follow-up pendente" e
      botão "registar contacto". Etapas fechado/perdido/futuro não contam.
- [x] **Ranking de "cliente ideal"** — pontuação 0–100 (faturação 40 · temperatura 25 · setor
      prioritário 20 · dor identificada 15); cartões ordenados por pontuação dentro de cada etapa.
      **Nota:** setores prioritários em `PRIORITY_SECTORS` (`src/lib/leadScore.js`) — ajustáveis.
- [x] **Lead "fechado" → contrato no Financeiro** — cria o contrato em `client_billing` e guarda
      a ligação; pede o valor se ainda não existir.

### Contabilidade
- [x] **Disclaimer de valores estimados** (`EstimateNote`, trilingue) no Dashboard, Rücklagen &
      Steuern, Obrigações Fiscais, Precificação e Planeamento Mensal
- [x] **Inglês com as regras de Portugal** — verificado, já era o comportamento: as regras fiscais
      seguem sempre o campo *País* da empresa (PT/DE), nunca a língua da interface; não existe
      empresa inglesa (país limitado a PT/DE na interface e por restrição na base de dados)
- [x] **Despesas recorrentes** (catálogo) + integração no fluxo de caixa: o Livro de Caixa mostra
      "saídas previstas" (recorrentes devidas ainda por confirmar) e liga cada lançamento à despesa
- [x] **Calendário fiscal automático** — gera prazos de IVA e Segurança Social a partir dos Dados
      da Empresa, com sistema de notificações (sino + alertas por proximidade)
- [x] **Visão do IVA** no Dashboard — IVA liquidado, dedutível e a entregar/recuperar
- [x] **Reserva de IR** com percentagem definida pelo utilizador (editável na Empresa e na
      Rücklagen & Steuern; por omissão 25%)
- [x] **Material consumido** na calculadora de serviços (quantidade × custo unitário)
- [x] **Margem de contribuição** e ponto de equilíbrio no Dashboard

### ESG
- [x] **Ciclo ESG completo**: diagnóstico multi-ano, dupla materialidade + eixo financeiro,
      projetos com payback, KPIs ao vivo, relatório descritivo com impressão/PDF
- [x] **Remoção de todos os dados fictícios** (os KPIs passaram a usar sempre dados reais)

### Plataforma
- [x] **Clientes de demonstração** (GrünBau · Café Lisboa) com ESG + contabilidade preenchidos,
      incluindo os projetos de frota elétrica e painéis fotovoltaicos
- [x] **Acesso simultâneo às duas plataformas** (`both`) + toggle no menu, também em "Ver como"
- [x] **Performance**: code splitting por rota (arranque de 830 kB → 477 kB)
- [x] **CRM kanban, Financeiro, Clientes Ativos**, ficha do cliente com documentos e histórico

> Descartado por decisão do Vinícius: **versão "sem login"** — *"desconsidere, isso não é necessário"*.
