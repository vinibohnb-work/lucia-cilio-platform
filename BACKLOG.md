# Backlog de Desenvolvimento — Lúcia Cílio

> **Fontes:** reuniões do sistema interno Scalasys (tabela `meetings`) + itens levantados
> durante o desenvolvimento
> **Cliente:** Lúcia Cílio · Lúcia Cílio
> **Última sincronização:** 08/10/2026 · Reuniões processadas: 16/07/2026, 23/07/2026,
> 30/07/2026, 06/08/2026, 13/08/2026, 20/08/2026, 27/08/2026, 10/09/2026, 18/09/2026, 25/09/2026,
> 01/10/2026, 08/10/2026
> **Auditorias:** QA de interface 13/08/2026 → `docs/auditorias/2026-08-13-interface.md`
> **·** Segurança/GDPR 21/08/2026 → `docs/auditorias/2026-08-21-seguranca-gdpr.md`
> **Prazo do projeto:** início de maio → início de novembro de 2026 (6 meses)
>
> **Convenção:** itens concluídos saem das secções de cima e passam para
> **[Concluídos](#concluídos)**, no fim do ficheiro. As secções ativas mostram só o que falta.

---

## Checklist de fecho — versão final para entrega (06/10 → 14/11)

> Ordem de ataque, item a item, para fechar a versão de produção até ao fim do contrato
> (14/11). Cada linha aponta para o item detalhado mais abaixo. **⏳** = precisa da Lúcia ou de
> terceiros antes de avançar; o que não tem ⏳ faço eu. O que fica fora desta lista vai para
> "Depois da entrega", no fim desta secção, e não conta para novembro.

**Semana 1 (06–10/10) — fechar o que está a meio**
- [x] **1.** Aplicar a **migração 039** e fazer o merge de `jornada-docs-cliente` (o cliente vê
  os documentos pedidos). ⏳ Vinícius corre a 039.
- [ ] **2.** Testes que ficaram da etapa 1: "+ Nova Obrigação" do cliente e a **verificação de
  permissões** (o que a sessão do cliente lê na base) — em DEV, ou em produção com autorização.
- [ ] **3.** ⚡ Tirar o `.env.local` da pasta sincronizada com o OneDrive (5 minutos, segurança).
- [ ] **4.** Apagar a **ficha duplicada da Célia** com o botão novo, depois de ver qual das duas
  tem dados. ⏳ Confirmar com a Lúcia qual fica.
- [ ] **5.** Conferir as **fichas dos clientes** com a consulta de duplicados (nomes, contratos
  por ligar, responsável, forma, regime, periodicidade) e gerar os calendários que faltam —
  hoje nenhum cliente tem calendário. ⏳ Com a Lúcia, 1 hora.

**Semana 1–2 — uma sessão de decisões com a Lúcia** (tudo numa reunião, para desbloquear o resto)
- [ ] **6.** Dúvidas da etapa 1: calendário só a partir de "cliente desde"; conta nova em
  **Lite** ou completa; onde o cliente muda a **língua**; **relatórios** visíveis ao cliente já
  ou só PDF; o que fica na aba "Conta na plataforma"; admin a cair na Gestão.
- [ ] **7.** Pendentes da Fase 1: **papéis** da comercial e do marketing (R-A4); **reserva de
  imposto** com ou sem IVA (R-B5); Contabilidade → **Clientes** sai ou fica (R-D7); **dia de
  pagamento** de cada imposto para as mensagens de WhatsApp (R-B11).
- [ ] **8.** **Calculadora de Preços** (R-B7): fechar as quatro regras.
- [ ] **9.** Fase 2: que **páginas do lado do cliente** são mesmo usadas (o que ninguém usa sai).
- [ ] **10.** Pedir o que depende dela: contacto da **I Love Design** + acesso ao Outlook (SMTP e
  domínio); **CSVs bancários** reais; **Excel** do contabilista; **8 passos do mentor Luís** e as
  perguntas a tirar da consultoria; regras do **limite de faturação em Portugal**; o **projeto DEV
  antigo** pode ser eliminado?

**Semanas 2–3 (13–24/10) — implementar as decisões**
- [ ] **11.** As decisões dos pontos 6 a 8 (cada uma é pequena; a Calculadora é a maior).
- [ ] **12.** **Fase 2 da simplificação — uma ficha de cliente**: contratos, consultorias e casos
  ESG apontam para a ficha; fechar um lead ou criar uma conta cria-a; perfil fiscal só na ficha;
  Contabilidade → Clientes sai da conta da Lúcia. É o item mais pesado da lista (≈1 semana).
  Absorve "Um só cliente para Financeiro, Consultorias e ESG".
- [ ] **13.** **Ligar o portal do cliente**: a vista do cliente passa a ser a do portal em modo
  informativo (obrigações, documentos pedidos, mensagens, relatórios se o ponto 6 disser que
  sim). Depende do 12 e das políticas de leitura (uma migração). Fecha a jornada do cliente.
- [x] **13-A.** *(08/10, publicado 10/10)* **Página inicial do cliente mais enxuta**: próximas obrigações, documentos
  em falta, último relatório, pendências e comunicação — **sem valores**. Entra no ponto 13.
- [x] **13-B.** *(08/10, feito 10/10)* **Página inicial interna da equipa**: tarefas, pendências e relógio de
  ponto (horas). Substitui o admin a cair na Contabilidade de demonstração (ponto 6).
  ↳ O relógio de ponto já existe como página própria — **Gestão → Horas** (publicada 10/10). A
  página inicial mostra só o resumo de hoje e o atalho.
- [x] **13-C.** *(08/10, feito 09/10)* **Botão "ver como o cliente"** na ficha: alternar entre a visão interna e
  a visão do cliente, sem trocar de sessão.
- [ ] **13-D.** *(08/10)* **Revisão ecrã a ecrã para simplificar**, antes de os clientes testarem —
  é a passagem final da simplificação, feita sobre 12 e 13, com as sugestões da Letícia.
- [ ] **14.** **Aba de Marketing** com a prévia do Instagram, legenda, agenda e anotações.
- [ ] **15.** Consultoria: tirar as perguntas indicadas e absorver os 8 passos do mentor.
  ⏳ Depende do ponto 10.
- [x] **16.** *(feito 10/10)* Texto-modelo de **entrega das credenciais** (boas-vindas, endereço, troca da
  palavra-passe) para a Lúcia copiar ao criar uma conta.
- [x] **16-A.** *(08/10, feito 10/10)* **Ocultar os dados ao iniciar uma consultoria** com o cliente ao lado
  (modo de apresentação na ficha/consultoria).
- [ ] **16-B.** *(08/10)* **Validação visual com a Lúcia — semana de 13 a 17/10.** O material da
  Letícia chegou a 08/10 e já está aplicado: 6 alternativas de design no canvas (3 ecrãs cada) e a
  plataforma inteira compilada num HTML único com a paleta e as fontes novas
  (`docs/validacao/plataforma-identidade-visual-2026-10-08.html`, branch `identidade-visual`).
  Na sessão: escolher a alternativa (ou mistura), decidir a fonte do corpo (Arial Nova não é
  fonte web: licença ou Archivo), confirmar o modo noturno. Depois: merge da branch.
  ⏳ Sessão com a Lúcia (e a Letícia).

**Semana 4 (27–31/10) — validação, etapa 2**
- [ ] **17.** **Etapa 2 com a Nicole** (conta real dela), com o mesmo roteiro de 20 passos; corrigir
  o que aparecer.
- [ ] **18.** Passagem de **QA de interface** no que sobrou de 13/08: textos < 12 px, rótulos dos
  campos, alvos de toque, matriz de materialidade no telemóvel, paginação do Livro de Caixa,
  emojis → ícones. Uma varredura, não uma por item.
- [ ] **19.** Validar a **importação de extratos** com os CSVs reais. ⏳ Ponto 10.

**Semana 5 (03–07/11) — etapa 3, segurança e dados**
- [ ] **20.** **Etapa 3 com a Vânia** (cliente externa); últimas correções.
- [ ] **21.** **Projeto DEV antigo**: eliminar (ou limpar com o script) — dados reais não ficam nos
  EUA. ⏳ Autorização da Lúcia.
- [ ] **22.** **Anti-robôs** no `/diagnostico` (Turnstile) — antes de o ligar ao site.
- [ ] **23.** Segurança mínima de entrega: **R4 exportação dos dados de um cliente** (1–2 dias) e
  **MFA para admins** (R5a, 1–2 dias). O audit log (R5b) e o aceite dos termos ficam para o SaaS.
  ⏳ Confirmar com a Lúcia se entram na entrega.
- [ ] **24.** RGPD com a advogada: **pacote documental (R6)** e **DPA da Anthropic** — do lado da
  plataforma, só a política de privacidade com URL público. ⏳ Lúcia + advogada.

**Semana 6 (10–14/11) — documentação e entrega**
- [ ] **25.** **Guia da plataforma** completo: integrações (SMTP, pasta, IA, WhatsApp, Vercel,
  Supabase) e prints atualizados (Empresa, Obrigações, Reservas, portal do cliente).
- [ ] **26.** **Domínio próprio** e **e-mail (SMTP)**: configurar na Vercel e nos DNS se o acesso
  chegar a tempo; senão, fica documentado o que falta. ⏳ I Love Design.
- [ ] **27.** Relatório fiscal **detalhado/resumido PT** se a Lúcia tiver trazido o formato;
  senão, passa para depois. ⏳
- [ ] **28.** **Sessão de entrega** com a Lúcia: percorrer o guia, as decisões tomadas, o que ficou
  para depois e o modelo de suporte da pausa. Fechar o BACKLOG: tudo o que sobrar vai para
  "Depois da entrega".

**Depois da entrega (não contam para novembro)**
App nativa (Capacitor) · integração de calendários / agendamento do diagnóstico · Instagram
(API da Meta) e analytics Meta/Google · WhatsApp (integração) · IA nas transcrições · glossário,
FAQ e ícones (i) · lançamento dividido, anotações e break-even no Planeamento, PDF dos
gráficos, reserva pessoal e painel de reservas · exportação no Excel da Lúcia · mapa da jornada
(documento) · perguntas do bloco 1 para negócio em curso · retirar `user_id` das tabelas ESG ·
audit log e aceite dos termos (SaaS) · consultoria de organização administrativa (quando a
Letícia desenhar o serviço).

---

## Itens de desenvolvimento

### Antes da pausa (prioridade da reunião de 25/09)

> *"Ajustar módulo ESG e revisar/simplificar a plataforma."* — o próximo passo definido na
> reunião. O desenvolvimento pausa agora e retoma no início do próximo ano; o objetivo é
> deixar tudo **redondo até ao fecho do contrato, em novembro**.

- [ ] **Simplificação — o que ficou da Fase 1 à espera de decisão**
  *Revisão de 01/10 · Resp.: Vinícius (com a Lúcia)*
  · **Papéis da equipa** (R-A4): o que vê a comercial e o que vê o marketing.
  · **Reserva de imposto** (resto do R-B5): sobre o resultado com ou sem o IVA por pagar; o
    "Total" de Reservas soma o ano com um mês.
  · **Calculadora de Preços** (R-B7): na sessão de revisão combinada a 01/10.
  · **Contabilidade → Clientes** (R-D7): retirar ou não.
  · Ainda sem decisão pendente: R-A5 (triagem no servidor); do R-B11, o prazo de pagamento nas
    mensagens de WhatsApp (confirmar com a Lúcia o dia de cada imposto) e os campos que gravam a
    cada tecla; do R-B10, os pontos de método (CO₂ total vs scopes, rotatividade, sinal do gap
    salarial, "não se aplica" na materialidade, nomes das fases).

- [ ] **Simplificação — Fase 2: uma ficha de cliente**
  *Revisão de 01/10 · Resp.: Vinícius*
  O cliente existe em sete sítios sem chave comum (R-C1). A ficha da Gestão passa a ser o
  cliente: contratos, consultorias, casos ESG e leads apontam para ela; fechar um lead ou criar
  uma conta cria-a; ecrã para juntar duplicados (a consulta de 30/09 é o ponto de partida). O
  perfil fiscal vive só na ficha (R-C2) e os serviços decidem a plataforma (R-C4). Um sítio para
  notas, mensagens, pagamentos e documentos (R-C5, R-C7, R-C8).
  ⚠️ **Depende de:** confirmar com a Lúcia que páginas do lado do cliente são usadas (uma página
  que ninguém usa sai em vez de ser corrigida).

### Ajustes da reunião de 08/10 (simplificar antes de os clientes testarem)

> *"Vinícius fará review geral das telas para simplificar."* — o próximo passo definido na
> reunião (com a Letícia). Prazo combinado para fechar os ajustes: **3 de novembro**.

- [ ] **Revisão geral ecrã a ecrã para simplificar a plataforma**
  *Reunião 08/10/2026 · Resp.: Vinícius*
  Prioridade acima dos testes com clientes. Feita sobre a Fase 2 da simplificação, com as
  anotações de design da Letícia (chegam por WhatsApp).

- [ ] **Validação visual com a Lúcia (semana de 13 a 17/10) e aplicação da identidade**
  *Reunião 08/10/2026 · material da Letícia 08/10 · Resp.: Vinícius (com a Lúcia e a Letícia)*
  Feito a 08/10: tema claro e noturno com a paleta oficial (verde #0E3D33/#184F43, bege
  #EAD8B7, creme #F8F1E4, dourado #C89B3C), títulos Archivo Black, corpo Arial Nova com
  Archivo de recurso; 47 cores antigas no código substituídas. Para validar: canvas com 6
  alternativas (A editorial creme, B clara, C verde profundo, D noturna, E revista, F dois
  tons) e o HTML único da plataforma com dados fictícios (`docs/validacao/…`, branch
  `identidade-visual`, `7025caa`). Decisões da sessão: alternativa escolhida, fonte do corpo
  (licença web da Arial Nova ou Archivo), modo noturno sim/não. Depois da validação: merge
  e, se a escolha for B/C/F, ajustar menu e cartões na revisão ecrã a ecrã (13-D).
  ⏳ **Depende de:** sessão de validação com a Lúcia.

### Ajustes da reunião de 01/10 (validação da jornada do cliente)

- [ ] **Dúvidas da etapa 1 para a Lúcia**
  *Teste 05/10/2026 · Resp.: Vinícius (com a Lúcia)*
  · Cliente novo: gerar o calendário só a partir de "cliente desde" (hoje Q1–Q3 nascem "em
    atraso")?  · Plataforma por omissão de um cliente novo: Lite (só informativa, como
    decidido a 25/09) ou completa?  · Onde o cliente muda a língua (um alemão vê PT)?
  · O cliente precisa de ver os relatórios trimestrais na plataforma já, ou chega o PDF?
  · O que da aba "Conta na plataforma" interessa à equipa (hoje mostra € 0 / € 565, onboarding
    1 de 6, clientes 0)?  · Admin a entrar cai na Contabilidade de demonstração e não na Gestão.

- [ ] **Aba de Marketing com a prévia do Instagram**
  *Reunião 01/10/2026 · Resp.: Vinícius*
  Prévia do feed, legenda, agenda de publicações e anotações partilhadas entre a Lúcia, a
  Letícia e a Nicole. Substitui a página de espera de Marketing (a revisão de 01/10 propunha
  retirá-la — R-D6 — mas passa a ter conteúdo). A integração de métricas Meta/Google continua
  um item à parte (Gestão interna).

- [ ] **Rever a Calculadora de Preços com a Lúcia**
  *Reunião 01/10/2026 · Resp.: Vinícius (com a Lúcia)*
  Base: R-B7 do Guia da plataforma — quatro definições de margem, reserva de IR somada ao
  preço, IVA por omissão pela língua, catálogo bruto/líquido. Fechar as regras na sessão e
  depois corrigir.

- [ ] **Completar o guia com as integrações**
  *Reunião 01/10/2026 · Resp.: Vinícius*
  O guia de 01/10 cobre a origem dos dados ecrã a ecrã; falta a parte das integrações para a
  equipa: e-mail (SMTP), pasta de documentos, relatório com IA, WhatsApp (só ligação com texto),
  alojamento (Vercel) e base de dados (Supabase, Frankfurt).

### Portal de gestão de clientes (documento de 22/09 — oficial desde 29/09)

> A antiga **v2** passou a ser a Gestão: Clientes, Agenda, Tarefas, Relatórios e Mensagens
> vivem dentro da plataforma, em endereços limpos (`/gestao/clientes`…), e leem e gravam no
> Supabase (migração 037). A vista do **cliente** continua a ser a v1 por agora.

- [ ] **Conferir as fichas dos clientes com a Lúcia**
  *Resp.: Vinícius (com a Lúcia)*
  A 037 foi aplicada e o portal publicado a 29/09. Falta passar ficha a ficha: nomes
  duplicados entre as contas e a lista antiga, contratos do Financeiro que não ficaram ligados
  a nenhum cliente (o painel de verificação da 037 mostra quantos), responsável, forma jurídica,
  regime e periodicidade — é o que decide o calendário fiscal.
  ↳ `supabase/consulta_clientes_duplicados.sql` (30/09, só leitura) lista os pares suspeitos
  — nome igual sem acentos, um nome que começa pelo outro, mesmo e-mail ou as duas primeiras
  palavras iguais — com o que cada ficha tem ligado e qual manter. A junção vem depois.
  ↳ **01/10:** apagar a **conta duplicada da Célia** na plataforma (pedido da reunião) — ver
  antes qual das duas tem lançamentos e obrigações, para não perder dados.

- [ ] **Validar o portal com a Lúcia e a Letícia e fechar as decisões em aberto**
  *Documento 22/09/2026 · Reunião 25/09/2026 · Resp.: Vinícius*
  ✔ 25/09: a v2 é a definitiva; a Letícia é **colaboradora, sem acesso ao financeiro interno**;
  o portal do cliente é **só informativo**. Decisões que o portal assume e que precisam de
  confirmação: (1) um cliente é **uma entidade da Gestão**, com ou sem conta; (2) o cliente vê
  **a mesma página sem as áreas internas** (quando o portal do cliente for ligado);
  (3) "Documentos em falta" = documentos **esperados por mês**; (4) "Em atraso" é **calculado
  pela data**, além de poder ser marcado; (6) listas de forma jurídica, regime e software;
  (7) os dados fiscais passam a ser mantidos pela equipa, não pelo cliente.
  ⚠️ **Depende de:** a revisão da Lúcia (com a Letícia) e a lista de campos que ela vai
  marcar para o portal do cliente.

- [ ] **Ligar o portal do cliente (a vista do cliente passa a ser a do portal)**
  *Documento 22/09/2026 · Resp.: Vinícius*
  As páginas já sabem mostrar a "área visível" (`modoCliente`), mas o cliente continua na v1:
  vê as obrigações (com o estado sincronizado), as mensagens no Início e a sua pasta de
  documentos. Falta: políticas de leitura do cliente nas tabelas novas, os relatórios
  trimestrais visíveis (hoje "enviado" quer dizer que a Lúcia exportou o PDF e o mandou), e
  decidir o que sai da v1 quando o portal entrar.
  Inclui os dois itens absorvidos na revisão de 29/09:
  · **Guião de reunião na ficha do cliente** *(23/07)* — roteiro base (data, tema, próximos
    passos, diagnóstico) ao criar um registo nas Notas internas.
  · **Níveis de acesso conforme o serviço contratado** *(18/09 — definição da Lúcia)* — o que
    cada cliente vê depende do que comprou.
  ⚠️ **Depende de:** a validação acima.

- [ ] **Um só cliente para Financeiro, Consultorias e ESG**
  *Resp.: Vinícius*
  A 037 liga os contratos do Financeiro ao cliente (a avença aparece na ficha, só de leitura).
  Falta o mesmo para as Consultorias e os casos ESG, e retirar a lista de Contabilidade →
  Clientes da conta da Lúcia, que a 037 copiou para o portal. Faz parte da simplificação.

### Estrutura de serviços (prioridade da reunião de 10/09)

> *"Vinícius monta primeira versão da aba de serviços e onboarding básico."* — o próximo
> passo definido na reunião. A ideia estruturante: **separar a gestão interna dos serviços**.
> A gestão (clientes ativos, CRM, marketing, acessos) é como a Lúcia trabalha; os serviços
> (consultorias, contabilidade, ESG) são o que ela vende.

- [ ] **Consultoria de organização administrativa — estrutura e formulário**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Serviço novo, **gratuito no arranque**, liderado pela Letícia. Precisa do mesmo tratamento
  que a consultoria da IHK: blocos, formulário e relatório.
  ⚠️ **Depende de:** o conceito do serviço, que a Letícia vai desenhar com a Lúcia.

- [ ] **Relatório fiscal em duas versões: detalhada e resumida**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Cada relatório mantém **uma língua só** (decisão da reunião). O EÜR alemão já existe; falta
  o equivalente português e o corte entre as duas versões.
  ⚠️ **Depende de:** a Lúcia investigar o formato e a apresentação exigidos em Portugal.

### ESG (prioridade da reunião de 18/09)

> *"Vinícius envia proposta de estrutura ESG até o fim de semana."* — o próximo passo
> definido na reunião. A ESG fica **módulo separado**, mas com acompanhamento individual
> por cliente; e o preenchimento da consultoria ESG é **uso interno da Lúcia** — o cliente
> não entra lá para responder.

- [ ] **Retirar `user_id` das quatro tabelas ESG** (migração posterior)
  *Achado 19/09 · Resp.: Vinícius*
  A 036 deixou a coluna antiga em paz de propósito. Quando o modelo por casos tiver dado a
  volta com dados reais, sai numa migração própria — e o `scripts/seed_demo_esg.mjs`, que
  ainda grava por `user_id`, passa a criar o caso.

### Consultoria — módulo novo (prioridade da reunião de 13/08)

- [ ] **Remover perguntas/itens não desejados do fluxo de consultoria**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  A estrutura já foi desenhada para isto: as perguntas vivem em
  `src/data/consultoriaBlocos.js` e remover não perde respostas.
  ⚠️ **Depende de:** a Lúcia indicar quais — e dos **8 passos da metodologia do mentor
  Luís** que ela ficou de enviar a 25/09, que podem mudar a estrutura toda e não só tirar
  perguntas. Convém ver os dois juntos.

### Cybersecurity e Compliance (auditoria de 21/08 — pedido da Lúcia)

> Relatório completo: `docs/auditorias/2026-08-21-seguranca-gdpr.md`. Ordem de ataque:
> primeiro os ⚡, depois a infraestrutura (região/ambientes/backups), depois direitos e
> rasto (exportação, MFA, audit), com o pacote documental em paralelo com a advogada.

- [ ] **⚡ Tirar o `.env.local` (service_role) da pasta sincronizada com o OneDrive**
  *Auditoria 21/08/2026 · Resp.: Vinícius*
  A chave está fora do Git mas é copiada para a nuvem da Microsoft a cada gravação. Mover o
  projeto para fora do sincronizador, ou excluir o ficheiro da sincronização.

- [ ] **Limpar os dados reais do projeto antigo (us-west-2), agora DEV**
  *Migração 24/08/2026 · Resp.: Vinícius*
  Apagar utilizadores reais e dados no projeto antigo, manter/criar contas de teste. Dados
  reais não ficam a viver nos EUA.
  **Script pronto:** `scripts/migracao/5-limpar-dev.mjs` — corre em simulação por omissão,
  recusa-se a apontar à produção, faz backup local antes de apagar e só apaga com
  `--confirmar`.
  ⚠️ **Bloqueado (09/09):** o anfitrião `wefdhqurbdvsmzmtweno.supabase.co` **deixou de
  resolver** — o projeto está suspenso (plano gratuito, por inatividade) ou já foi removido.
  Enquanto assim estiver, não dá para limpar nem para confirmar o que lá está. Ver no painel
  do Supabase: se estiver suspenso, ou se retoma para correr o script, ou se **elimina o
  projeto inteiro** — que resolve o mesmo de forma mais definitiva.
  ⚠️ **Depende também de:** autorização da Lúcia (é destrutivo sobre dados reais).

- [ ] **Proteção anti-robôs no formulário público**
  *14/09/2026 · Resp.: Vinícius*
  Com a migração 032 aplicada, o `/diagnostico` está **a gravar a sério**. Hoje só tem uma
  armadilha simples (um campo escondido que os humanos não preenchem): chega para robôs
  comuns, não chega para quem insista. Enquanto o endereço não for divulgado o risco é baixo;
  **antes de ser ligado ao site da Lúcia** convém decidir entre um Cloudflare Turnstile (sem
  puzzles para o utilizador) ou um limite por IP numa função serverless.
  ↳ Qualquer enchente entra na tabela `diagnostico_submissoes`, não no CRM — o filtro protege
  o CRM, mas a lista de diagnósticos ficaria poluída.

- [ ] **Aceite dos termos de uso**
  *Reunião 10/09/2026 · Resp.: Vinícius + advogada*
  Quando a plataforma for vendida como SaaS, o cliente tem de aceitar os termos — com registo
  de quem aceitou, quando e que versão. Anda a par do R6 (pacote documental).

- [ ] **R4 · Exportação completa dos dados de um cliente (art. 20 — portabilidade)**
  *Auditoria 21/08/2026 · Resp.: Vinícius*
  Endpoint admin que junta as 15 tabelas + lista de documentos num ZIP/JSON. Hoje só o Livro
  de Caixa sai em CSV. 1–2 dias.

- [ ] **R5a · MFA/2FA (TOTP) com o Supabase Auth**
  *Auditoria 21/08/2026 · Resp.: Vinícius*
  Suportado nativamente; falta a interface de inscrição/verificação e a política (obrigatório
  para admins, opcional para clientes). 1–2 dias.

- [ ] **R5b · Audit log — quem acedeu ou alterou o quê**
  *Auditoria 21/08/2026 · Resp.: Vinícius*
  Tabela `audit_log` com triggers nas tabelas sensíveis (quem, quando, o quê, valor
  anterior) + registo do "ver como" quando a administradora entra na conta de um cliente.
  2–3 dias.

- [ ] **R6 · Pacote documental RGPD** *(com a advogada)*
  *Auditoria 21/08/2026 · Resp.: Lúcia + Vinícius*
  Política de privacidade, registo de tratamento, política de retenção/eliminação (incluindo
  os registos com `user_id = null`), procedimento de data breach (72 h), e DPA/AVV dos três
  suboperadores: Supabase, Vercel e Anthropic (todos têm DPA publicados). Absorve o item
  antigo `docs/SEGURANCA_DADOS.md` da secção Documentação.

- [ ] **IA e RGPD: DPA com a Anthropic + menção na política de privacidade**
  *Auditoria 21/08/2026 · Resp.: Lúcia + Vinícius*
  O relatório de consultoria envia a ficha do cliente à API da Anthropic (EUA). Para SaaS:
  DPA assinado, constar do registo de tratamento, e avaliar residência de inferência na UE
  quando disponível no plano.

### Achados durante o desenvolvimento

- [ ] **Perguntas do bloco 1 assumem que o negócio ainda não abriu** — *"Quando quero iniciar
  a atividade?"*, *"Em que localização quero começar?"*. Para quem já fatura, leem-se mal.
  Hoje a ficha **avisa** quando o Bloco 0 diz que já iniciou, mas não adapta as perguntas.
  Avaliar uma variante do bloco 1 para negócio em curso.
  *13/08/2026 · Resp.: Vinícius*

### QA de interface — achados de 13/08

> Da auditoria automática + inspeção das 48 capturas (16 ecrãs × 3 tamanhos), em produção com
> a conta de demonstração. Relatório completo: `docs/auditorias/2026-08-13-interface.md`.
> Severidade: 🟠 atrapalha · 🟡 incomoda · 🔵 oportunidade. Zero bloqueadores.

- [ ] **🟠 Subir os textos abaixo de 12px** — 36 elementos só no Painel. Progresso na 2ª
  revisão de design (25/08): brand da sidebar 9→10px, rótulos de secção 10→11px, números dos
  blocos 9→11px, "Nasce de" 9.5→11px, labels de formulário 10.5→11px. Resta a varredura
  completa (legendas de gráficos, eixos da materialidade, microtextos dos cartões). Regra
  acordada: ≥12px para texto informativo; 11px só para maiúsculas espaçadas (eyebrows).
  *QA 13/08/2026 · Revisão design 25/08 · Resp.: Vinícius*

- [ ] **🔵 Trocar emojis por ícones SVG nos botões de ação** — 📄/🖨/⚡/✨ na Conciliação,
  EÜR e Relatório de consultoria destoam dos SVGs da navegação. Usar o mesmo set da sidebar.
  Classificado "quando der" na revisão de design de 25/08 (T7, baixa).
  *Revisão design 25/08/2026 · Resp.: Vinícius*

- [ ] **🟠 Associar rótulos aos campos de formulário** — 36 ocorrências, incluindo o login.
  Sem `label for`/`aria-label`, o leitor de ecrã não liga rótulo a campo e tocar no texto não
  foca o campo.
  *QA 13/08/2026 · Resp.: Vinícius*
- [ ] **🟡 Matriz de materialidade no fim da página no telemóvel** — é preciso passar pelos 16
  temas (~9.000 px) para a ver. No computador está fixa à direita. É o resultado da página.
  *QA 13/08/2026 · Resp.: Vinícius*
- [ ] **🟡 Alvos de toque abaixo de 44×44 px** — os piores foram corrigidos a 27/08 (o
  "Mostrar" da palavra-passe passou de 42×17 para 52×38 no login e na definição de senha; os
  botões de linha dos Acessos para 34×34). Falta a varredura das restantes ocorrências.
  *QA 13/08/2026 · Parcial 27/08 · Resp.: Vinícius*
- [ ] **🔵 Livro de Caixa sem paginação** — com os 30 lançamentos da conta demo a página tem
  ~8.000 px no telemóvel. Com um ano real de dados, será várias vezes isso.
  *QA 13/08/2026 · Resp.: Vinícius*

### Internacionalização

*(secção vazia — ver Concluídos)*

### CRM e prospeção

### Onboarding e primeiro acesso

### Usabilidade e compreensão

- [ ] **Adicionar ícone informativo (i) nos termos técnicos, como regime de IVA**
  *Reunião 06/08/2026 · Resp.: Vinícius*
  Já existe um `InfoTooltip` no projeto (usado no Livro de Caixa) — estender aos termos
  fiscais em Empresa, Dashboard e Rücklagen.

- [ ] **Criar glossário/base de conhecimento e eventual FAQ na plataforma**
  *Reunião 06/08/2026 · Resp.: Vinícius*
  Complementa os ícones informativos: explicação longa dos termos num sítio próprio.

### Consultoria e jornada do cliente

- [ ] **IA nas transcrições de reunião**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  Resumo + próximos passos com datas + checklist para o cliente. Princípio
  **human-in-the-loop**: a IA propõe, a Lúcia valida (*"eu não quero que seja tudo automatizado"*).

- [ ] **Mapear a jornada do cliente (documento, antes de automatizar)**
  *Reunião 30/07/2026 · Resp.: Vinícius*
  Instagram/formulário → filtro quente/frio → primeiro contacto → **diagnóstico de 20 min** →
  serviço. *"O meu receio é dispersar... que façamos isto de uma forma organizada."*

- [ ] **Agendamento do diagnóstico inicial (20 min) a partir do formulário**
  *Reunião 30/07/2026 · Resp.: Vinícius*

### Contabilidade

- [ ] **Lançamento dividido (split) no Livro de Caixa**
  *Imagens de referência de 20/08 · Resp.: Vinícius*
  A ferramenta anterior da Lúcia permite dividir um lançamento (ex.: 590 € = 315 € + 275 €,
  cada parte com a sua taxa). Não foi pedido expressamente, mas está no fluxo dela — confirmar
  se precisa antes de construir.

- [ ] **Campos de anotações amplas no Planeamento e nas Previsões**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  Notas internas abaixo de cada item, para ela registar contexto junto dos números.

- [ ] **Indicador de break-even também no Planeamento Mensal**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  Quanto falta faturar para cobrir os custos — no rodapé dos totais. A análise de break-even
  **já existe no Painel** (revisão de 29/09); falta mostrá-la aqui, onde ela planeia.

- [ ] **Exportação em PDF e rótulos de valores nos gráficos do painel**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  Visibilidade mensal: valores visíveis nos gráficos sem passar o rato, e painel exportável.

- [ ] **Reserva pessoal na página da Empresa**
  *Anotações anteriores · Resp.: Vinícius*
  Quanto o empresário quer reservar para si, à semelhança da reserva de IR. Não confundir
  com os movimentos privados do Livro de Caixa (*Privatentnahme/Privateinlage*), que já
  existem — isto é uma **meta de reserva** configurável.

- [ ] **Painel consolidado de reservas no Dashboard**
  *Anotações anteriores · Resp.: Vinícius*
  IVA + IR + pessoal numa lista expansível (recolhida por omissão). Hoje o IVA e a reserva de
  IR já aparecem, mas em cartões separados e sem a reserva pessoal.

- [ ] **Limite de faturação (Portugal)**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  O limite já é editável manualmente, mas só existe na versão alemã (Familienversicherung).
  Falta o equivalente português e o rótulo por país.
  ⚠️ **Depende de:** a Lúcia confirmar as regras em Portugal.

### Gestão interna

- [ ] **Hospedar a plataforma no domínio próprio da Lúcia**
  *Reunião 27/08/2026 · Resp.: Vinícius*
  Sair do domínio da Vercel e servir a plataforma a partir do domínio do site dela — é o que
  dá ao produto o ar de casa própria perante os clientes alemães. Do nosso lado é configurar o
  domínio na Vercel e os registos DNS.
  ⚠️ **Bloqueado:** a Lúcia tem de obter, com a empresa alemã que fez o site, o acesso às
  configurações de domínio.

- [ ] **Exportação no formato do Excel da Lúcia**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  Para o que ela já entrega ao contabilista/IRS.
  ⚠️ **Depende de:** o ficheiro Excel que a Lúcia vai enviar.

- [ ] **Integração de analytics de marketing (Meta / Google) na página de Marketing**
  *Reunião 30/07/2026 · Resp.: Vinícius*
  Mantém os dados retidos na base da Lúcia mesmo que ela troque de fornecedor. A alinhar com
  o Filipe; a página placeholder já existe.

---

## Validações técnicas

- [ ] **Testar a jornada do cliente em três etapas**
  *Reunião 01/10/2026 · Resp.: Vinícius*
  1) teste interno com uma conta de teste própria, para encontrar erros; 2) com a conta da
  Nicole; 3) com uma cliente externa (Vânia). Ajustar o que aparecer em cada etapa.
  ✔ **Etapa 1 feita a 05/10** em produção, com ficha e conta de teste →
  `docs/auditorias/2026-10-05-jornada-etapa1.md` (20 passos, 7 erros, 10 dúvidas). Os erros
  estão no item "Correções da etapa 1" abaixo; a etapa 2 (Nicole) só depois de os corrigir.
  Ficaram por testar: "+ Nova Obrigação" do cliente e a verificação de permissões na base
  (leitura direta à produção bloqueada nesta sessão — fazer em DEV ou com autorização).

