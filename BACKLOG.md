# Backlog de Desenvolvimento — Lúcia Cílio

> **Fontes:** reuniões do sistema interno Scalasys (tabela `meetings`) + itens levantados
> durante o desenvolvimento
> **Cliente:** Lúcia Cílio · Lúcia Cílio
> **Última sincronização:** 20/08/2026 · Reuniões processadas: 16/07/2026, 23/07/2026,
> 30/07/2026, 06/08/2026, 13/08/2026, 20/08/2026
> **Auditorias:** QA de interface 13/08/2026 → `docs/auditorias/2026-08-13-interface.md`
> **·** Segurança/GDPR 21/08/2026 → `docs/auditorias/2026-08-21-seguranca-gdpr.md`
> **Prazo do projeto:** início de maio → início de novembro de 2026 (6 meses)
>
> **Convenção:** itens concluídos saem das secções de cima e passam para
> **[Concluídos](#concluídos)**, no fim do ficheiro. As secções ativas mostram só o que falta.

---

## Itens de desenvolvimento

### Consultoria — módulo novo (prioridade da reunião de 13/08)

- [ ] **Remover perguntas/itens não desejados do fluxo de consultoria**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  A estrutura já foi desenhada para isto: as perguntas vivem em
  `src/data/consultoriaBlocos.js` e remover não perde respostas.
  ⚠️ **Depende de:** a Lúcia indicar quais.

### Cybersecurity e Compliance (auditoria de 21/08 — pedido da Lúcia)

> Relatório completo: `docs/auditorias/2026-08-21-seguranca-gdpr.md`. Ordem de ataque:
> primeiro os ⚡, depois a infraestrutura (região/ambientes/backups), depois direitos e
> rasto (exportação, MFA, audit), com o pacote documental em paralelo com a advogada.

- [ ] **⚡ Eliminação completa do cliente: apagar também os ficheiros do Storage**
  *Auditoria 21/08/2026 · Resp.: Vinícius*
  Apagar o utilizador remove as 15 tabelas em cascata, mas a pasta dele no bucket
  `client-docs` fica órfã — não-conformidade direta com o art. 17 do RGPD. Correção no
  `api/admin-users.js`: listar e remover `client-docs/<uid>/**` antes do `deleteUser`.

- [ ] **⚡ Tirar o `.env.local` (service_role) da pasta sincronizada com o OneDrive**
  *Auditoria 21/08/2026 · Resp.: Vinícius*
  A chave está fora do Git mas é copiada para a nuvem da Microsoft a cada gravação. Mover o
  projeto para fora do sincronizador, ou excluir o ficheiro da sincronização.

- [ ] **R1 · Migrar a produção para um projeto Supabase em Frankfurt (eu-central-1)**
  *Auditoria 21/08/2026 · Resp.: Vinícius*
  ✅ Região confirmada a 21/08: **us-west-2 (Oregon, EUA)** — fora da UE, logo o projeto
  novo em Frankfurt é a **produção** e o atual vira dev. Runbook completo passo a passo em
  `docs/MIGRACAO_FRANKFURT.md` (~1h de janela; senhas sobrevivem; sessões caem uma vez).
  Decidir na criação: plano **Pro** (fecha também o R3, backups).

- [ ] **R2 · Fixar as funções serverless da Vercel em Frankfurt (`fra1`)**
  *Auditoria 21/08/2026 · Resp.: Vinícius*
  Uma linha no `vercel.json` (`"regions": ["fra1"]`) — hoje correm sem região fixada (o 504
  de 20/08 mostrou gru1/São Paulo). 5 minutos.

- [ ] **R3 · Confirmar/ativar backups automáticos no Supabase**
  *Auditoria 21/08/2026 · Resp.: Lúcia + Vinícius*
  Painel → Database → Backups. Plano gratuito não tem backups — seria bloqueador para dados
  reais. Avaliar Pro (diários, 7 dias, na região do projeto) e o extra PITR. Decisão de
  custo, não de código.

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

- [ ] **Bandas de faturação do formulário não encaixam nas do CRM** — o formulário de
  diagnóstico usa bandas **mensais** (até 1.000 € … >10.000 €); o `REVENUE_RANGES` do CRM usa
  bandas **anuais** que começam onde aquelas acabam (10.000 €/mês = 120 mil/ano cai já na 2.ª
  banda do CRM). Se um dia estes leads entrarem no CRM sem conversão, a pontuação sai errada.
  Converter, ou acrescentar bandas baixas ao CRM — esta segunda parece mais honesta, porque
  são clientes mais pequenos do que o CRM assume hoje.
  *13/08/2026 · Resp.: Vinícius*

- [ ] **Perguntas do bloco 1 assumem que o negócio ainda não abriu** — *"Quando quero iniciar
  a atividade?"*, *"Em que localização quero começar?"*. Para quem já fatura, leem-se mal.
  Hoje a ficha **avisa** quando o Bloco 0 diz que já iniciou, mas não adapta as perguntas.
  Avaliar uma variante do bloco 1 para negócio em curso.
  *13/08/2026 · Resp.: Vinícius*

- [ ] **Vulnerabilidade alta no `react-router`** — CSRF por `PUT/PATCH/DELETE` em pedidos de
  documento (`npm audit`). É a única das 7 que está em dependência de execução, não de build.
  Avaliar a atualização.
  *13/08/2026 · Resp.: Vinícius*

### QA de interface — achados de 13/08

> Da auditoria automática + inspeção das 48 capturas (16 ecrãs × 3 tamanhos), em produção com
> a conta de demonstração. Relatório completo: `docs/auditorias/2026-08-13-interface.md`.
> Severidade: 🟠 atrapalha · 🟡 incomoda · 🔵 oportunidade. Zero bloqueadores.

- [ ] **🟠 Subir os textos abaixo de 12px** — 36 elementos só no Painel; `OFFICE CONSULTING`
  a 9px, rótulos de secção a 10px. Agora que o zoom e o contraste estão corrigidos, este é o
  que resta do trio de legibilidade.
  *QA 13/08/2026 · Resp.: Vinícius*

- [ ] **🟠 Associar rótulos aos campos de formulário** — 36 ocorrências, incluindo o login.
  Sem `label for`/`aria-label`, o leitor de ecrã não liga rótulo a campo e tocar no texto não
  foca o campo.
  *QA 13/08/2026 · Resp.: Vinícius*
- [ ] **🟠 Estado de carregamento do Painel** — apanhado em "A carregar…" com o ecrã vazio e o
  botão "+ Nova Entrada" já visível, a convidar a agir sobre nada. Sugestão: esqueleto de
  carregamento e esconder o botão enquanto não há dados.
  *QA 13/08/2026 · Resp.: Vinícius*
- [ ] **🟡 Matriz de materialidade no fim da página no telemóvel** — é preciso passar pelos 16
  temas (~9.000 px) para a ver. No computador está fixa à direita. É o resultado da página.
  *QA 13/08/2026 · Resp.: Vinícius*
- [ ] **🟡 Alvos de toque abaixo de 44×44 px** — 32 ocorrências; o botão "Mostrar" da
  palavra-passe tem 42×17.
  *QA 13/08/2026 · Resp.: Vinícius*
- [ ] **🟡 Campos com fonte < 16px fazem o iPhone ampliar sozinho** — 12 ocorrências,
  incluindo o login (14px).
  *QA 13/08/2026 · Resp.: Vinícius*
- [ ] **🟡 Oito ecrãs sem `<h1>`** — Painel, Livro de Caixa, Obrigações, Precificação,
  Catálogo, Clientes, Empresa e login começam direto nos controlos. As páginas de ESG e as
  mais recentes têm cabeçalho — a inconsistência é entre as antigas e as novas.
  *QA 13/08/2026 · Resp.: Vinícius*
- [ ] **🟡 Tabela do Planeamento Mensal exige rolagem lateral no telemóvel** — largura mínima
  de 1120px; veem-se 3 de 12 colunas e os cabeçalhos truncam. Sugestão: cartão por linha no
  telemóvel.
  *QA 13/08/2026 · Resp.: Vinícius*

- [ ] **🔵 Livro de Caixa sem paginação** — com os 30 lançamentos da conta demo a página tem
  ~8.000 px no telemóvel. Com um ano real de dados, será várias vezes isso.
  *QA 13/08/2026 · Resp.: Vinícius*

### Internacionalização

- [ ] **Formatação de números não acompanha a língua da interface**
  *QA 13/08/2026 · Resp.: Vinícius*
  **13 ficheiros** fixam `toLocaleString('pt-PT')`, por isso um utilizador com a interface em
  alemão ou inglês vê números à portuguesa (`11 400,00` em vez de `11.400,00`). O módulo
  Rücklagen é a exceção — usa `de-DE` corretamente, o que torna a plataforma inconsistente
  consigo própria.
  **Nota:** a diferença entre `7200,00` e `11 400,00` **não é bug** — é regra do português
  europeu (números de 4 dígitos não levam separador). O problema é outro: a língua fixa.

### CRM e prospeção

- [ ] **Entrada automática de leads dos formulários (JotForm / landing page / e-book) para o CRM**
  *Reunião 30/07/2026 · Resp.: Vinícius*
  A Lúcia vai lançar um e-book ("o que fazer depois de abrir atividade") com formulário —
  *"todos estes dados, isto é CRM, não é? São leads"*. O campo `source` já está pronto a
  recebê-los.
  ⚠️ **Bloqueado:** falta saber que campos os formulários vão enviar — a alinhar com o Filipe.

### Onboarding e primeiro acesso

- [ ] **Melhorar o fluxo de onboarding: pedir dados da empresa e país à entrada**
  *Reunião 06/08/2026 · Resp.: Vinícius*
  O país determina todas as regras fiscais (IVA, calendário, módulo alemão) — pedi-lo no
  primeiro acesso evita que o cliente veja números errados. Inclui a página/checklist de
  entrada do cliente novo (dados, documentos, acessos) e o botão **"Fazer Onboarding"** na
  visão do administrador, para a Lúcia conduzir o processo.

- [ ] **Rever a comunicação de entrega das credenciais**
  *Levantado no desenvolvimento · Resp.: Vinícius*
  Com o fim do convite por email, deixou de haver mensagem automática: a Lúcia entrega a
  palavra-passe temporária por WhatsApp/email à mão. Avaliar se vale um texto-modelo (com as
  boas-vindas, o endereço da plataforma e o aviso de que terá de a trocar) que ela copie, ou
  um email próprio enviado pela plataforma.

### Usabilidade e compreensão

- [ ] **Corrigir bug de tradução no módulo ESG (opções não renováveis não mudam de idioma)**
  *Reunião 06/08/2026 · Resp.: Vinícius*
  Bug encontrado em uso real — há opções que ficam fixas numa língua.

- [ ] **Adicionar ícone informativo (i) nos termos técnicos, como regime de IVA**
  *Reunião 06/08/2026 · Resp.: Vinícius*
  Já existe um `InfoTooltip` no projeto (usado no Livro de Caixa) — estender aos termos
  fiscais em Empresa, Dashboard e Rücklagen.

- [ ] **Criar glossário/base de conhecimento e eventual FAQ na plataforma**
  *Reunião 06/08/2026 · Resp.: Vinícius*
  Complementa os ícones informativos: explicação longa dos termos num sítio próprio.

- [ ] **Substituir a imagem estética do tratamento por uma imagem genérica na calculadora de preços**
  *Reunião 06/08/2026 · Resp.: Vinícius*
  A calculadora nasceu do caso da Célia (cosmética); a imagem não serve outros nichos.

### Consultoria e jornada do cliente

- [ ] **Validar o desenho da página de Consultoria com a Lúcia**
  *Reunião 30/07/2026 · Resp.: Vinícius*
  Está hoje focada em documentos; ficou de ser enviada para ela validar.

- [ ] **Permitir que o cliente envie documentos pela aplicação**
  *Reunião 30/07/2026 · Resp.: Vinícius*
  Hoje o cliente só consegue **ver e descarregar** (`DocsBrowser readOnly`); o envio é só do
  lado do admin.

- [ ] **Guião de reunião na ficha do cliente**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  Roteiro base (data, tema, próximos passos, diagnóstico) — *"para eu ter um guião básico
  também, quando eu abro isso"*.

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

- [ ] **Renomear "projeções" para "previsões" onde aplicável**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  Inclui o espaço para anotações (mesmo pedido do item acima — tratar juntos).

- [ ] **Indicador de break-even no somatório do Planeamento Mensal**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  Quanto falta faturar para cobrir os custos — no rodapé dos totais.

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

- [ ] **Remover utilizadores e dados de teste da plataforma**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  Contas demo e registos de ensaio que já não servem a demonstração.

- [ ] **Dashboard macro da gestão**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  Próximos pagamentos, pagamentos em aberto, faturação total — *"é mesmo mais na perspetiva
  comercial"* (controlling comercial).

- [ ] **Anexar o contrato (PDF) ao contrato do Financeiro**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  *"Contratos ficam aqui, qualquer coisa tem acesso."*

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

- [ ] **Validar o mapeamento de colunas da importação com extratos reais de vários bancos**
  *Reunião 20/08/2026 · Resp.: Vinícius*
  A deteção automática de formato já está construída (separador, decimais, débito/crédito,
  cabeçalho deslocado) e testada com extratos sintéticos PT/DE/EN — falta validá-la contra
  ficheiros reais.
  ⚠️ **Depende de:** os exemplos de CSV bancário que a Lúcia vai enviar.

- [ ] **Investigar soluções de backup e onde os dados ficam guardados (AWS / ferramentas Microsoft)**
  ↳ Cruza com o R3 da secção Cybersecurity e Compliance — tratar juntos.
  *Reunião 16/07/2026 · Resp.: Vinícius*
  Comparar com a proposta Microsoft (100–200 €/mês para 50 utilizadores) e apresentar custos.
  Alternativas (AWS/GCP) tendem a ser mais baratas.

- [ ] **Investigar viabilidade e custos da integração do Instagram (API da Meta) para captura de leads**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  A API mudou recentemente; validar antes de prometer prazo. Inclui a importação dos ~250
  contactos existentes, com triagem manual pela Lúcia, e a mensagem inicial de abordagem.

---

## Diretrizes de produto (das reuniões — guiam a priorização)

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
- ⚠️ **Não há ambiente de staging** — o `.env.local` aponta para o Supabase de produção. Testar
  escrita significa escrever na base real dos clientes; o QA de 13/08 correu só em leitura.

---

## Concluídos

### Cybersecurity e Compliance
- [x] **Confirmar a região do projeto Supabase** — confirmada a 21/08: `us-west-2`
  (Oregon, EUA), fora da UE. Define o caminho do R1: migração para Frankfurt com o projeto
  atual a virar dev. Runbook em `docs/MIGRACAO_FRANKFURT.md`.
  *Auditoria 21/08/2026 · Resp.: Vinícius*

### Reunião de 20/08 — entregue no próprio dia
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
