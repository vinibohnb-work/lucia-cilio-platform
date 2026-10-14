# Backlog de Desenvolvimento — Lúcia Cílio

> **Fontes:** reuniões do sistema interno Scalasys (tabela `meetings`) + itens levantados
> durante o desenvolvimento
> **Última sincronização:** 08/10/2026 · Reuniões processadas: 16/07, 23/07, 30/07, 06/08,
> 13/08, 20/08, 27/08, 10/09, 18/09, 25/09, 01/10 e 08/10/2026
> **Auditorias:** Simplificação da Gestão 12/10 → `docs/auditorias/2026-10-12-simplificacao-gestao.md`
> **·** Simplificação da ficha do cliente 12/10 →
> `docs/auditorias/2026-10-12-simplificacao-ficha-cliente.md` **·** QA de interface 13/08 → `docs/auditorias/2026-08-13-interface.md` **·**
> Segurança/RGPD 21/08 → `docs/auditorias/2026-08-21-seguranca-gdpr.md` **·** Jornada, etapa 1
> 05/10 → `docs/auditorias/2026-10-05-jornada-etapa1.md` **·** Permissões 11/10 →
> `docs/auditorias/2026-10-11-permissoes.md`
> **Prazo do contrato:** 14/11/2026 · pausa em dezembro, retoma em fevereiro.
> **Ambientes:** produção (Supabase LC Office EU, Frankfurt) · DEV `jlgqvetehwpmywghpabz`
> (Frankfurt, só dados fictícios; chave pública em `.env.dev.local`).
>
> **Convenção:** a **Checklist de fecho** é a única lista do que falta até 14/11. O que não entra
> em novembro está em **Depois da entrega**. Concluídos saem da checklist e passam para
> **[Concluídos](#concluídos)**, no fim. **⏳** = precisa da Lúcia ou de terceiros;
> `⚠️ **Depende de:**` = bloqueado por outro item.

---

## Checklist de fecho — versão final para entrega (até 14/11)

> Ordem de ataque. O que não tem ⏳ faço eu. O 5 (conferir as fichas dos clientes e gerar os
> calendários) saiu a 12/10: fica direto com a Lúcia. Já feitos (ver Concluídos): 1, 2, 3, 4, 29, 13-A, 13-B,
> 13-C, 14, 16, 16-A, 18, 21, 22, 23.

**Uma sessão de decisões com a Lúcia** (tudo numa reunião — de preferência junto com a 16-B)
> Pauta pronta para 15/10: https://claude.ai/artifact/3PMoZe1bguw3JPVcszRNmv — 30 decisões com
> recomendação (pontos 6–8, 16-B, fase C da simplificação, acessos, domínio próprio do item 26), páginas do cliente a marcar
> (ponto 9) e pedidos (ponto 10). No fim, "Copiar resumo" dá o texto para aplicar as decisões.
- [ ] **6.** Dúvidas da etapa 1: calendário de um cliente novo só a partir de "cliente desde"
  (hoje Q1–Q3 nascem "em atraso"); conta nova em **Lite** ou completa; onde o cliente muda a
  **língua** (um alemão vê PT); **relatórios trimestrais** visíveis ao cliente já ou só PDF; o
  que interessa da aba "Conta na plataforma".
- [ ] **7.** Pendentes da Fase 1 da simplificação:
  · **O que as contas comercial e marketing veem** — hoje leem todas as fichas, obrigações e
    ficheiros dos clientes (teste de permissões, 11/10). A Letícia passou a admin a 08/10.
  · **Reserva de imposto** (R-B5): sobre o resultado com ou sem o IVA por pagar; o "Total" de
    Reservas soma o ano com um mês.
  · **Contabilidade → Clientes** (R-D7): sai ou fica.
  · **Dia de pagamento** de cada imposto, para as mensagens de WhatsApp (R-B11).
  · **Verificação em dois passos** obrigatória para admins? Hoje é opcional (Acessos).
  · Pontos de método da ESG (R-B10): CO₂ total vs scopes, rotatividade, sinal do gap
    salarial, "não se aplica" na materialidade, nomes das fases.
- [ ] **8.** **Calculadora de Preços** (R-B7): fechar as quatro regras — definições de margem,
  reserva de IR somada ao preço, IVA por omissão pela língua, catálogo bruto/líquido.
- [ ] **9.** Que **páginas do lado do cliente** são mesmo usadas — o que ninguém usa sai em vez
  de ser corrigido. Desbloqueia o 12.
- [ ] **10.** Pedir o que depende dela: contacto da **I Love Design** + acesso ao Outlook (SMTP,
  domínio); **CSVs bancários** reais; **Excel** do contabilista; **8 passos do mentor Luís** e as
  perguntas a tirar da consultoria; regras do **limite de faturação em Portugal**; formato do
  **relatório fiscal PT**.

**Implementar as decisões e simplificar**
- [ ] **11.** As decisões dos pontos 6 a 8 (cada uma é pequena; a Calculadora é a maior).
- [ ] **12.** **Uma ficha por cliente** (Fase 2 da simplificação, ≈1 semana — o item mais
  pesado). Hoje o cliente existe em sete sítios sem chave comum (R-C1). A ficha da Gestão passa
  a ser o cliente: contratos, consultorias, casos ESG e leads apontam para ela; fechar um lead ou
  criar uma conta cria-a; ecrã para juntar duplicados. O perfil fiscal vive só na ficha (R-C2),
  os serviços decidem a plataforma (R-C4), e notas, mensagens, pagamentos e documentos num sítio
  só (R-C5, R-C7, R-C8). Contabilidade → Clientes sai da conta da Lúcia (se o 7 confirmar).
  Migração: branch + teste no DEV antes da produção.
  ⚠️ **Depende de:** pontos 7 e 9.
- [ ] **13.** **Ligar o portal do cliente**: a vista do cliente passa a ser a do portal, só
  informativa e sem valores (decidido a 25/09 e 08/10): obrigações, documentos pedidos,
  mensagens e relatórios (se o 6 disser que sim). Falta: políticas de leitura nas tabelas novas,
  decidir o que sai da v1, **níveis de acesso conforme o serviço contratado** (18/09) e o
  **guião de reunião** nas Notas internas (23/07).
  ⚠️ **Depende de:** ponto 12.
- [ ] **13-D.** **Revisão ecrã a ecrã para simplificar**, antes de os clientes testarem — sobre o
  12 e o 13, com as anotações da Letícia (chegam pelo WhatsApp). Prazo combinado: 3/11.
  Inclui o resto do R-B11: campos que gravam a cada tecla. *Reunião 08/10*
  **Ficha do cliente: feita a 12/10** (ver Concluídos). Faltam as decisões da Lúcia — estados vs
  checklist, separador Relatórios, separador Conta na plataforma, campo Software, data editável na
  tabela, horas e avença na ficha (juntar ao ponto 7).
  **Resto da Gestão avaliado a 12/10** → `docs/auditorias/2026-10-12-simplificacao-gestao.md` (síntese)
  + `docs/auditorias/simplificacao-gestao/` (detalhe ecrã a ecrã). 12 erros a corrigir (E1–E12, o
  mais urgente: Notas internas da consultoria no PDF do banco), menu de 14 → 10–12 itens, 13
  perguntas para a Lúcia. **Fases A (erros) e B (sem decisão) aplicadas a 13/10** (ver Concluídos).
  ⏳ Fase C: as 13 perguntas da síntese (§6) vão à reunião com a Lúcia, junto com os pontos 6–10.
- [ ] **15.** Consultoria: tirar as perguntas indicadas pela Lúcia e absorver os 8 passos do
  mentor (podem mudar a estrutura, não só tirar perguntas). As perguntas vivem em
  `src/data/consultoriaBlocos.js`; remover não perde respostas. ⏳ Ponto 10.
- [ ] **16-B.** **Validação visual com a Lúcia — semana de 13 a 17/10.** A identidade nova está
  publicada como **V2** em https://lucia-cilio-platform.vercel.app/v2 — a plataforma de produção
  inteira (Gestão, área do cliente, ESG), com os dados e as contas reais, só com outro tema; a
  V1 continua igual em `/`. Na sessão: aprovar a V2, fonte do corpo (Arial Nova precisa de licença
  web; senão Archivo), modo noturno. Aprovada, a V2 passa a ser a única: os tokens de
  `THEMES_V2` em `src/theme.js` substituem os da V1 e sai `src/lib/v2.js`.
  ⏳ Sessão com a Lúcia e a Letícia.

**Validação com utilizadores reais**
- [ ] **17.** **Etapa 2 com a Nicole** (conta real dela), com o roteiro de 20 passos da etapa 1;
  corrigir o que aparecer.
- [ ] **19.** Validar a **importação de extratos** com CSVs reais de vários bancos. A deteção de
  formato já está feita e testada com extratos sintéticos PT/DE/EN. ⏳ Ponto 10.
- [ ] **20.** **Etapa 3 com a Vânia** (cliente externa); últimas correções.

**Segurança, documentação e entrega**
- [ ] **24.** RGPD com a advogada: **pacote documental (R6)** — política de privacidade (com URL
  público), registo de tratamento, retenção/eliminação (incluindo registos com `user_id = null`),
  procedimento de data breach (72 h) e DPA/AVV de Supabase, Vercel e **Anthropic** (o relatório
  de consultoria envia a ficha à API, nos EUA). ⏳ Lúcia + advogada.
- [ ] **25.** **Guia da plataforma** completo: integrações (e-mail SMTP, pasta de documentos,
  relatório com IA, WhatsApp só com texto, Vercel, Supabase em Frankfurt) e prints atualizados
  (Empresa, Obrigações, Reservas, portal do cliente). Fica para o fim, depois da simplificação.
- [ ] **26.** **Domínio próprio e e-mail**: servir a plataforma do domínio do site da Lúcia
  (Vercel + DNS) e resolver o erro de certificado SMTP no Outlook. ⏳ I Love Design (acesso ao
  domínio) e acesso ao Outlook.
  14/10: a gestora do site pediu o IP do servidor — a Vercel não tem IP fixo nosso; liga-se um
  subdomínio (ex.: `app.`) com um registo CNAME que a Vercel indica ao acrescentar o domínio. Depois:
  Site URL e retornos no Supabase, `VITE_APP_URL` na Vercel. Na pauta de 15/10.
- [ ] **27.** **Relatório fiscal PT** em versão detalhada e resumida, uma língua por relatório (o
  EÜR alemão já existe). Se o formato não chegar, passa para depois. ⏳ Ponto 10.
- [ ] **28.** **Sessão de entrega** com a Lúcia: percorrer o guia, as decisões, o que ficou para
  depois e o modelo de suporte da pausa. Tudo o que sobrar vai para "Depois da entrega".

---

## Depois da entrega

> Continuam a fazer sentido, mas não contam para 14/11 — por decisão de reunião ou porque
> dependem de terceiros sem data.

**Produto**
- [ ] **App nativa (Android e iOS) com Capacitor** — base web feita a 16/09. Faltam: Android
  (`.aab` para a Play Store, já autorizada), iOS (precisa de Mac/Xcode ou build na nuvem; a Apple
  rejeita cascas puras) e o que justifica a app: câmara para faturas, notificações push,
  biometria. Antes de publicar: política de privacidade pública e *Data Safety* da Play.
  *Reuniões 10/09 e 16/09*
- [ ] **Consultoria de organização administrativa** — blocos, formulário e relatório, como a da
  IHK. ⏳ A Letícia desenhar o serviço com a Lúcia. *Reunião 10/09*
- [ ] **Bloco 1 da consultoria para negócio em curso** — as perguntas assumem que o negócio ainda
  não abriu. Hoje a ficha só avisa. *Achado 13/08*
- [ ] **Glossário / FAQ na plataforma** — complementa os ícones (i). *Reunião 06/08*
- [ ] **Retirar `user_id` das quatro tabelas ESG** (e o `scripts/seed_demo_esg.mjs` passa a criar
  o caso), quando o modelo por casos tiver dado a volta com dados reais. *Achado 19/09*

**Contabilidade**
- [ ] **Lançamento dividido (split)** no Livro de Caixa — confirmar se ela precisa antes de
  construir. *Imagens de 20/08*
- [ ] **PDF do painel e valores visíveis nos gráficos**. *Reunião 20/08*
- [ ] **Reserva pessoal** na Empresa (meta configurável, não os movimentos privados) e **painel
  consolidado de reservas** (IVA + IR + pessoal) no Painel. *Anotações anteriores*
- [ ] **Limite de faturação de Portugal** (hoje só o alemão, Familienversicherung). ⏳ Regras.
  *Reunião 23/07*
- [ ] **Exportação no formato do Excel da Lúcia**. ⏳ O ficheiro. *Reunião 23/07*

**Integrações e jornada**
- [ ] **Agendamento do diagnóstico de 20 min** e **integração de calendários** (Outlook/Google
  ou Calendly — a segunda é mais rápida e reversível). *Reuniões 30/07 e 10/09*
- [ ] **WhatsApp integrado** — em segundo plano desde 25/09; os modelos que abrem o WhatsApp com
  o texto pronto cobrem o essencial. *Reunião 18/09*
- [ ] **Instagram (API da Meta)** para captura de leads, incluindo os ~250 contactos existentes.
  ⏳ A Lúcia apurar com o Filipe. *Reunião 23/07*
- [ ] **Analytics Meta/Google** na aba de Marketing. ⏳ Alinhar com o Filipe. *Reunião 30/07*
- [ ] **IA nas transcrições de reunião** — resumo, próximos passos e checklist, com a Lúcia a
  validar (*human-in-the-loop*). *Reunião 23/07*
- [ ] **Mapa da jornada do cliente** (documento antes de automatizar): Instagram/formulário →
  filtro → contacto → diagnóstico de 20 min → serviço. *Reunião 30/07*

**SaaS (quando a plataforma for vendida)**
- [ ] **R5b · Audit log** — quem acedeu ou alterou o quê, incluindo o "ver como". 2–3 dias.
  *Auditoria 21/08*
- [ ] **Aceite dos termos de uso**, com registo de quem, quando e que versão. Anda com o R6.
  *Reunião 10/09*

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

---

## Concluídos

### Simplificação da Gestão, fases A e B — 13/10 (13-D)
- **Erros corrigidos (E1–E12):** as Notas internas da consultoria já não vão para o PDF do banco
  (a IA continua a recebê-las, marcadas como contexto interno que nunca se cita) — **decisão
  confirmada pelo Vinícius a 14/10: ficam fora**; o contrato criado
  no CRM pede a ficha e grava `cliente_id`; o Financeiro escolhe o cliente da lista de fichas (sem
  ligar pelo nome em silêncio); campo Etapa no lead (o CRM passa a funcionar no telemóvel);
  "Criar acesso" do CRM leva a Acessos já preenchido (mensagem de boas-vindas, sem palavra-passe
  num alerta); o relatório da consultoria grava ao sair e avisa quando falha; "Fechar" do
  relatório trimestral pergunta antes de perder o que foi escrito; "Marcar como enviado (fica
  visível ao cliente)"; tarefa nova atribuída a quem a cria; a Agenda abre a tarefa para editar;
  sem estados escritos à mão; "+N — ver todas" no Início.