- [ ] **Erro de certificado SMTP no Outlook (envio de e-mails)**
  *Reunião 01/10/2026 · Resp.: Vinícius*
  Investigar o erro e contactar a I Love Design (com a Lúcia em cópia), que gere o domínio.
  ⚠️ **Depende de:** a Lúcia encaminhar o contacto da I Love Design e dar acesso ao Outlook.

- [ ] **Validar o mapeamento de colunas da importação com extratos reais de vários bancos**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  A deteção automática de formato já está construída (separador, decimais, débito/crédito,
  cabeçalho deslocado) e testada com extratos sintéticos PT/DE/EN — falta validá-la contra
  ficheiros reais.
  ⚠️ **Depende de:** os exemplos de CSV bancário que a Lúcia vai enviar.

- [ ] **Integração de calendários (Outlook e Google, ou via Calendly)**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Para o agendamento sair do vaivém de mensagens. Decidir entre integrar as APIs diretamente
  ou apoiar-se numa ferramenta já feita — a segunda hipótese entrega mais depressa e é
  reversível.
  ↳ Liga-se ao **agendamento do diagnóstico de 20 min** (secção Consultoria e jornada).

- [ ] **Aplicação nativa (Android e iOS) — Capacitor, por fases**
  *Reunião 10/09/2026 · atualizado 16/09/2026 · Resp.: Vinícius*
  Autorização para a Play Store obtida (App Store em curso). Caminho recomendado:
  **Capacitor** — o mesmo `dist/` do Vite dentro de uma casca nativa, sem segundo código.
  As fases, cada uma entregável por si:
  1. ~~**Base web (pré-requisito).**~~ **Feita a 16/09** — ver em Concluídos.
  2. **Android.** Gera o `.aab` e vai para a loja. O login é email+palavra-passe
     (`signInWithPassword`), sem redirecionamentos OAuth, por isso não precisa de *deep links*.
  3. **iOS.** Requer Mac com Xcode — o ambiente atual é Windows; ou máquina Apple ou build
     na nuvem. A Apple rejeita cascas puras (diretriz 4.2), por isso a fase 4 é obrigatória aqui.
  4. **O que justifica a app:** câmara para fotografar faturas direto no envio de documentos,
     notificações push das mensagens e das obrigações fiscais, biometria no login.
  ⚠️ **A tratar antes de publicar:** política de privacidade com URL público e o formulário
  *Data Safety* da Play — a app toca em documentos fiscais de clientes (RGPD).

