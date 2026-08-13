# Backlog de Desenvolvimento — Lúcia Cílio

> **Fontes:** reuniões do sistema interno Scalasys (tabela `meetings`) + itens levantados
> durante o desenvolvimento
> **Cliente:** Lúcia Cílio · Lúcia Cílio
> **Última sincronização:** 13/08/2026 · Reuniões processadas: 16/07/2026, 23/07/2026,
> 30/07/2026, 06/08/2026, 13/08/2026
> **Auditorias:** QA de interface 13/08/2026 → `docs/auditorias/2026-08-13-interface.md`
> **Prazo do projeto:** início de maio → início de novembro de 2026 (6 meses)
>
> **Convenção:** itens concluídos saem das secções de cima e passam para
> **[Concluídos](#concluídos)**, no fim do ficheiro. As secções ativas mostram só o que falta.

---

## Itens de desenvolvimento

### Consultoria — módulo novo (prioridade da reunião de 13/08)

- [ ] **Consultoria — Fase 3: o tipo "consultoria gratuita"**
  *Reunião 13/08/2026 · Resp.: Vinícius*
  O outro produto: 1 sessão, *"para entender o negócio e que serviços posso oferecer"*.
  O tipo já existe na tabela; faltam as perguntas.
  ⚠️ **Depende de:** o formulário de consultoria gratuita, que a Lúcia envia.

- [ ] **Consultoria — Fase 5: formulário público → consultoria + lead no CRM**
  *Reunião 13/08/2026 · Resp.: Vinícius*
  ⚠️ **Depende de:** o formulário dela e o alinhamento com o Filipe.

- [ ] **Importação de extrato bancário (CSV/Excel) com reconciliação caixa/banco**
  *Reunião 13/08/2026 · Resp.: Vinícius*
  Ficheiro em vez de integração bancária direta — decisão tomada na reunião. Inclui o *match*
  entre o que vem do extrato e os lançamentos já existentes no Livro de Caixa.

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

### Documentação

- [ ] **`docs/SEGURANCA_DADOS.md` — documento de segurança e backup**
  *Reunião 16/07/2026 · Resp.: Vinícius*
  Para o projeto jurídico/legal da Lúcia (exigência na Alemanha).
  ⚠️ **Depende de:** ela continua à procura de advogada.

---

## Validações técnicas

- [ ] **Investigar soluções de backup e onde os dados ficam guardados (AWS / ferramentas Microsoft)**
  *Reunião 16/07/2026 · Resp.: Vinícius*
  Comparar com a proposta Microsoft (100–200 €/mês para 50 utilizadores) e apresentar custos.
  Alternativas (AWS/GCP) tendem a ser mais baratas.

- [ ] **Investigar viabilidade e custos da integração do Instagram (API da Meta) para captura de leads**
  *Reunião 23/07/2026 · Resp.: Vinícius*
  A API mudou recentemente; validar antes de prometer prazo. Inclui a importação dos ~250
  contactos existentes, com triagem manual pela Lúcia, e a mensagem inicial de abordagem.

---

## Diretrizes de produto (das reuniões — guiam a priorização)

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