- **Menu:** Início, Clientes, Agenda, Tarefas, Mensagens, Horas, Relatórios trimestrais ·
  COMERCIAL Prospeção, Diagnósticos, Marketing · SERVIÇOS Consultorias, Consultorias ESG ·
  ESCRITÓRIO Financeiro, Acessos. Um ícone por item; contador de por ler passa para Mensagens; sem
  as iniciais no rodapé; bandeiras como botões.
- **Ecrãs:** Início só com os cartões Tarefas e Pendências (+ botão de horas); lista de clientes
  sem iniciais, país em chip, estado só quando não é ativo, inativos escondidos por omissão;
  Relatórios com os 3 trimestres fechados; Mensagens sem avatares e com "Outros clientes"; Agenda
  com Mês e Dia; Tarefas com pílulas Hoje · 7 dias · Em atraso · Todas; Horas com totais numa
  linha ("Nova tarefa" na linha dos filtros); CRM sem filtro de temperatura, cartões mais limpos, eliminar dentro do lead; Diagnósticos
  com "Copiar ligação" e respostas legíveis; Financeiro com 2 indicadores e o mês por extenso;
  Acessos sem o campo Serviço, equipa e clientes separados; Consultorias criadas só com o essencial,
  bloco atual calculado, Enquadramento recolhível, SWOT só com Enter, Recursos clicáveis; ESG com
  "Cliente vê: Sim/Não" e "Apresentar ao cliente"; Apresentação imprime sempre em claro.