- [ ] **Investigar viabilidade e custos da integração do Instagram (API da Meta) para captura de leads**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  A API mudou recentemente; validar antes de prometer prazo. Inclui a importação dos ~250
  contactos existentes, com triagem manual pela Lúcia, e a mensagem inicial de abordagem.
  ⚠️ **Depende de:** a Lúcia vai apurar com o Filipe como fazer chegar o formulário/mensagem
  aos leads do Instagram (27/08).

---

## Adiados — retomar depois da pausa

> Itens que continuam a fazer sentido mas que uma reunião mandou esperar. Não contam para o
> trabalho até novembro.

- [ ] **Testar a integração com o WhatsApp (cliente básico / número de telefone)**
  *Reunião 18/09/2026 · Resp.: Vinícius*
  Primeiro teste para perceber o que é viável antes de prometer automações. Liga-se à
  conversa sobre suporte contínuo e histórico de consultorias, deixada para novembro.
  ↳ **25/09: fica em segundo plano** — a integração pela Meta é trabalhosa. Os modelos de
  WhatsApp da v2 (abrir o WhatsApp com o texto pronto) cobrem o essencial sem integração.

---

## Diretrizes de produto (das reuniões — guiam a priorização)

- **Reunião de 08/10** (com a Letícia): **simplificar os ecrãs antes de pôr clientes a
  testar**. A página inicial terá **visão interna e visão geral**; a página do cliente fica
  **mais enxuta**, **sem valores e sem documentos por enquanto**. A comunicação continua
  **copiável para WhatsApp**. A **Letícia passou a administradora** (feito na reunião — revê a
  decisão de 25/09 de a manter colaboradora sem financeiro; fecha o R-A4 por agora) e envia
  sugestões de forma **assíncrona** pelo WhatsApp, sem reunião recorrente. O Vinícius **pode
  absorver a gestão do site, e-mail e landing page** da Lúcia, unificando a identidade visual
  — a Letícia vai falar com a Lúcia sobre transferir o contrato atual. Prazo para fechar os
  ajustes: **3 de novembro**.
  Riscos: progresso abaixo do esperado para o prazo; excesso de funcionalidades a poluir a
  plataforma; e-mail/site por resolver pode atrasar o go-live; depende da Lúcia definir a
  identidade visual e o contrato do site/e-mail.

- **Reunião de 01/10:** fase de **validação** — testar a jornada do cliente e aplicar os
  ajustes. **Contabilidade e gestão interna ficam na mesma plataforma** por agora (versão Pro
  já paga); a separação num produto de licença com domínio próprio fica para o futuro (risco de
  retrabalho se o desenho atual não a previr). **Notificações por WhatsApp ficam para depois**:
  a plataforma só gera a mensagem para copiar e enviar. As **vendas** são feitas pela Lúcia e
  pela Letícia (social selling no Instagram e diagnósticos gratuitos de 15 min), sem
  departamento comercial externo. A aba de Marketing é partilhada pelas três da equipa.
  Riscos: dependência da I Love Design (domínio/DNS) para o e-mail; agenda carregada de
  outubro a dezembro.

- **Reunião de 25/09:** a **v2 do portal de clientes será a definitiva**, com poucos ajustes; o
  **portal do cliente fica só informativo** (obrigação, data, período, estado da entrega —
  sem valores). A **Letícia mantém o perfil de colaboradora**, sem acesso ao financeiro
  interno. **Prioridade ao diagnóstico ESG**, onde a Lúcia vai registar o resumo das reuniões
  e traçar os próximos passos. A **integração com o WhatsApp fica em segundo plano**.
  O desenvolvimento **pausa agora e retoma no início do próximo ano** (pensar num ciclo de
  três meses); o contrato inclui **dois anos de suporte** para correções e melhorias pontuais,
  e há a possibilidade de um suporte de ajustes a valor reduzido durante a pausa. Objetivo:
  tudo redondo até ao fecho do contrato, em novembro.

- **Reunião de 18/09:** a **ESG mantém-se módulo separado**, mas com visualização e
  acompanhamento **individual por cliente**. O preenchimento da consultoria ESG é **uso
  interno da Lúcia** — apoio ao trabalho dela, sem o cliente entrar para responder. No CRM,
  a entrada de leads fica **manual** (botão "juntar ao CRM"), de propósito, para evitar
  registos indevidos. O **contrato é válido até 14 de novembro**, com pausa em dezembro e
  retoma em fevereiro; o modelo de suporte contínuo e as automações (WhatsApp, histórico de
  consultorias) ficam para discutir nessa altura.

- **Reunião de 10/09:** a plataforma passa a ter duas metades claras — **gestão interna**
  (clientes ativos, CRM, marketing, acessos) e **serviços** (consultorias, contabilidade, ESG).
  **Todos os clientes** terão acesso básico, mesmo os que só compram consultoria: a plataforma
  é o canal de comunicação (contrato, documentos, notificações). Nasce um serviço novo —
  **consultoria de organização administrativa**, gratuita no arranque, liderada pela Letícia,
  que passa a ter acesso à gestão e ajuda a testar. O **relatório fiscal** terá versão
  detalhada e resumida, cada uma numa língua só. A **ESG** ganha visualização própria,
  mantendo a estrutura por fases. Quando for vendida como SaaS, entra o **aceite dos termos**.

- **Reunião de 27/08:** os contactos das consultorias passam a alimentar o CRM automaticamente,
  e o **formulário de qualificação funciona como filtro** — o lead só entra no CRM depois de
  qualificar. O formulário migra do JotForm para a plataforma, que por sua vez passa a viver no
  **domínio próprio** da Lúcia. O **modelo de suporte recorrente** e as melhorias posteriores ao
  período incluído ficam para definir **em novembro, presencialmente** (viagem ao Brasil). Está
  em aberto **adaptar a plataforma ao Brasil** com um contabilista parceiro certificado, e um
  **novo ciclo de desenvolvimento a partir de março** (3 ou 6 meses). O Wesley (utilizador
  alemão) poderá entrar numa reunião futura para dar o seu retorno.

- **Reunião de 20/08:** performance/carga **não é preocupação agora** — ajustar módulos
  específicos só se surgirem problemas. Relatórios podem sair em **PDF ou com acesso limitado
  à plataforma** para clientes. Desenvolver primeiro **para o caso da Célia**, mas já pensando
  em algo **replicável** (Daniela, Nádia, catering). Ajustes **iterativos**, refinando prompt e
  template conforme o feedback da Lúcia; avisar por WhatsApp quando houver alterações grandes.

- **Foco atual (13/08):** **módulo de consultoria** e **importação de extrato**. A Lúcia começa
  a usar a consultoria com clientes **em setembro** — é o prazo real, antes do fim do projeto.
- **Extrato por ficheiro (CSV/Excel), não integração bancária direta** — decisão de 13/08.
- **Na consultoria, a Lúcia é a administradora**: regista o contacto/lead sem criar conta ao
  cliente; o relatório sai em **PDF** para entregar.
- **SWOT e TOWS** substituem "chances e riscos" no diagnóstico de consultoria.
- **Links, não ficheiros pesados** — vídeos, comunidade, Instagram e contactos entram como link.
- **Material da Câmara de Comércio alemã é referência, não cópia.**
- **Foco anterior (30/07):** *"CRM e consultoria"*. A contabilidade
  *"está excelente como está, é só corrigir o português"*.
- **Manter a plataforma o mais simples possível** — conselho que a Lúcia recebeu e repete.
- **Saídas descritivas, não analíticas** — comparativos ano a ano; a análise fica com ela.
- **KPIs alinhados à priorização da matriz de dupla materialidade.**
- **Projetos ESG entram no relatório com impacto ambiental, social *e* financeiro/payback** —
  *"nenhum administrador implementa se não vir benefício"*.
- **Módulo de gestão é apenas administrativo/interno**; clientes acedem só a contabilidade e
  ESG, e apenas aos seus próprios dados.
- **Foco comercial nas fases de negociação e no histórico de perdas**, não só nos fechados.
- **Priorizar o nicho da construção**, tanto em contabilidade como em ESG.
- **IA/automação só para tarefas que não agregam valor** — preservar a interação humana
  (*human-in-the-loop*).
- **Centralizar informação na plataforma**, com exportação em formatos padronizados.
- **Testar módulos premium bloqueados** para gerar upsell de consultorias.
- **Revisão de nomenclatura (PT-PT / DE / EN) é da Lúcia** — ela revê e envia-nos as correções.
- **Contínuo:** corrigir bugs e ajustes menores encontrados no uso; recolher feedback de quem
  está a testar.
- **Performance:** já feito o code splitting (arranque −43%); avaliar o plano pago do Supabase
  se os *cold starts* incomodarem nas demonstrações.

**Riscos e dependências**

- ⚠️ Regras fiscais alemãs (IVA, reservas) precisam de validação por especialista — o
  programador não domina o tema. Reforça a importância do aviso de valores estimados.
- ⚠️ Poucos utilizadores no dia a dia dificulta encontrar problemas de usabilidade.
- ⚠️ Inputs 100% manuais podem limitar o valor percebido e gerar erros de entrada.
- ⚠️ As 28 perguntas do diagnóstico ESG aguardam validação do mentor economista e do professor
  (~80% consideradas corretas).
- ⚠️ Website/domínio parado desde março por falta de envio de informações aos fornecedores.
- ⚠️ Cronograma dependente da disponibilidade da Lúcia.
- ⚠️ **(13/08)** O prazo de novembro pode ser insuficiente para robustecer a solução.
- ⚠️ **(13/08)** Questões legais/fiscais e de proteção de dados, agravadas por serem **dois
  países** — liga-se ao `docs/SEGURANCA_DADOS.md` e à decisão de backup.
- ⚠️ **(13/08)** Custos adicionais com servidor seguro podem afetar a continuidade.
- ⚠️ **(13/08)** Excesso de ideias sem foco pode atrasar a entrega e a monetização.
- ⚠️ **(10/09)** Os requisitos legais de proteção de dados para vender como SaaS ainda não
  foram investigados a fundo — liga-se ao R6 e ao aceite dos termos.
- ⚠️ **(10/09)** Os contratos dos clientes novos dependem da advogada.
- ⚠️ **(10/09)** Continua por confirmar se o cliente Luiz conseguiu entrar na plataforma.
- ⚠️ **(27/08)** Dependência de terceiros para avançar: a empresa alemã do site (acessos ao
  domínio) e o Filipe (integrações e formulários). Dois dos itens novos ficam bloqueados por isto.
- ⚠️ **(27/08)** A adaptação fiscal ao Brasil depende de encontrar um contabilista certificado
  parceiro — sem isso, não há como validar as regras.
- ⚠️ **(27/08)** Dispersão de ferramentas e leads por vários canais pode atrasar a consolidação
  no CRM.
- ⚠️ **(27/08)** O período de suporte incluído pode terminar sem modelo de recorrência definido.
- ⚠️ **(18/09)** O desenvolvimento pode não estar concluído até ao **fim do contrato, a
  14/11** — e a pausa de dezembro empurra o que sobrar para fevereiro.
- ⚠️ **(18/09)** O **âmbito da ESG está em expansão constante**, com risco de retrabalho.
- ⚠️ **(25/09)** Prazo apertado até novembro para deixar a plataforma bem alinhada.
- ⚠️ **(25/09)** A **complexidade da plataforma pode afastar os clientes finais** — motivo da
  revisão e simplificação.
- ⚠️ **(25/09)** Dependência de suporte depois do contrato e **insegurança da Lúcia em operar
  sozinha** — motivo da documentação de origem dos dados.
- ⚠️ **(25/09)** O sucesso do **piloto ESG** nos próximos três meses decide se vira contrato
  recorrente.
- ⚠️ **(18/09)** Incerteza sobre a adesão dos clientes às licenças da plataforma.
- ⚠️ **Não há ambiente de staging** — o `.env.local` aponta para o Supabase de produção. Testar
  escrita significa escrever na base real dos clientes; o QA de 13/08 correu só em leitura.

---

## Concluídos

### Início da equipa, modo apresentação e mensagem de boas-vindas — 10/10

- [x] **Página inicial interna da equipa** *(reunião 08/10 · Resp.: Vinícius)*
  ✔ Gestão → Início, onde a equipa passa a entrar depois do login: tarefas para hoje (as minhas
  ou da equipa), obrigações em atraso e nos próximos 7 dias, documentos em falta por cliente,
  relatórios do trimestre por fazer, mensagens dos clientes por ler e as horas de hoje, cada
  indicador com atalho. O admin deixa de cair na Contabilidade de demonstração.
- [x] **Ocultar dados ao iniciar uma consultoria com o cliente** *(reunião 08/10 · Resp.: Vinícius)*
  ✔ Botão "Modo apresentação" na consultoria: esconde as notas internas, o CRM, o tipo e o estado
  da consultoria, a volta à lista e o menu lateral (que mostra os outros clientes). Uma barra
  discreta em cima volta ao normal. Mantém-se ao recarregar a página.
- [x] **Rever a comunicação de entrega das credenciais** *(ponto 16 · Resp.: Vinícius)*
  ✔ Ao criar uma conta ou redefinir a palavra-passe, aparece a mensagem de boas-vindas pronta
  (endereço, e-mail, palavra-passe temporária, aviso de troca no primeiro acesso), em português,
  alemão ou inglês — alemão por omissão para clientes da Alemanha — com "Copiar", "Abrir no
  WhatsApp" e "Abrir num e-mail".

### Página inicial do cliente e Horas da equipa — publicadas 10/10 (migrações 040 e 041)

- [x] **Página inicial do cliente mais enxuta — sem valores** *(reunião 08/10 · Resp.: Vinícius)*
  ✔ Mensagens da equipa, as 3 próximas obrigações, documentos pedidos no mês, último relatório
  enviado e "Pendente da sua parte" (documentos em falta, obrigações à espera de documentos,
  mensagens por ler). Saiu o valor da avença; o link do contrato ficou. Migração 040: o cliente
  lê os relatórios da sua ficha marcados como enviados.
  ↳ A confirmar com a Lúcia: "remover documentos" foi lido como tirar o envio de ficheiros da
  página inicial — a lista do que falta ficou.
- [x] **Horas da equipa por cliente ou atividade (relógio de ponto)** *(mensagem da Letícia 09/10 ·
  Resp.: Vinícius)*
  ✔ Gestão → Horas: registo do dia por cliente ou atividade (sem horários), totais de hoje,
  semana e mês por pessoa ou equipa, o mês por cliente/atividade com as horas incluídas da ficha,
  lista de registos com apagar. Migração 041: um registo pode ter uma atividade em vez de cliente.
  ↳ Para a Letícia confirmar: a lista de atividades e se cada colaboradora vê só as suas horas.

### Resumo da ficha do cliente sem "Documentos em falta" e "Valor a pagar" — 10/10

- [x] **Retirar os blocos "Documentos em falta" e "Valor a pagar" do Resumo da ficha** *(pedido do
  Vinícius, 10/10 · Resp.: Vinícius)*
  ✔ Saem da ficha, na visão da equipa e na do cliente. Ficam "Próxima obrigação" e "Último
  relatório". Os documentos continuam no separador Documentos e na coluna Atenção da lista;
  os valores, nas Obrigações.

### "Ver como o cliente" na ficha — 09/10

- [x] **Recriar a visão do cliente: botão para alternar entre visão interna e visão do cliente**
  *Reunião 08/10/2026 · Resp.: Vinícius*
  ✔ Na ficha de um cliente com conta, a administradora carrega em "Ver como o cliente" e entra
  na conta dele em só leitura, na página que ele vê ao entrar. A barra de cima passa a dizer
  "Voltar à ficha" e regressa à ficha. Sem conta, o botão aparece desativado com a explicação.
  Verificado com dados fictícios.

### Documentos pedidos visíveis ao cliente — 06/10

- [x] **O cliente vê no Início e em Dados da Empresa → Documentos os pedidos do mês** (tipo ·
  estado) e "Faltam N documentos". Migração 039 aplicada (leitura da própria ficha e dos
  pedidos); branch `jornada-docs-cliente` junta a `main`.

### Correções da etapa 1 do teste da jornada — 06/10

- [x] **Sete correções publicadas** *(Resp.: Vinícius)*
  · Criar ficha grava o calendário (o `id` vai no insert).
  · Abrir a ficha pelo endereço ou F5 espera pelos dados em vez de voltar à lista.
  · "Guardar e marcar como enviado" grava o "enviado" no próprio upsert.
  · "+" das horas nasce vazio: sem horas escritas não regista nada.
  · Saudação "Olá, {primeiro nome}" (neutra, com o nome do perfil; sem ele, a empresa);
    "Ainda não foi enviado nada" em vez de "enviaste".
  · "Eliminar ficha" em Dados do cliente, só admin, a escrever o nome para confirmar.
  · Eliminar uma conta desliga primeiro as obrigações da ficha (`user_id` a null) em vez de
    as apagar em cascata.
  Verificadas em produção com uma ficha de teste, criada e eliminada pelo botão novo. Pelo
  caminho, ≈10 min com o admin a cair em "user" (leitura de `profiles` com coluna
  inexistente) — corrigido em `6ebc100`.

### Migração 038 e publicação da Fase 1 — 05/10

- [x] **Aplicar a migração 038 e publicar a Fase 1 da simplificação** *(Resp.: Vinícius)*
  A 038 foi aplicada a 05/10 e a branch `simplificacao-fase1` (Fase 1 + dezasseis acertos) foi
  junta a `main` e publicada.

### Dezasseis acertos rápidos — 01/10 *(na branch `simplificacao-fase1`, até à 038)*

- [x] **Da reunião de 01/10** *(Resp.: Vinícius)*
  · Saiu "Créditos ou reembolsos" do Resumo da página do cliente.
  · "Documentos em falta" aparece uma só vez no Resumo: o indicador do topo, que abre a lista em
    Documentos (saiu o cartão repetido do fundo).
- [x] **Portal de clientes (R-B11)**
  · A coluna "Atenção" da lista mostra "N obrigações em atraso" (antes dizia "Tudo em dia").
  · "Pedir os documentos deste mês" usa sempre o mês e o ano correntes.
  · Trocar o país nos Dados repõe a forma jurídica e o regime do novo país.
  · "Conta ativa" só depois do primeiro acesso (as contas nascem com o e-mail confirmado); a
    Visualização completa fica disponível também antes disso.
  · Relatórios: trimestres anteriores à entrada do cliente deixam de aparecer "Por fazer".
  · Remover um comprovativo desmarca "Comprovativo arquivado".
  · "Últimos 30 dias" nas horas são 30 dias.
  · CRM: as origens Diagnóstico e Consultoria existem na lista, e editar o lead já não as apaga.
- [x] **Conciliação** — "Não constam do extrato" conta só os lançamentos dentro do período dos
  extratos importados.
- [x] **ESG (R-B10 e R-D10)**
  · Maturidade de governança sem respostas de governança: "—" nos KPIs, como no Relatório e na
    Apresentação.
  · Sem valor fica "—" (acabaram "— t", "— kWh", "—% reciclado"); "anos" traduzido.
  · A água no Relatório mostra a unidade gravada (m³, litros ou €).
  · Percentagens do diagnóstico entre 0 e 100 (o gap salarial entre −100 e 100).
  · O contacto e a conta de um caso ESG editam-se na tira de cima (✏️ Editar). Sem conta, o
    caso deixa de estar visível ao cliente.
  Verificado com dados de exemplo, um a um.

### Simplificação, fase 1 — 01/10 *(na branch `simplificacao-fase1`, até à 038)*

- [x] **Acertos da revisão geral sem mudar o modelo**
  *Reuniões 18/09 e 25/09 · Revisão de 01/10 · Resp.: Vinícius*
  Referências do Guia da plataforma (v1.2, atualizado):
  · **Dados e segurança** — o cliente só altera ou apaga as obrigações que não são da equipa
    (etiqueta "equipa", só leitura) e a ESG deixa de aceitar gravações do cliente (migração
    038, R-A1 e R-A2); IVA nas despesas recorrentes (taxa do modelo ou da empresa) e ao criar
    lançamentos a partir do extrato (R-A3); a consultoria junta as alterações antes de gravar e
    grava ao sair, lê "1.500" e "1.500,50", e a origem das estratégias TOWS acompanha os pontos
    da SWOT apagados (R-A6).
  · **O que partia em janeiro** — ano livre no Painel (seletor), no Livro de Caixa (filtro por
    ano e mês) e nas Recorrentes (R-B1, R-B2).
  · **Uma regra por conceito** — obrigações em aberto = em atraso + 14 dias, em todo o lado, e o
    Início mostra primeiro as em atraso (R-B3); periodicidade a contar do início para avenças e
    recorrentes (`lib/periodicidade.js`, R-B4); custos fixos do Painel só até ao mês corrente e
    "Resultado após reserva" (R-B5, parte); Familienversicherung pela média real, com o
    Planeamento como simulação (R-B6); % de reserva só na Empresa e 25% por omissão (R-B8); um
    ano de referência por caso ESG (R-B9); Segurança Social do Painel só para independentes (R-B12).
  · **Um só gerador fiscal** — sai o do cliente; o calendário é gerado pela equipa no portal (R-C3).
  · **Limpeza** — seis ficheiros sem uso apagados e o gerador antigo (R-D1); Recorrentes no menu
    (R-D2); menu Lite com o Início e sem a Conciliação (R-D3); Moeda e Início do ano fiscal fora
    da Empresa (R-D8); editar no Catálogo e nos Clientes, e o botão de editar das Recorrentes com
    texto (R-D9).
  Verificado com uma base de dados falsa: periodicidade (anual de maio só em maio; trimestral de
  fevereiro em fev/mai/ago/nov), IVA ao confirmar e ao criar do extrato, régua das obrigações,
  reservas, ano de referência da ESG, menu Lite e a gravação da consultoria.

### Contabilidade de demonstração para a administradora — 01/10