- Emojis trocados por ícones e cores fixas por tokens do tema nos ecrãs tocados. Tudo o que tem ⏳
  ficou como estava. Testado no ambiente local (V1 e V2, computador e telemóvel).

### Logótipo do cliente — 12/10 (item 29, migração 045)
- Coluna `clientes.logo`, bucket público `logos` (só PNG/JPEG/WebP, até 2 MB; cada cliente escreve
  só na sua pasta, a equipa em todo o bucket) e função `definir_logo_cliente` (o cliente grava na
  sua ficha sem poder alterar o resto). Testada no DEV; corrida pelo Vinícius na produção a 12/10.
- Ficha: logótipo no lugar das iniciais; sem logótipo, a equipa vê o espaço "+ Logótipo" para o
  carregar. Dados do cliente: carregar, trocar, remover. Conta do cliente: Empresa → Geral →
  "Logótipo da empresa" (PT/DE/EN). Onboarding: passo "Logótipo da empresa".

### Simplificação da ficha do cliente — 12/10 (13-D, primeiro ecrã)
- Avaliação em `docs/auditorias/2026-10-12-simplificacao-ficha-cliente.md`; aplicado o que não
  precisava da Lúcia.
- **Cabeçalho:** sem o quadrado das iniciais; o estado só aparece quando não é "Ativo"; uma linha
  de perfil só com o que está preenchido (setor · serviço · forma · regime); contactos clicáveis
  com ícones; sai o botão "Mensagem" (3 botões).