- [x] **A Lúcia volta a ter a Contabilidade, como demonstração**
  *Reunião 01/10/2026 · Resp.: Vinícius*
  Volta atrás no que foi feito a 30/09 (administradora só na Gestão), a pedido do Vinícius
  como mais urgente: a demonstração funciona como antes, com a **conta da própria Lúcia** — o
  que ela lança fica guardado lá, pode testar e mostrar, e nenhum cliente vê. No menu, o botão
  **Gestão / Demonstração** alterna entre as duas; nas páginas da Contabilidade aparece uma
  faixa dourada "Demonstração — a sua própria conta". O sino de prazos fiscais aparece-lhe só
  dentro da Contabilidade. A ESG do cliente continua só pela Visualização completa (os casos ESG
  da Lúcia vivem na Gestão). Guia da plataforma atualizado (v1.1).

### Guia da plataforma e revisão geral — 01/10

- [x] **Documentação da plataforma: de onde vem cada dado**
  *Reunião 25/09/2026 · Resp.: Vinícius*
  `docs/Guia-da-Plataforma-Origem-dos-Dados.pdf` (54 páginas), no formato do guia do APEX:
  ecrã a ecrã — Gestão, ESG e a plataforma do cliente — com print anotado, quem vê, de onde vem
  cada número e a conta por trás; caixas "A ter em conta" onde um ecrã difere dos outros.
  Termina com a **revisão geral** (6 itens de dados e segurança, 12 regras inconsistentes, 8
  fontes duplicadas, 11 funcionalidades a retirar ou ligar) e a proposta de simplificação em três
  fases. É um documento vivo: `python scripts/gera-guia-plataforma.py`; os prints são tirados
  com dados de exemplo e ficam em `docs/guia-plataforma/prints`.

- [x] **Correções encontradas na revisão** *(no ar)*
  · O calendário fiscal de **sociedades em Portugal** falhava sempre: os três pagamentos por
    conta tinham o mesmo código e a base de dados recusava o calendário inteiro.
  · **Relatórios trimestrais novos** não gravavam (o id não era um UUID).
  · Apagar **"Horas incluídas por mês"** dava erro (vai a 0).
  · **Contratos novos do Financeiro** passam a ligar-se à ficha do cliente (pela conta ou pelo
    nome, sem acentos) — antes a avença não aparecia na página do cliente; o campo Cliente
    sugere os nomes das fichas.

### Todas as páginas usam a largura toda — 30/09

- [x] **Páginas adaptáveis a qualquer largura, sem limite à direita**
  *Pedido de 30/09 · Resp.: Vinícius*
  21 páginas tinham uma largura máxima (entre 640 e 1100 px) e deixavam metade de um ecrã
  largo vazio — Consultorias, Consultorias ESG, Diagnósticos, Financeiro, as seis páginas da
  ESG, as da Contabilidade do cliente, a ficha da conta, entre outras. Passam a ocupar toda a
  área, com a mesma margem dos dois lados (34 px). O modo apresentação ESG também.
  Para caber sem deslizar para o lado em ecrãs médios: a **lista de clientes** junta país e
  setor até 1320 px e, até 1100 px, põe o estado junto ao serviço e o responsável sob o nome
  (os filtros passam a duas linhas); a **tabela de obrigações** põe o período sob o nome e o
  valor com o comprovativo na mesma célula até 1200 px; os **separadores** da página do
  cliente passam a uma segunda linha em vez de esconder os últimos. No telemóvel, as tabelas
  do Resumo e dos Relatórios do cliente deslizam dentro do cartão em vez de saírem do ecrã.
  Verificado em 42 páginas a 1024, 1280, 1366, 1440 e 1920 px e no telemóvel (390 px):
  nenhuma página com rolagem horizontal nem conteúdo cortado, e todas usam a área toda.

### A administradora vive só na Gestão — 30/09

- [x] **Sai o botão Gestão / Contabilidade do menu da administradora**
  *Pedido de 30/09 · Resp.: Vinícius*
  A administradora vê apenas a visão interna de gestão. Os endereços da Contabilidade e da
  ESG do cliente levam-na aos Clientes; só lá entra pela **Visualização completa** de um
  cliente (e o caso ESG aberto na Gestão continua com o menu da ESG). O sino de prazos
  fiscais da conta própria também sai — os prazos dos clientes estão nas Tarefas e na Agenda.
  O botão continua para os clientes com Contabilidade + ESG.
  O menu lateral ficou mais compacto (itens, títulos de secção, logótipo e rodapé com menos
  espaço): os 11 itens cabem sem rolagem num portátil de 768 px de altura.

### Portal de gestão de clientes oficial — 29/09 *(037 aplicada, publicado)*

- [x] **A v2 passa a ser a Gestão, com dados reais**
  *Pedido de 29/09 · Resp.: Vinícius*
  O endereço `/v2` desaparece (quem o tiver guardado vai parar aos Clientes). Clientes,
  Agenda, Tarefas, Relatórios e Mensagens abrem no topo do menu da Gestão, dentro da
  plataforma e com o menu de sempre, para a equipa toda; a avença e a ficha da conta são só da
  administradora. Tudo passa a ler e gravar no Supabase — **migração 037**, só aditiva:
  tabela `clientes` (com ou sem conta), obrigações fiscais com os oito estados, valor,
  comprovativo e checklist (o estado antigo do cliente fica em sincronia por um gatilho, por
  isso a v1 do cliente continua a funcionar), tarefas com recorrência, documentos, registo de
  mensagens, relatórios trimestrais, notas internas e horas.
  O que deixou de ser demonstração: **ficheiros a sério** (documentos por mês, comprovativos e
  anexos vão para a pasta do cliente — com conta, a mesma pasta para onde ele envia os dele, e
  o que ele enviou aparece para classificar); **mensagens** a clientes com conta vão para o
  Início dele, e sem conta ficam registadas na ficha (o WhatsApp fica também registado);
  **avença e pagamentos** vêm do Financeiro; o **calendário** gerado não duplica o que o cliente
  já gerou na conta dele; **ligar a ficha a uma conta** traz as obrigações dessa conta.
  Saiu: os dados de demonstração e o "Repor dados", o seletor simulado "Ver como" (fica o
  **Visualização completa** a sério, no separador *Conta na plataforma*), a faixa da
  pré-visualização, a lista **Clientes Ativos** (a ficha antiga vive agora nesse separador) e
  o **Marketing** do menu da administradora (era um marcador de lugar; continua a ser a área do
  papel marketing). "Enviar relatório ao cliente" passou a **"marcar como enviado"**, porque o
  cliente ainda não vê relatórios na plataforma.
  Verificado com uma base de dados falsa: gerar o calendário sem duplicar, mudar estados,
  anexar comprovativo, mensagens com e sem conta, documentos, ligar conta, tarefas
  recorrentes, avença e a vista da colaboradora (sem avença nem conta).

### Revisão do backlog — 29/09

> Os itens em aberto foram conferidos um a um contra o código e as decisões das reuniões.
> Os que já estavam resolvidos fecham; os que foram ultrapassados ficam aqui registados como
> **desconsiderados**, com o motivo, para não voltarem numa próxima sincronização.

- [x] **Investigar soluções de backup e onde os dados ficam guardados** *(16/07)*
  ✔ Resolvido pelo **R3** da auditoria (25/08): plano Pro, backups diários com 7 dias de
  retenção em Frankfurt, mais o backup lógico local. A comparação com a proposta Microsoft
  deixou de ser necessária.

- [x] **Dashboard macro da gestão** *(23/07)*
  ✔ Coberto pelo **Financeiro**: previsto, recebido e por receber no mês, e contratos ativos —
  o "controlling comercial" pedido. Se ela quiser a faturação acumulada do ano, entra como
  pedido novo.

- [x] **Imagem estética do tratamento na calculadora de preços** *(06/08)*
  ✔ Não era uma imagem: era o emoji 💅 no separador "Tratamento", que prendia a calculadora
  à cosmética. Passou a um relógio (⏱️) — um tratamento é um serviço à hora, em qualquer nicho.

- [x] **Desconsiderado — Entrada automática de leads dos formulários no CRM** *(30/07)*
  A reunião de 18/09 decidiu o contrário: entrada **manual**, de propósito, para evitar
  registos indevidos. E o formulário já vive na plataforma, com "Juntar ao CRM".

- [x] **Desconsiderado — Validar o desenho da página de Consultoria** *(30/07)*
  Era a página do lado do cliente "focada em documentos". O modelo mudou: a consultoria é
  trabalho interno da Lúcia e o cliente passa a ver o portal da v2.

- ↳ **Guião de reunião** *(23/07)* e **Níveis de acesso por serviço** *(18/09)* passaram para
  dentro do item "Passar a v2 a tabelas reais", que os absorve.
- ↳ **Testar a integração com o WhatsApp** *(18/09)* passou para **Adiados** (decisão de 25/09).

### ESG para apresentar e ganhos rápidos — 29/09

- [x] **Visualização do ESG por cliente, pronta para apresentar — modo apresentação**
  *Reunião 18/09/2026 · Resp.: Vinícius*
  Em cada caso ESG, **Modo apresentação ↗** abre uma página própria, sem menus, para
  mostrar ao cliente ou partilhar o ecrã, e que imprime limpo em PDF. Tem o **percurso**
  (progresso geral, as cinco fases e o próximo passo), **o que importa** (a matriz de dupla
  materialidade em grande e os temas materiais com meta e payback), **os números** (CO₂,
  eletricidade renovável, colaboradores, percentagem de mulheres e maturidade de governança,
  com a variação face ao ano anterior) e **o plano** (projetos com investimento, poupança e
  payback). Escolhe-se o ano de referência. Só aparecem as secções com conteúdo, como pedido
  a 25/09. Só leitura — não grava nada.

- [x] **Tradução dos subcampos do diagnóstico ESG**
  *Reunião 06/08/2026 · Resp.: Vinícius*
  "Não renováveis", "Gás natural", "Litros"… ficavam sempre em português: os 38 subcampos
  (energia, emissões, resíduos, taxonomia, mulheres, acidentes, desligamentos) só tinham
  texto em português. Passam a ter alemão e inglês, e os grupos (Nicht erneuerbar /
  Non-renewable, Erneuerbar / Renewable, Strom / Electricity) também. As unidades guardadas
  não mudam — só o rótulo ("Liter" / "Litres") — para não estragar respostas já gravadas.
  Verificado nas três línguas: nenhum texto português a sobrar.

- [x] **Sete ecrãs sem `<h1>`** *(QA de 13/08)*
  Painel, Livro de Caixa, Obrigações, Calculadora de Preços, Catálogo, Clientes e Empresa
  ganham o cabeçalho padrão (eyebrow + título + subtítulo) — um componente partilhado,
  `CabecalhoPagina`, para não repetir código. A Empresa tinha um `<h2>` a fazer de título,
  que passou a este cabeçalho. Verificado: um `<h1>` em cada um dos sete.

- [x] **Nenhum componente recriado a cada render em toda a plataforma**
  Depois da correção de 28/09 (campos que perdiam o foco), o mesmo padrão ficava em quatro
  ecrãs só de leitura: Reservas & Impostos, EÜR, KPIs e a matriz da materialidade. Sem
  campos não se perdia texto, mas redesenhavam tudo a cada mudança. Passam a funções
  chamadas diretamente; o lint confirma **zero** ocorrências no projeto.

### Correções de 25/09 — 28/09

- [x] **O campo de texto do diagnóstico ESG já não perde o foco — e o mesmo bug em mais dois sítios**
  *Reunião 25/09/2026 · Resp.: Vinícius*
  Ao escrever, o cursor saía do campo e a página voltava ao topo a cada tecla. A causa eram
  componentes declarados **dentro** do componente da página: o React recriava-os a cada
  render e desmontava o campo onde se estava a escrever. O mesmo padrão estava em mais dois
  ecrãs com campos, que a Lúcia ainda não tinha reportado: a **caixa de texto de cada
  secção do relatório ESG** e as **tabelas de números da consultoria** (faturação e custos —
  usadas ao vivo com o cliente). Nos três passam a funções que devolvem o JSX.
  Verificado a escrever de seguida em cada campo (dígitos e texto): o foco fica no mesmo
  campo e o valor completo fica lá. Há o mesmo padrão em ecrãs só de leitura (Reservas &
  Impostos, EÜR, KPIs, matriz) — sem campos, sem este efeito; entram na revisão geral.

- [x] **Relatórios sem secções vazias**
  *Reunião 25/09/2026 · Resp.: Vinícius*
  O **PDF do relatório ESG** só inclui cada secção se tiver texto escrito ou dados; os KPIs
  sem valor em nenhum dos anos saem da tabela; sem nada, fica uma linha "ainda sem dados" em
  vez de quatro títulos vazios. A maturidade de governança deixa de contar como dado quando
  não há respostas do pilar G (dava 0 % e fazia aparecer a secção de KPIs num caso vazio).
  No **trimestral da v2**, as linhas sem valor em nenhum dos dois trimestres saem do PDF, e o
  cliente não vê caixas de observações ou recomendações vazias. O relatório de consultoria já
  escondia as páginas vazias uma a uma.

- [x] **Portal do cliente só informativo, sem valores (v2)**
  *Reunião 25/09/2026 · Resp.: Vinícius*
  No perfil Cliente saem os cartões "Valor a pagar" e "Créditos ou reembolsos" e a coluna
  Valor das obrigações e das declarações — fica obrigação, período, data e estado. A equipa
  continua a ver tudo. Verificado: zero montantes no Resumo e nas Obrigações do cliente.
  ⚠️ **A confirmar com a Lúcia** (na lista de campos que ela vai marcar): se o cliente
  continua a ver os **comprovativos** e o **relatório trimestral** (que tem faturação e
  resultado do negócio dele — não são valores fiscais, mas são números).

### ESG como consultoria — 19/09

> Migração **036** por correr (tabela `esg_consultorias`, coluna `consultoria_id` nas quatro
> tabelas ESG, backfill e políticas). Até correr, a lista `/gestao/esg` dá erro e a área ESG
> do cliente mostra "ainda não disponível". O próprio ficheiro termina numa consulta de
> verificação: a coluna `sem_caso` tem de vir a 0 em todas as tabelas.

- [x] **Proposta de estrutura da consultoria ESG dentro da plataforma — e a implementação**
  *Reunião 18/09/2026 · Resp.: Vinícius*
  O módulo ESG estava construído como a Contabilidade: os dados pertenciam ao utilizador e
  era ele que preenchia — as seis páginas liam pelo utilizador visto (`useEffectiveUserId`)
  mas **gravavam sempre no utilizador com sessão** (`user.id`), e a base de dados deixava o
  admin ler tudo mas escrever só no dele. Ou seja, se a Lúcia entrasse em "Ver como Célia" e
  preenchesse a materialidade, gravava na ESG **dela**, em silêncio.
  Passa a comportar-se como a Consultoria: um **caso** (`esg_consultorias`) é o dono dos
  dados, com contacto inline, `lead_id` e `user_id` opcionais e estado. As quatro tabelas
  ganham `consultoria_id` (não são substituídas); o backfill cria um caso por cada
  utilizador que já tinha dados. A **fase não se guarda** — é calculada, como o Percurso já
  fazia.
  As seis páginas não mudaram de aspeto: deixaram de perguntar "quem é o utilizador" e
  passaram a perguntar "qual é o caso" (`useAlvoESG`: caso, rotas base, só-leitura). Dentro
  da Gestão vivem em `/gestao/esg/:id/…`, com o nome da empresa sempre em cima e o menu do
  percurso como navegação interna do caso; a lista `/gestao/esg` mostra a fase de cada um.
  A área `/esg/*` do cliente resolve o caso ligado à conta dele e mostra tudo **só leitura**
  — sem botões de guardar, sem criar projetos. Se não houver caso (ou estiver escondido pela
  Lúcia, `visivel_cliente`), vê uma mensagem em vez de seis páginas vazias.
  Nas fichas de cliente, a métrica `n/28 respondidas` deu lugar à **fase do caso** e ao
  progresso geral — a contagem de perguntas deixou de ser a régua certa quando o Percurso
  passou a medir cinco fases.
  O botão "ESG" do admin no fundo do menu saiu: a ESG dele é trabalho e vive na Gestão, em
  **Serviços → Consultorias ESG**; a ver um cliente, o botão continua a existir.

- [x] **A ESG abre num separador próprio, com o menu da ESG — e as listas ficam em tabela**
  *Pedido 19/09 · Resp.: Vinícius*
  Embrulhar as seis páginas dentro da gestão, com cabeçalho e abas, tirava-lhes o ar de
  produto — e a Lúcia partilha o ecrã com clientes. Agora a lista `/gestao/esg` é uma
  **tabela** (empresa, estado, as cinco fases, próximo passo) e o **Abrir ↗** abre o caso
  **num separador novo**, onde a barra lateral mostra o menu da ESG tal como o cliente o
  vê — Percurso, Materialidade, Diagnóstico, KPIs, Projetos, Relatórios — com o nome da
  empresa em destaque por cima. Do caso só resta uma tira fina no topo (voltar, estado,
  conta ligada, o que o cliente vê). A lista das **Consultorias** passou ao mesmo formato
  de tabela (`ListaCasos`), com os quatro blocos no lugar das fases.
  Verificado num Supabase em memória: gravação a ir para `esg_materiality` com
  `onConflict=consultoria_id`, lista com fases certas (43 % / 0 %), casca do caso, projetos,
  Célia em só leitura, Nádia sem caso. Sem tocar em dados reais.

### App nativa, fase 1 — a base web — 16/09

- [x] **Ícones reais da aplicação**
  *Resp.: Vinícius*
  O manifest declarava o mesmo `public/logo.png` (1024×838, o lettering completo) como 192×192
  **e** 512×512 maskable — dois tamanhos que o ficheiro nunca teve, e um desenho que fica
  ilegível a 48px. Agora há ficheiros a sério em `public/icons/`: 192, 512, um 512 *maskable*
  com a zona segura respeitada (o Android recorta até 20% de cada lado), um apple-touch de 180
  e um favicon de 32. Todos usam só o **monograma dourado sobre o verde da marca** — o
  lettering "Office Consulting" não se lê num ícone de ecrã inicial.
  O `scripts/gerar_icones.py` regenera tudo a partir do logótipo, para não ficarem órfãos.

- [x] **Service worker: a aplicação deixa de ser uma página em branco sem rede**
  *Resp.: Vinícius*
  `public/sw.js`, escrito à mão e sem dependências novas. Navegação vai à **rede primeiro** e
  guarda a casca; sem rede, serve a última casca guardada e, se nem essa houver, a
  `public/offline.html` (trilingue). Os ficheiros de `/assets/` são **cache primeiro** — como o
  Vite lhes põe um hash no nome, o conteúdo nunca muda para o mesmo nome, por isso não é
  preciso manter lista nenhuma de pré-cache (que é exatamente o que costuma deixar uma
  aplicação presa numa versão antiga).
  **Nunca toca** em `/api/`, no Supabase nem em nada de outra origem: são dados de clientes e
  respostas autenticadas.
  Sem `skipWaiting()` de propósito: uma versão nova só assume quando todos os separadores
  fecham. Chega mais devagar, mas não troca o código por baixo de quem está a meio de um
  lançamento no livro de caixa.
  Regista-se **só em produção** (em dev tapava o servidor do Vite) e falha em silêncio — sem
  service worker a plataforma funciona como funcionava, só não abre sem rede.
  ⚠️ **Por verificar num telemóvel real:** o painel de browser desta sessão não permite
  registar service workers (nem um ficheiro vazio), por isso as 7 regras foram exercitadas num
  ambiente falso (15 verificações, todas a passar) em vez de no browser. Vale confirmar o
  "Adicionar ao ecrã inicial" e o modo avião num Android depois do próximo deploy.

### Contrato do cliente e checklist de onboarding — 15/09

> Migração **035** por correr (duas colunas em `client_billing`, para o ficheiro do contrato).

- [x] **O contrato passa a estar na plataforma — e o cliente vê o dele**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  Era a peça que faltava do acesso básico definido a 10/09 — *"contrato, documentos e
  notificações"*: as mensagens e os documentos já lá estavam, o contrato não.
  No Financeiro, cada contrato ganhou **Anexar PDF** (e depois **📄 Contrato**, para abrir).
  No Início do cliente, aparece **Ver contrato →** por baixo do próximo pagamento.
  O ficheiro vai para a pasta do próprio cliente (`{user_id}/contratos/`) quando o contrato
  está ligado a uma conta: assim ele lê o seu pela política que já existia, e o ficheiro
  desaparece com ele na eliminação. Contratos sem conta associada ficam numa pasta a que só a
  Lúcia chega. O bucket é privado, por isso abre-se sempre com uma ligação temporária.

- [x] **Checklist de onboarding e "Fazer Onboarding"**
  *Reunião 06/08/2026 · Resp.: Vinícius*
  Na ficha do cliente, seis passos: conta criada, dados da empresa, contrato anexado, mensagem
  de boas-vindas, primeiro acesso e primeiros documentos. Cada um com atalho para o resolver
  quando faz sentido.
  **Nenhum passo é marcado à mão** — todos são lidos do que já existe. Uma checklist com
  caixas para marcar acaba sempre por mentir (alguém marca e não faz, ou faz e não marca);
  assim, o que está verde está mesmo feito. Custo: não dá para registar passos que a
  plataforma não vê (uma chamada telefónica, por exemplo) — se isso fizer falta, acrescenta-se
  depois um campo livre.
  Na lista de clientes, quem ainda não entrou mostra **Onboarding →** em vez do atalho para a
  plataforma, que é o botão que a Lúcia pediu na visão dela.
  **Verificado no browser** nos dois extremos: 1 de 6 num cliente recém-criado e "Onboarding
  completo" quando está tudo feito.

### Percurso ESG e três pontas soltas — 14/09 (fim do dia)

> Migração **034** aplicada a 14/09 — está tudo a funcionar em produção.

- [x] **Consultoria ESG por fases**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Página **Percurso** (`/esg/percurso`), onde a ESG passa a aterrar. Cinco fases —
  materialidade, diagnóstico, indicadores, projetos e relatório — cada uma com o seu estado, e
  um **próximo passo** em destaque. A reunião falou de quatro fases; os projetos entraram
  porque já existem como módulo e o relatório conta com eles.
  O estado é **calculado a partir do que os módulos já gravam** (`src/lib/esgPercurso.js`): a
  página não guarda nada, por isso nunca fica dessincronizada do trabalho real. Regras: um
  tema conta como tratado quando foi decidido (pontuado ou marcado como não aplicável), e os
  projetos medem-se contra os **temas materiais** — a meta é cada tema material ter pelo menos
  um projeto, e enquanto não houver materialidade a fase fica "à espera" em vez de mostrar 0%.
  A fase dos indicadores conta as oito leituras de topo que já têm valor, porque os KPIs são
  leitura do diagnóstico e não têm dados próprios — preferi medir o que existe a inventar um
  estado de "revisto".
  **Verificado no browser** em três situações (ficha vazia, a meio e completa): 0% → 43% → 98%,
  com a fase seguinte a apontar sempre para a primeira por fechar.

- [x] **Guardar o ficheiro de extrato importado na conciliação**
  *Reunião 27/08/2026 · Resp.: Vinícius*
  Era o **último ponto de 27/08 por fechar** que não dependia de terceiros. O ficheiro passa a
  ser arquivado em `client-docs/<cliente>/extratos/` — a mesma pasta que é apagada por inteiro
  quando o cliente é eliminado, por isso não abre pontas soltas de RGPD. Continua a **não subir
  nada antes de ela confirmar** a importação, e se o envio falhar a importação segue na mesma:
  perder o arquivo é incómodo, perder os movimentos seria pior. A página passou a listar os
  últimos extratos com uma ligação temporária para os abrir. Migração 034.

- [x] **Bandas de faturação do formulário e do CRM**
  *13/08/2026 · Resp.: Vinícius*
  O CRM começava em "< 50 mil €/ano" e os clientes reais da Lúcia cabiam quase todos aí: o topo
  do formulário (>10.000 €/mês = 120 mil/ano) já era a segunda banda. Quatro bandas baixas
  novas (12, 36, 60 e 120 mil) e uma tabela de correspondência entre as bandas **mensais** do
  formulário e as **anuais** do CRM. Os leads que vêm do formulário e das consultorias já
  chegam com a banda preenchida, em vez de vazia.
  As duas bandas antigas continuam a pontuar (há leads gravados com elas) mas saíram da lista
  de escolha, por se sobreporem às novas; e as opções passaram a mostrar a referência mensal,
  que é como ela pensa nos clientes.

- [x] **🐞 Datas apareciam um dia atrás em fusos a oeste de Greenwich**
  *Encontrado a 14/09 · Resp.: Vinícius*
  Uma data sem hora (`2026-09-01`, como as colunas `date` do Postgres) passada ao `Date()` é
  lida como meia-noite **UTC** e, ao ser mostrada em hora local, recua um dia em qualquer fuso
  a oeste. Apanhado a preparar prints a partir do Brasil: um extrato de setembro aparecia como
  31/08–29/09. **Não afeta a Lúcia** (Portugal e Alemanha estão a leste), mas afeta qualquer
  teste feito do Brasil e qualquer cliente nas Américas.
  Novo `dataCurta(d, lang)` em `src/lib/formato.js`, aplicado na Conciliação e no EÜR — os dois
  ecrãs que mostram colunas só-data. Onde há *timestamps* (`created_at`, último acesso) o
  comportamento anterior está correto e ficou como estava.

- [x] **🐞 Rótulo trocado na Materialidade**
  *Encontrado a 10/09 · Resp.: Vinícius*
  A chave `saving` servia duas coisas no mesmo objeto — o rótulo "Poupança/ano (€)" e o estado
  "A guardar…" — e em JavaScript ganha a última. O campo do bloco financeiro mostrava a
  mensagem errada. Separadas as chaves nas três línguas. O projeto está agora a zero também em
  `no-dupe-keys`, não só em `no-undef`.

### Comunicação com o cliente e estrutura de serviços — 14/09

> Migração **033** aplicada a 14/09 — o Início do cliente e as mensagens estão a funcionar.

- [x] **🐞 A Célia não conseguia apagar transações**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Não era falha técnica: o botão era um `✕` de 14px com 2px de padding (~18×18) na cor
  `#cbd5e1` — quase invisível sobre fundo claro — e no telemóvel ficava **fora do ecrã**,
  porque a linha da tabela tem 760px dentro de um contentor que rola para o lado.
  Agora: botão com borda e 32×32 no computador, e no telemóvel um **"Remover"** por baixo da
  descrição, à vista sem rolar. Pelo caminho apanhei dois problemas silenciosos na mesma
  função: **não havia confirmação** antes de apagar, e a remoção era otimista — como apagar
  zero linhas **não devolve erro** no Supabase, uma falha de permissão fazia a linha
  desaparecer e voltar no recarregamento seguinte. Passa a confirmar, a verificar o que foi
  mesmo apagado e a avisar quando nada foi. E se o lançamento estava conciliado, o movimento
  do extrato volta a **"por conciliar"** em vez de ficar conciliado com nada.
  ↳ Descartadas pelo caminho: a chave estrangeira da conciliação é `on delete set null`
  (não bloqueia) e o RLS deixa o dono apagar o que é seu.

- [x] **Estrutura básica de onboarding e comunicação com o cliente**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Página **Início** (`/contabilidade/inicio`), onde o cliente passa a aterrar depois de
  entrar. Responde às três perguntas que ele faz por mensagem: **mensagens da Lúcia**,
  **próxima obrigação fiscal** (com os dias que faltam, a vermelho na última semana) e
  **próximo pagamento** (calculado a partir do contrato e do que já foi recebido). Mais o
  atalho para enviar os documentos do mês e um aviso quando falta o país da empresa.
  Do lado dela, uma caixa na ficha do cliente para escrever os avisos, com três tons —
  informação, **tratado** e precisa de ação. O tom "tratado" é literalmente o caso que
  apressou isto: dizer a um cliente que a declaração de IVA foi entregue.
  ↳ O cliente passou a poder ler o **seu** contrato e os recebimentos (política nova); não
  pode escrever nada disso.

- [x] **Primeira versão da aba de Serviços**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  A navegação da Gestão passou a ter duas secções: **Gestão** (Clientes Ativos, CRM,
  Marketing, Financeiro, Acessos) e **Serviços** (Diagnósticos, Consultorias). É a separação
  que ela pediu — como ela trabalha de um lado, o que ela vende do outro.

- [x] **Lead "fechado" cria o acesso do cliente**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Descoberta pelo caminho: "cliente ativo" não é uma tabela — **são os utilizadores da
  plataforma**. Por isso o que faltava era criar-lhes o acesso. O cartão do lead fechado
  ganhou **"Criar acesso"**: cria a conta com palavra-passe temporária (o padrão da casa) e,
  se já houver contrato, liga-o à conta — que é o que faz o próximo pagamento aparecer no
  Início do cliente. Serve os 5 clientes que ela está a integrar esta semana.

- [x] **Campos de país e serviço no cadastro de clientes**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Os dois no formulário de criação/edição de utilizador. O país já existia mas só o próprio
  cliente o podia escrever — e muitos não chegam a preencher; agora ela regista-o quando
  cria a conta, que é quando sabe o que vendeu.

- [x] **Compactar a lista de clientes ativos**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Alternador **Compacta / Completa**, com a compacta por omissão e a escolha lembrada. A
  compacta dá uma linha por cliente: nome, e-mail, serviço, país, um ponto de estado e os
  atalhos. A completa mantém os indicadores todos.

### Correção urgente — 10/09