- **Separadores 9 → 8:** o separador Tarefas passou para o Resumo (endereços antigos voltam ao
  Resumo). Relatórios e Conta na plataforma esperam pela Lúcia.
- **Resumo:** dois cartões — Obrigações em aberto e Tarefas (todas as abertas, com "Ver
  concluídas"). Saíram os indicadores, a checklist, a comunicação rápida e as declarações
  entregues (estas ficam só na vista do cliente).
- **WhatsApp num sítio só:** botão do cabeçalho (e no detalhe de cada obrigação, que já vem com a
  obrigação escolhida). Mensagens fica só com a conversa.
- **Obrigações:** sem o cartão dos critérios (texto num (i)); "+ Obrigação" e "Gerar calendário" na
  barra do ano; sem contador nem "Processo"; período por baixo do nome.
- **Documentos:** agrupamento segue a periodicidade do cliente (sai a alternância).
- **Notas internas:** sai o cartão "Responsável e serviços".
- **Dados:** exportação RGPD e eliminar ficha dentro de "Mais ações" (fechado). Campos de texto,
  montante e notas das obrigações gravam ao sair do campo (R-B11).
- **Etiquetas:** "Visível ao cliente" desaparece; "Área interna" passa a um cadeado (em todo o
  portal da Gestão).

### V2 com a identidade visual — 12/10
- A plataforma de produção com a identidade da LC Office (paleta do documento da Letícia, Archivo
  Black nos títulos, Arial Nova/Archivo no corpo, tema claro e noturno) servida em **`/v2`** do
  mesmo site: mesmo código e mesmos dados, para a Lúcia e a Letícia validarem com as contas delas.
- Como funciona: `src/lib/v2.js` deteta o caminho `/v2`; `src/theme.js` escolhe `THEMES_V2` e
  `BRAND_V2` (tokens da branch `identidade-visual`, com os da V1 por baixo para nada ficar sem
  cor); o router usa `basename="/v2"`; o CSS troca as variáveis com `html.v2` e endireita os
  títulos itálicos (eram para a Cormorant); ligações `<a href>` levam o prefixo; o relatório de
  consultoria sai com as fontes e cores novas. A V1 não muda.

### Logótipo novo — 12/10
- Logótipo "Office Consulting" com letras brancas (enviado pelo Vinícius) em fundo transparente:
  `public/logo-letra-branca.png` (fundos escuros) e `public/logo-letra-verde.png` (fundos claros;
  o anterior, recortado). O tema escolhe o certo (`t.logoSrc`); sai o `logo.png`.
- Menu lateral: só o logótipo, centrado na largura do menu (saem "Lúcia Cílio" e "Office
  Consulting"). Login, Definir palavra-passe e Formulário de diagnóstico com o logótipo novo; no
  login saem o título "Lúcia Cílio" e o subtítulo "Office Consulting" — fica só o logótipo.
- Ícones da app (PWA, favicon, iOS) regenerados com o monograma novo; capa do guia em PDF usa-o.
- Capa do relatório de consultoria: o logótipo no lugar do "Lúcia Cílio"; logótipo do menu
  lateral com 130 px.

### Ficha duplicada da Célia apagada — 12/10 (item 4)
- Saiu a ficha registada como **Alemanha**, sem conta nem dados ligados; ficou a que tem os
  dados. Apagada pelo Vinícius na produção com `apagar_ficha_celia_alemanha.sql` (fora do git),
  que só apagava se fosse a única ficha da Célia na Alemanha e estivesse vazia.
- O item 5 (conferir as fichas e gerar os calendários) saiu da checklist: fica com a Lúcia.

### Projeto fora do OneDrive — 12/10

- [x] **3. `.env.local` fora da pasta sincronizada** *(auditoria 21/08)* ✔ O projeto passou para
  `C:\Dev\scalasys\1. CLIENTES\LC OFFICE - Lúcia Cílio`, fora do OneDrive, com os outros projetos de
  clientes. A chave `service_role` deixa de ir para a nuvem da Microsoft. Falta só esvaziar a
  Reciclagem do OneDrive (onedrive.live.com) para apagar a cópia antiga. Rodar a chave no
  Supabase fica opcional.

### Teste de permissões, ambiente DEV e projeto antigo — 11/10 (migração 044)

- [x] **Ambiente DEV** *(10/10)* ✔ Projeto novo em Frankfurt (`jlgqvetehwpmywghpabz`), montado
  com o `DEV_SETUP` + migrações 040–044, só com dados fictícios. Serve de staging: as migrações
  passam a ser testadas aqui antes da produção.
- [x] **Verificação de permissões na base** *(etapa 1, 05/10)* ✔ Leitura bem isolada (o cliente A
  nunca vê o B; anónimo não lê nada); 35 escritas testadas → `docs/auditorias/2026-10-11-permissoes.md`.
  Três achados corrigidos na **migração 044** (aplicada na produção a 11/10): "+ Nova Obrigação"
  do cliente com ficha deixava a obrigação presa (não marcava como feita nem apagava); o cliente
  podia apontar uma obrigação para a ficha de outro; e podia editar o texto dos avisos.
- [x] **Projeto DEV antigo eliminado** *(11/10)* ✔ LCOffice (us-west-2) apagado pelo Vinícius — já
  não há dados reais nos EUA. Substitui o script de limpeza (`scripts/migracao/5-limpar-dev.mjs`).
- [x] **Limpeza do BACKLOG** *(11/10)* ✔ A checklist de fecho passou a ser a única lista ativa
  (absorveu os itens gémeos das outras secções); "Depois da entrega" numa só secção; Concluídos
  anteriores a 29/09 resumidos.

### Pequenos pedidos, segurança de entrega e QA de interface — 10/10

- [x] **Ícone (i) nos termos fiscais** *(reunião 06/08)* ✔ Em Empresa: regime de IVA, taxa,
  reserva de IR e regime de Segurança Social. O `InfoTooltip` passou a abrir também com o
  teclado e com o toque.
- [x] **Notas por linha e ponto de equilíbrio no Planeamento Mensal** *(reunião 20/08)* ✔ Lápis em
  cada linha abre uma nota (fica no próprio plano, sem migração). Cartão por baixo da tabela:
  quanto é preciso faturar para cobrir os custos fixos, com a margem do mês, e quanto falta.
- [x] **R4 · Exportação dos dados de um cliente (portabilidade, art. 20)** *(auditoria 21/08)*
  ✔ Na ficha do cliente → Dados, "Exportar dados (JSON)" (só admin): todas as tabelas da conta e
  da ficha, pedidos/leads pelo e-mail, e a lista de ficheiros com ligações de download por 7
  dias. Endpoint `/api/exportar-cliente`; testado localmente (10/10).
- [x] **R5a · Verificação em dois passos (TOTP)** *(auditoria 21/08)* ✔ Em Acessos, cartão
  "Verificação em dois passos (a sua conta)": ativar com QR, confirmar com código, desativar.
  Com a verificação ativa, depois da palavra-passe aparece o ecrã do código. **Ainda não é
  obrigatória** — decisão da Lúcia (risco de alguém ficar sem acesso se perder o telemóvel).
- [x] **QA de interface (sobras de 13/08)** ✔ Textos de 9–10,5 px subiram para 11 px em 43
  ecrãs (ficaram de fora só a assinatura da marca e a sigla dentro do quadrado da matriz) ·
  emojis 📄/🖨/⚡/✨ trocados por ícones SVG (Relatório de consultoria, Relatórios ESG, EÜR,
  Conciliação, Documentos do portal, Financeiro) · rótulos ligados aos campos no login e na
  definição de senha (o `Campo` do portal já era `<label>`) · alvos de toque ≥ 44 px em
  ecrãs táteis (regra global; exceção com a classe `lc-compacto`) · matriz de materialidade
  antes da lista no telemóvel · Livro de Caixa mostra 100 linhas de cada vez ("Mostrar mais";
  os totais contam todas).
  ⚠️ A branch `identidade-visual` mexe em estilos — ao juntar depois da sessão com a Lúcia,
  contar com conflitos nos tamanhos de letra.

### Nova consultoria sem a lista dos outros clientes — 10/10

- [x] **Ocultar os outros clientes ao iniciar uma consultoria** *(reunião 08/10 · Resp.: Vinícius)*
  ✔ Em Consultorias e em Consultorias ESG, com o formulário de nova consultoria aberto, saem os
  filtros e a lista dos outros clientes; voltam ao criar ou cancelar. Junta-se ao modo
  apresentação dentro da consultoria (16-A).
  ✔ No novo caso ESG saiu também o campo "Conta na plataforma" (mostrava nomes e e-mails das
  contas de outros clientes); a conta liga-se depois, em "Editar" dentro do caso.

### Aba de Marketing e anti-robôs no diagnóstico — publicados 10/10 (migrações 042 e 043)

- [x] **Aba de Marketing com a prévia do Instagram** *(reunião 01/10 · Resp.: Vinícius)*
  ✔ Gestão → Marketing: Feed (grelha do perfil), Calendário, Lista e Anotações da equipa. Cada
  publicação com data/hora, formato, estado, imagem, legenda (contagem para os 2200 caracteres e
  "copiar legenda"), hashtags e notas. Migração 043. A Letícia afina o que faltar.
- [x] **Proteção anti-robôs no formulário público** *(14/09 · Resp.: Vinícius)*
  ✔ O /diagnostico grava só pelo servidor (/api/diagnostico): armadilha, tempo mínimo, 5 por IP
  por hora, teto de 60 por hora, triagem no servidor, só a impressão do IP. Migração 042 tirou a
  escrita anónima. Turnstile pronto a ligar com `VITE_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`.

### Reservas & Impostos sem a caixa solta no topo — 10/10

- [x] Saiu a caixa "Este dinheiro não está livre" que tinha ficado sozinha no topo depois de
  tirarmos os títulos; o resumo à direita já diz quanto está reservado.

### Ajustes de layout pedidos pelo Vinícius — 10/10

- [x] **Menu da Gestão reorganizado** — Início solto no topo; depois Clientes (Clientes,
  Relatórios, Mensagens), Gestão (Agenda, Tarefas, Horas, CRM, Financeiro, Acessos) e Serviços.
- [x] **Sem eyebrow, título e subtítulo nas páginas** — ocupavam área útil; o `<h1>` fica só para
  leitores de ecrã (classe `so-leitores`) e as ações continuam à direita. Mantêm-se os títulos
  que são conteúdo (nome do cliente, documentos impressos, páginas públicas).
- [x] **Lista de clientes** — "Novo cliente" na linha dos filtros; saiu o filtro da equipa; a coluna
  Atenção mostra "—" em vez de "Tudo em dia".
- [x] **Ficha do cliente** — os blocos "Próxima obrigação" e "Último relatório" com a largura das
  colunas de baixo.

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

### Anteriores a 29/09 — resumo

> Uma linha por bloco. O detalhe completo de cada entrega está no histórico do git
> (`git log -p -- BACKLOG.md`, versões até 11/10/2026).

- **Correções de 25/09** *(28/09)* — foco do campo de texto do diagnóstico ESG; relatórios sem
  secções vazias; portal do cliente só informativo, sem valores (v2).
- **ESG como consultoria** *(19/09, migração 036)* — casos ESG dentro da plataforma, separador e
  menu próprios, listas em tabela.
- **App nativa, fase 1 — base web** *(16/09)* — ícones reais; service worker (sem página em
  branco sem rede).
- **Contrato do cliente e checklist de onboarding** *(15/09)* — contrato na plataforma (o cliente
  vê o dele); checklist e "Fazer Onboarding".
- **Percurso ESG e pontas soltas** *(14/09)* — consultoria ESG por fases; extrato importado
  guardado; bandas de faturação; datas um dia atrás a oeste de Greenwich; rótulo da Materialidade.
- **Comunicação com o cliente e estrutura de serviços** *(14/09)* — onboarding e comunicação
  básicos; aba de Serviços; lead "fechado" cria o acesso; país e serviço no cadastro; lista de
  clientes compacta; a Célia já apaga transações.
- **Correção urgente** *(10/09)* — erro `fmt is not defined` na Calculadora de Preços.
- **Formulário, CRM e documentos** *(09/09)* — formulário de qualificação na plataforma; ecrã de
  Diagnósticos; "Juntar ao CRM"; eliminar cliente apaga também os ficheiros; envio de documentos
  pelo cliente, por mês.
- **Ajustes rápidos** *(27/08)* — números na língua da interface; vulnerabilidade do
  `react-router`; estados de carregamento; zoom do iPhone nos campos; "projeções" → "previsões";
  piores alvos de toque; `<h1>` no login.
- **Revisão de design, 2ª iteração** *(25/08)* — 27 achados do PDF do Claude Design.
- **Cybersecurity, infraestrutura** *(24/08)* — R1 produção migrada para Frankfurt; R2 funções
  Vercel em `fra1`; R3 backups automáticos (plano Pro).
- **Reunião de 20/08, entregue no dia** — dados de teste removidos; EÜR alemão exportável;
  imposto sobre o líquido e dedução por regime; time-out do relatório de consultoria;
  colunas do Planeamento.
- **CRM — perfil e follow-up** *(migração 025)* — origem e temperatura do lead, alerta de
  follow-up, ranking de cliente ideal, lead fechado → contrato no Financeiro.
- **Consultoria — Bloco 0 · Enquadramento** *(migração 031)* — diagnóstico inicial, país, palavras
  do cliente à parte das notas, nos dois tipos de consultoria.
- **Relatório de consultoria — modelo de design** — PDF no modelo aprovado; números do cálculo,
  prosa da IA; páginas sem dados desaparecem.
- **Conciliação caixa/banco** *(migração 030)* — importação CSV/Excel, reimportar inofensivo,
  conciliação um-para-um, movimento sem par cria o lançamento.
- **Consultoria — Fases 0 a 2** *(migração 029)* — tabela e ficha de consultoria; blocos 1–2 com
  as 23 perguntas da IHK; SWOT/TOWS; blocos 3–4 (retiradas, capital, financiamento, projeção a 3
  anos, liquidez); relatório gerado por IA (`api/consultoria-relatorio.js`) e PDF. Fases 3 e 5
  encerradas por decisão.
- **Correções de QA e design** *(13/08)* — zoom no telemóvel, contraste WCAG AA, cartões Caixa/
  Banco, painel no tema noturno.
- **Acessos** *(migrações 026–028)* — papéis comercial e marketing; palavra-passe temporária com
  troca obrigatória no primeiro acesso; Contabilidade Lite.
- **Base do produto** *(até agosto)* — ESG com dupla materialidade e KPIs da Lúcia; Contabilidade
  (aviso de valores estimados, inglês com regras de Portugal, despesas recorrentes, calendário
  fiscal automático, IVA, reserva de IR, material consumido); primeira versão da gestão interna,
  clientes de demonstração, code splitting.