- [x] **🐞 Erro na Calculadora de Preços (`fmt is not defined`)**
  *Reunião 10/09/2026 · Resp.: Vinícius*
  Regressão que eu próprio introduzi a 27/08, no lote da formatação por língua: o `fmt` passou
  para dentro do componente principal, mas as quatro calculadoras (Evento, Serviço, Produto e
  Tratamento) vivem ao nível do módulo e ficaram sem ele — a página caía inteira ao abrir.
  Corrigido com uma fábrica `criarFmt(lang)` partilhada (commit `4a5729d`).
  **Verificado no browser:** as quatro calculadoras abrem e calculam, e o formato acompanha a
  língua (`1337,50` em pt-PT · `1.337,50` em de-DE). Varridas as **23 rotas** da aplicação:
  nenhuma outra rebenta.
  **Porque passou:** validei o lote só com o `npm run build`, que não resolve nomes. O ESLint
  apanhava (`no-undef`) — corri-o apenas nos ficheiros novos, não nos alterados. O `src/` está
  agora a zero `no-undef`, e a varredura completa passou a fazer parte do fecho de cada lote.
  ↳ A aba de **Obrigações Fiscais**, mencionada no mesmo item da reunião, foi verificada e
  **não tinha erro** — era a calculadora.

### Formulário, CRM e documentos — 09/09

> Migração **032** aplicada a 14/09 — o formulário público e os Diagnósticos estão a funcionar.

- [x] **Formulário de qualificação dentro da plataforma** *(primeira versão)*
  *Reunião 27/08/2026 · Resp.: Vinícius*
  Página **pública** em `/diagnostico`, sem conta, nas três línguas. As perguntas são as do
  Bloco 0 (`src/data/enquadramento.js`), por isso o que vier daqui entra na ficha da
  consultoria sem conversão nenhuma — e mudar uma pergunta continua a ser mexer num sítio só.
  A triagem vive em `src/lib/triagem.js`, com os pesos à vista para afinar com a Lúcia;
  passou seis casos de verificação. **Nada se perde:** quem fica abaixo do corte aparece na
  lista à mesma, com o motivo escrito.
  ↳ **Por decidir com ela:** os pesos e o corte (hoje 4 pontos).

- [x] **Ecrã de Diagnósticos na Gestão**
  *09/09/2026 · Resp.: Vinícius*
  Lista as respostas com o veredito, abre as respostas todas e promove a lead com um clique.
  Acessível a admin e comercial.

- [x] **Botão "Juntar ao CRM" nos contactos das consultorias**
  *Reunião 27/08/2026 · Resp.: Vinícius*
  Na ficha, ao lado do "Relatório →". Guarda o `crm_lead_id` na consultoria, por isso não
  duplica: depois de adicionado passa a "No CRM ✓". A ponte é partilhada com os diagnósticos
  (`src/lib/leadsCrm.js`).
  ↳ A **banda de faturação** fica deliberadamente por preencher no lead: as do formulário são
  mensais e as do CRM anuais (item aberto em "Achados"). A faturação declarada vai nas notas.

- [x] **⚡ Eliminação completa do cliente: apagar também os ficheiros do Storage**
  *Auditoria 21/08/2026 · Resp.: Vinícius*
  O `api/admin-users.js` percorre agora `client-docs/<uid>/**` (o Storage não apaga pastas e
  o `list()` não é recursivo) e remove tudo **antes** de eliminar a conta. Por esta ordem de
  propósito: se o Storage falhar, a conta continua lá e a operação repete-se — ao contrário,
  ficariam ficheiros sem dono. Fecha a não-conformidade com o art. 17 do RGPD.

- [x] **Envio de documentos pelo cliente, arrumado por mês**
  *Reunião 30/07/2026 · Reforçado a 27/08 · Resp.: Vinícius*
  Nova secção **Documentos** na área da Empresa: escolhe-se o mês (últimos 18) e envia-se.
  Vai para `client-docs/<uid>/AAAA-MM/`, o mesmo sítio que a Lúcia já navega do lado dela.
  A política nova dá ao cliente **INSERT apenas dentro da sua pasta** — não pode apagar nem
  substituir, para não haver forma de fazer desaparecer um documento entregue (nomes
  repetidos ganham sufixo em vez de sobrepor).
  ↳ Falta validar com os 3–4 documentos reais que a Lúcia ia enviar.

### Ajustes rápidos — 27/08

- [x] **Formatação de números segue a língua da interface**
  *QA 13/08/2026 · Resp.: Vinícius*
  Criado `src/lib/formato.js` com o `localeDe(lang)` como fonte única. Os 16 locales fixos
  espalhados por 14 ficheiros foram migrados: as funções `fmt` que viviam no topo do módulo
  (e por isso não alcançavam a língua) passaram para dentro do componente, sem tocar em
  nenhum sítio onde são chamadas. O Rücklagen deixou de ser a exceção em `de-DE`. Resolve
  também o T6 da revisão de design.

- [x] **Vulnerabilidade alta no `react-router`**
  *13/08/2026 · Resp.: Vinícius*
  `react-router-dom` 7.15 → **7.18.2**, que fecha o CSRF por `PUT/PATCH/DELETE` e o redirect
  aberto por barra invertida. Aproveitou-se para correr `npm audit fix` nas restantes (todas
  de build): **`npm audit` passou de 7 para 0 vulnerabilidades**.

- [x] **🟠 Estado de carregamento das páginas**
  *QA 13/08/2026 · Resp.: Vinícius*
  As 17 páginas mostravam a mesma linha solta de "A carregar…" num ecrã vazio. Passaram a
  usar o `EsqueletoPagina`, que desenha a forma do que vem a seguir (cabeçalho, fila de
  cartões, lista) com um pulsar discreto — e que pára para quem pediu menos movimento.

- [x] **🟡 Campos com fonte < 16px faziam o iPhone ampliar sozinho**
  *QA 13/08/2026 · Resp.: Vinícius*
  Já estava resolvido no `index.css` (regra `input, select, textarea { font-size: 16px }`
  abaixo dos 768px) — verificado a 27/08 e fechado.

- [x] **Renomear "projeções" para "previsões"**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  Trocados os três rótulos em português (bloco 4 da consultoria, secção do relatório e o
  índice do relatório). As chaves de dados (`projecao`, `projecoes`) ficaram como estavam,
  porque estão gravadas na base — mudá-las obrigaria a migração sem ganho nenhum.
  ↳ O espaço para anotações, que vinha no mesmo pedido, continua em aberto na Contabilidade.

- [x] **Alvos de toque: os piores casos**
  *QA 13/08/2026 · Resp.: Vinícius*
  "Mostrar/Ocultar" da palavra-passe de 42×17 para 52×38 (login e definição de senha) e os
  botões de linha dos Acessos para 34×34.

- [x] **Login com `<h1>`**
  *QA 13/08/2026 · Resp.: Vinícius*
  O nome da marca passou a `<h1>` — mesma aparência, mas deixa de ser um ecrã sem cabeçalho
  para quem usa leitor de ecrã.

### Revisão de design · 2ª iteração — 25/08
- [x] **Correções da revisão de design feita no Claude Design (PDF de 25/08, 27 achados)** —
  aplicadas no código real da plataforma:
  - **T1 (alta)** Dourado #c9a84c deixou de ser usado como texto sobre fundos claros (~2:1 de
    contraste). Novo token `accentText` no tema (`#6b5a2a` claro / `#d8bd74` escuro); 53 usos
    migrados em 26 ficheiros (eyebrows, "Abrir →", "Relatório →", pills ativas, links "+").
    O #c9a84c continua em bordas, barras e superfícies escuras (ícone ativo da sidebar).
  - **T2 (alta)** `nowrap` onde texto quebrava: valores KPI do Painel, "Exportar CSV" (Livro
    de Caixa), pills e botão "⚡ Conciliar" (Conciliação), chips e "Abrir →" (Consultorias),
    chips/"Relatório →"/passos do stepper (ficha de consultoria).
  - **T4 (média)** Inputs com respiro: campo 14px + padding 10×12 nas Consultorias, ficha,
    Bloco 0, Planeamento, Acessos; tabelas de números da consultoria 13.5px.
  - **T5 (média)** Números de tabelas/listas em sans com `tabular-nums` (Conciliação, EÜR,
    Planeamento, tabelas da consultoria); serif Cormorant mantém-se só nos KPIs grandes.
  - **T6 (média)** EÜR deixou de forçar `de-DE`: formatação de números/datas segue a língua
    da interface, como o resto da plataforma (rótulos fiscais continuam em alemão).
  - **03** "Ignorar" agora parece clicável (ghost com borda); **04** códigos Zeile/Pos a 12px
    sans com mais contraste; **06** chip "Ativa" passou de amarelo-aviso a verde-ok, Pausada
    neutra; **07** ficha ganhou o eyebrow padrão ("Gestão · Consultoria") como os outros ecrãs.
  - **Barras de scroll** (25/08, pedido do Vinícius sobre a barra da sidebar) — a barra
    nativa do Windows (cinzenta, larga, com setas) foi substituída por uma fina de 9px,
    sem setas, com o polegar no dourado da casa e pista transparente. Vale em toda a
    plataforma (sidebar, listas da Conciliação, sino fiscal, modais); o tema escuro leva
    o dourado com mais presença e no telemóvel a barra desaparece (é flutuante do sistema).
    O `data-theme` passou a ser escrito no `<html>` para o CSS distinguir os temas.
  - **Painel com menos faixas de aviso** (25/08, pedido do Vinícius) — o Painel abria com
    duas faixas largas antes de qualquer número. O aviso do limite de lucro
    (Familienversicherung) passou para dentro da linha do período, entre o seletor
    Anual/Trimestral e o ano: mais baixo (5px de padding), texto a 12px com reticências e
    a mensagem inteira no tooltip, e o "Ver detalhes" em vermelho escuro (#8f2620) por ser
    um aviso, não uma ação neutra. Os custos fixos previstos por confirmar perderam a faixa
    e viraram um ponto de aviso no canto do cartão "Custos fixos", que abre a mensagem
    completa ao passar o rato e leva aos recorrentes ao clicar.
  - **Falsos positivos verificados** (a revisão foi feita sobre o HTML estático, não sobre a
    app): drawer mobile com ☰ já existe; KPIs já empilham 2×2 no telemóvel; tema escuro já
    tem pos/neg/linhas de gráfico próprios; funil do CRM já é fluido com scroll no mobile;
    cores dos papéis nos Acessos já têm semântica própria; cabeçalhos do Planeamento já
    quebram sem `<br>`; números da Materialidade e cartões repetidos do CRM eram dados do mock.
  *Revisão design 25/08/2026 · Resp.: Vinícius*

### Cybersecurity e Compliance
- [x] **R3 · Backups automáticos ativos — upgrade Pro na organização da produção** — 25/08.
  O projeto dev foi transferido para uma organização gratuita à parte, por isso o Pro paga
  só a produção (sem os ~$10 do segundo projeto). Backups diários com 7 dias de retenção,
  na região do projeto (Frankfurt). Confirmar em Database → Backups que o primeiro aparece
  nas próximas 24h. O backup lógico local (4-backup-logico.mjs) mantém-se como camada extra.
  *Auditoria 21/08/2026 · Resp.: Vinícius*
- [x] **R1 · Produção migrada para Frankfurt (eu-central-1)** — 24/08: projeto "LC Office
  (EU)" criado, schema via SETUP_COMPLETO, 14 utilizadores com hashes de senha (via SQL
  Editors, excluindo colunas geradas), 17 tabelas conferidas (154 cash_entries),
  company_settings 6/6, storage vazio. Env vars trocadas na Vercel, login confirmado.
  O projeto us-west-2 passa a DEV (o .env.local já aponta para ele).
  ⚠️ Pendente: limpar os dados reais do projeto antigo após 1–2 dias de sobreposição.
  *Auditoria 21/08/2026 · Resp.: Vinícius*
- [x] **R2 · Funções Vercel fixadas em Frankfurt (fra1)** — verificado em produção no
  cabeçalho do pedido: `x-vercel-id: gru1::fra1::…` (borda no POP do utilizador, execução
  em Frankfurt).
  *Auditoria 21/08/2026 · Resp.: Vinícius*
- [x] **Confirmar a região do projeto Supabase** — confirmada a 21/08: `us-west-2`
  (Oregon, EUA), fora da UE. Define o caminho do R1: migração para Frankfurt com o projeto
  atual a virar dev. Runbook em `docs/MIGRACAO_FRANKFURT.md`.
  *Auditoria 21/08/2026 · Resp.: Vinícius*

### Reunião de 20/08 — entregue no próprio dia
- [x] **Remover utilizadores e dados de teste da plataforma**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  ✔ As duas contas demo (GrünBau, Café Lisboa) apagadas da produção nova a 24/08, no
  smoke test da migração — a cascata levou os 63 lançamentos delas, como desenhado.
  Nota: continuam no projeto antigo (dev) até à limpeza; se um dia fizerem falta para
  apresentações comerciais, o seed `scripts/seed_demo_esg.mjs` recria-as.
- [x] **Relatório fiscal alemão EÜR exportável do Livro de Caixa**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  ✔ Página "Relatório EÜR" (menu Contabilidade, só empresas DE, como o Rücklagen): cartões
  Betriebseinnahmen/Betriebsausgaben/Gewinn, linhas expansíveis com os lançamentos
  (Zahldatum, Konto, Belegnummer) e Imprimir/PDF. Nomes das linhas sempre em alemão.
  Só a numeração confirmada pela referência (Zeile 15 · Pos 112) é usada — o resto fica sem
  número, com aviso de que o formulário oficial muda por ano.
- [x] **Cálculo de imposto: valor líquido (neto) e dedução conforme o regime**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  ✔ Verificado contra a referência dela: 590 € brutos a 19% → 495,80 € líquidos, ao cêntimo.
  No EÜR: regime normal em líquidos (IVA recebido como receita, Vorsteuer como despesa);
  Kleinunternehmer em brutos sem separação. Movimentos privados ficam fora.
  ⚠️ Falta a validação da Lúcia sobre números reais — risco apontado na própria reunião.
- [x] **Corrigir erro no relatório de consultoria (time-out) e ajustar template/prompt da IA**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  ✔ O 504 era o limite de tempo da função Vercel mal declarado — passou para o `vercel.json`
  (300 s) e o esforço da geração baixou. O template foi refeito segundo o modelo de design
  aprovado (11 páginas A4) com o prompt alargado.
- [x] **Melhorar legibilidade das colunas do Planeamento Mensal**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  ✔ Coluna Tratamento/Serviço deixou de esticar, seletor do catálogo legível (92px com
  rótulo) e títulos das colunas quebram em duas linhas. Nota: a duração continua em minutos —
  se a Lúcia quiser horas:minutos, é ajuste pequeno.

### CRM — perfil e follow-up · migração 025
- [x] **Origem do lead** (`source`) — Instagram, formulário, site, LinkedIn, indicação, evento,
  manual; etiqueta no cartão e filtro. Base das automações de entrada.
  *Reunião 30/07/2026 · Resp.: Vinícius*
- [x] **Temperatura do lead** (🔥 quente / 🌤 morno / ❄ frio) + filtro e cor na margem do cartão.
  *Reunião 30/07/2026 · Resp.: Vinícius*
- [x] **Alerta de follow-up** — aos 7 dias sem contacto em etapa ativa o cartão fica vermelho,
  com banner de contagem, filtro dedicado e botão "registar contacto".
  *Reunião 30/07/2026 · Resp.: Vinícius*
- [x] **Ranking de "cliente ideal"** — pontuação 0–100 (faturação 40 · temperatura 25 · setor
  prioritário 20 · dor 15); cartões ordenados por pontuação dentro de cada etapa.
  *Reunião 23/07/2026 · Resp.: Vinícius* — conceito do Igor (preço pelo valor agregado)
- [x] **Lead "fechado" → contrato no Financeiro**, com o valor do negócio.
  *Reunião 23/07/2026 · Resp.: Vinícius*

### Consultoria — Bloco 0 · Enquadramento (migração 031)
- [x] **Campos do formulário de diagnóstico inicial** (o JotForm do site) trazidos para a
  ficha: país, se já iniciou e quando, enquadramento fiscal, IVA/Umsatzsteuer, faturação
  mensal, contabilista, dificuldade principal e as palavras do cliente.
  *13/08/2026 · Resp.: Vinícius*
- [x] **O país passa a constar da consultoria** — era a única lacuna que podia tornar um
  relatório factualmente errado, porque decide as regras fiscais aplicadas.
  *13/08/2026 · Resp.: Vinícius*
- [x] **As palavras do cliente ficam à parte das notas internas** (`notas_cliente`), para não
  se confundir o que ele disse com o que a consultora observou.
  *13/08/2026 · Resp.: Vinícius*
- [x] **Aplica-se aos dois tipos de consultoria** e vive fora dos 4 blocos da IHK — é o
  cabeçalho do caso, não uma sessão de trabalho. Em JSONB, para o formulário dela poder
  mudar sem migração.
  *13/08/2026 · Resp.: Vinícius*
- [x] **Não trouxe o agendamento** do formulário: reconstruir marcação de reuniões é um
  projeto por si, e o JotForm faz isso melhor.
  *13/08/2026 · Resp.: Vinícius*

### Relatório de consultoria · modelo de design
- [x] **PDF segundo o modelo aprovado** — 11 páginas A4: capa em verde com as duas
  verificações, sumário com KPIs e barra de posição, SWOT em quadro 2×2 com referências
  S1/W2/O3, peso dos fatores, matriz TOWS com o cruzamento à vista, prioridades em quadrante
  impacto/esforço, capital, projeções e as lacunas.
  *13/08/2026 · Resp.: Vinícius*
- [x] **Fronteira mantida: os números saem do cálculo, a prosa da IA.** O relatório impresso
  nunca imprime um número que a IA tenha escrito — todos vêm de `consultoriaCalc`.
  *13/08/2026 · Resp.: Vinícius*
- [x] **Páginas sem dados desaparecem** em vez de aparecerem vazias; uma ficha por preencher
  gera só a capa, sem rebentar.
  *13/08/2026 · Resp.: Vinícius*

### Conciliação caixa/banco · migração 030
- [x] **Importação de extrato (CSV e Excel)** — o formato é descoberto a partir do conteúdo:
  separador, decimal à portuguesa/alemã/inglesa, data em quatro formatos, coluna de valor com
  sinal **ou** colunas débito/crédito separadas, e cabeçalho que pode não estar na 1.ª linha.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Reimportar é inofensivo** — índice único `(user_id, fingerprint)` na base: importar o
  extrato de janeiro duas vezes não duplica nada.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Conciliação um-para-um** com o Livro de Caixa: valor e sentido têm de bater certo,
  data até 7 dias, e a semelhança da descrição desempata. **Só concilia sozinho o que é
  inequívoco** — dois lançamentos iguais no mesmo dia ficam marcados como ambíguos, porque é
  precisamente o caso em que a máquina não deve decidir.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Movimento sem correspondência → cria o lançamento** a partir do extrato. E o inverso:
  lançamentos de banco que não constam do extrato ficam assinalados numa aba própria.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Leitor de Excel carregado sob procura** — fica fora do arranque; e usei
  `read-excel-file` em vez do `xlsx`, que está parado em 2022 com CVEs por corrigir.
  *13/08/2026 · Resp.: Vinícius*

### Consultoria — Fases 3 e 5 · encerradas por decisão
- [x] **Fase 3 (consultoria gratuita)** e **Fase 5 (formulário público → CRM)** — retiradas do
  âmbito por decisão de 13/08/2026. ⚠️ **Não foram construídas**: ficam registadas aqui para
  o histórico ficar honesto, não como funcionalidade entregue.
  *13/08/2026 · Resp.: Vinícius*

### Consultoria — Fase 2 · relatório gerado por IA + PDF
- [x] **`api/consultoria-relatorio.js`** — função serverless que gera o relatório com a API
  da Anthropic. A `ANTHROPIC_API_KEY` vive **só no servidor**, como a `service_role`;
  verificado que não entra no bundle. Só admin, e a ficha é lida no servidor pelo id —
  não se confia no conteúdo que o browser envia.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Seis secções na ordem do documento da IHK**, porque o destinatário é o banco. Os
  valores calculados e as duas verificações vão prontos no prompt — a IA cita, não recalcula.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Limite da Lúcia respeitado** — *"não é analítica, mas é o descritivo"*: a IA descreve
  o que foi preenchido e lista o que falta; não julga o negócio nem inventa números. Isto
  absorve a antiga Fase 4 (resumo com IA), que deixa de ser um item separado.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Texto dela ganha sempre** — cada secção é editável e a edição sobrevive a uma nova
  geração, com opção de descartar e voltar ao texto da IA.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Exportar em PDF** — botão Imprimir/PDF com folha própria, como no Relatório ESG.
  *Reunião 13/08/2026 · Resp.: Vinícius*

### Consultoria — Fase 1 · blocos 3 e 4 (os números)
- [x] **Retiradas privadas** — rendimentos e despesas do agregado, com o resultado que o
  documento pede: quanto o negócio tem de gerar por mês e por ano para a pessoa viver.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Necessidade de capital** — investimentos + custos de constituição + reserva, com a
  reserva a **sugerir-se sozinha** a partir dos custos do ano 1 do bloco 4 (os 3 meses que o
  documento recomenda); o valor manual sobrepõe-se à sugestão.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Financiamento** — capital próprio vs alheio (incluindo KfW), com **semáforo**: cobre a
  necessidade de capital ou faltam X?
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Projeção a 3 anos** — faturação líquida e custos por ano, lucro calculado, e a
  **verificação que fecha o plano**: o lucro de cada ano cobre as retiradas privadas mais as
  amortizações? Um semáforo por ano responde.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Previsão de liquidez** — 12 meses com saldo acumulado, assinalando **em que mês** a
  caixa fica negativa.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Linhas por omissão** nas seis tabelas (renomeáveis, removíveis, com adição livre) —
  referência e não dogma, como o resto do módulo.
  *Reunião 13/08/2026 · Resp.: Vinícius*

### Consultoria — Fase 0 · migração 029
- [x] **Tabela `consultorias`** — dados de contacto embutidos (a Lúcia regista **sem criar
  conta ao cliente**, como decidido) e ligações opcionais a `crm_leads` e `auth.users`.
  RLS só admin: verificado que um cliente não lê, não cria, não altera nem apaga.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Lista e ficha de consultoria** — criar pede só nome, empresa e tipo e abre logo a
  ficha; stepper dos 4 blocos com progresso; **guardar automático** (sem botão), porque é
  usada ao vivo com o cliente a ver o ecrã.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Blocos 1 e 2 com as 23 perguntas do documento da IHK** em PT/DE/EN (o alemão é o
  original). As respostas guardam-se **por chave**: reescrever uma pergunta não perde a
  resposta — a lista é referência, não dogma.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **SWOT e TOWS** — quatro quadrantes, e cada célula TOWS mostra os itens da SWOT que a
  alimentam; ao clicar marcam-se como **origem da estratégia**, que fica guardada com ela.
  É o *"com aquilo que descobri no SWOT, o que devo fazer?"* tornado rastreável.
  *Reunião 13/08/2026 · Resp.: Vinícius*
- [x] **Recursos só com links** (Instagram, comunidade, contactos), como decidido — sem
  ficheiros pesados.
  *Reunião 13/08/2026 · Resp.: Vinícius*

### Correções de QA e design — 13/08
- [x] **Zoom desbloqueado no telemóvel** — removido `maximum-scale=1.0` do `index.html`.
  *QA 13/08/2026 · Resp.: Vinícius*
- [x] **Contraste conforme WCAG AA** — `textMuted` 2.65:1 → **5.02:1** e `subtle` 2.10:1 →
  **4.66:1** no tema claro; `subtle` noturno 3.87:1 → **5.63:1**. Valores calculados, não
  escolhidos a olho, e a hierarquia entre os dois tons foi preservada.
  *QA 13/08/2026 · Resp.: Vinícius*
- [x] **Cartões "Em Caixa" / "No Banco"** — passam a empilhar no telemóvel, como os da linha
  de cima; o valor deixa de quebrar.
  *QA 13/08/2026 · Resp.: Vinícius*
- [x] **Painel respeita o tema noturno** — as 17 cores fixas do `Dashboard.jsx` passaram a
  tokens; acrescentados `toneBlue` e `toneOrange` ao tema, a par dos `dueOk/dueSoon/dueLate`
  que já existiam.
  *Revisão de design 12/08/2026 · Resp.: Vinícius*

### Acessos — Contabilidade Lite · migração 028
- [x] **Plataforma "Contabilidade Lite"** — variante que mostra apenas a secção *Contabilidade*
  do menu (Painel, Livro de Caixa, Catálogo, Obrigações Fiscais) e esconde a secção *Gestão*
  (Preços, Planeamento, Clientes, Empresa, Consultoria e Reservas & Impostos). Para clientes
  que só querem lançar e acompanhar. Escolhe-se na Gestão de Acessos, ao lado das outras
  plataformas; o bloqueio é de rota, não só de menu.
  *Levantado no desenvolvimento · Resp.: Vinícius*

### Acessos — palavra-passe pré-definida · migração 027
- [x] **Fluxo de convite substituído por palavra-passe temporária** — a conta nasce ativa, com
  senha gerada (12 caracteres, sem ambíguos) que a Lúcia copia e entrega. Sem link, sem prazo
  de 24h.
  *Levantado no desenvolvimento · Resp.: Vinícius*
- [x] **Mudança obrigatória no primeiro acesso** — `must_change_password` no perfil; enquanto
  não trocar, qualquer rota devolve o utilizador a `/definir-senha`. A marca é levantada por
  função de privilégio mínimo (evita que o utilizador altere o próprio `role`).
  *Levantado no desenvolvimento · Resp.: Vinícius*
- [x] **Requisitos da palavra-passe visíveis** — lista com validação em tempo real (8 caracteres,
  maiúscula, minúscula, número e caractere especial), nas três línguas, na mesma fonte que a
  validação usa.
  *Reunião 06/08/2026 · Resp.: Vinícius*
- [x] **"Redefinir palavra-passe"** substitui o reenvio de convite — serve para quem nunca
  entrou e para quem se esqueceu da senha.
  *Levantado no desenvolvimento · Resp.: Vinícius*

### Acessos — papéis de equipa · migração 026
- [x] **Papel "comercial"** (assistente Carla) — vê apenas o CRM; menu, rotas e RLS restritos.
  *Reunião 30/07/2026 · Resp.: Vinícius*
- [x] **Papel "marketing"** (gestor de tráfego Filipe) — vê apenas a página de Marketing.
  *Reunião 30/07/2026 · Resp.: Vinícius*
- [x] **Página `/gestao/marketing`** (placeholder) — espaço reservado para métricas Meta/Google,
  origem dos leads, formulários/e-book e desempenho de conteúdos.
  *Reunião 30/07/2026 · Resp.: Vinícius*

### ESG
- [x] **Priorizar o módulo ESG (materialidade / dupla materialidade)**
  *Reunião 16/07/2026 · Resp.: Vinícius*
  ✔ Ciclo completo: diagnóstico multi-ano → dupla materialidade com eixo financeiro →
  projetos com payback → KPIs ao vivo → relatório descritivo com impressão/PDF.
- [x] **Implementar melhorias comentadas e incluir os KPIs de ESG informados pela Lúcia**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  ✔ KPIs 100% ao vivo (dados fictícios removidos), agrupados pelos temas materiais, com metas
  e variação ▲▼ face ao ano anterior.

### Contabilidade
- [x] **Aviso de valores estimados** no topo do Dashboard, Rücklagen & Steuern, Obrigações
  Fiscais, Precificação e Planeamento Mensal — trilingue.
  *Reunião 30/07/2026 · Resp.: Vinícius* — sugestão do Filipe, protege a Lúcia de
  divergências com as Finanças
- [x] **Inglês com as regras de Portugal** — verificado: as regras fiscais seguem sempre o campo
  *País* da empresa (PT/DE), nunca a língua; não existe empresa inglesa.
  *Reunião 30/07/2026 · Resp.: Vinícius*
- [x] **Despesas recorrentes** (catálogo) + integração no fluxo de caixa (saídas previstas).
  *Anotações anteriores · Resp.: Vinícius*
- [x] **Calendário fiscal automático** (IVA e Segurança Social) com sistema de notificações.
  *Anotações anteriores · Resp.: Vinícius*
- [x] **Visão do IVA** no Dashboard — liquidado, dedutível e a entregar/recuperar.
  *Anotações anteriores · Resp.: Vinícius*
- [x] **Reserva de IR** com percentagem definida pelo utilizador.
  *Anotações anteriores · Resp.: Vinícius*
- [x] **Material consumido** na calculadora de serviços · **Margem de contribuição** e ponto de
  equilíbrio no Dashboard.
  *Anotações anteriores · Resp.: Vinícius*

### Plataforma e gestão
- [x] **Desenvolver a primeira versão do sistema de gestão interno para a Lúcia**
  *Reunião 16/07/2026 · Resp.: Vinícius*
  ✔ Clientes Ativos, ficha do cliente (documentos + histórico), CRM, Financeiro, Marketing e
  Gestão de Acessos.
- [x] **Verificar como a Lúcia acede às informações inseridas pelos clientes (ex.: Célia)**
  *Reunião 16/07/2026 · Resp.: Vinícius*
  ✔ "Ver como" (só leitura) + Clientes Ativos com indicadores + ficha de dados e histórico.
- [x] **Corrigir botão/acesso da parte de ESG para centralizar o login na conta própria**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  ✔ Contas com as duas plataformas (`both`) e toggle no menu, incluindo durante o "Ver como".
- [x] **Clientes de demonstração** (GrünBau · Café Lisboa) com ESG e contabilidade preenchidos,
  incluindo os projetos de frota elétrica e painéis fotovoltaicos.
  *Levantado no desenvolvimento · Resp.: Vinícius*
- [x] **Performance** — code splitting por rota (arranque de 830 kB → 477 kB).
  *Levantado no desenvolvimento · Resp.: Vinícius*

> Descartado por decisão do Vinícius: **versão "sem login"** — *"desconsidere, isso não é
> necessário"*.
