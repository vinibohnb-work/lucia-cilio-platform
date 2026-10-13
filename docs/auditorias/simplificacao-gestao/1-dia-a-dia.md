# Simplificação: ecrãs do dia a dia da Gestão

**Item 13-D, segunda leva.** Revi sete ecrãs: Início da equipa, Clientes, Relatórios, Mensagens, Agenda, Tarefas e Horas. Usei os mesmos critérios da ficha do cliente (`docs/auditorias/2026-10-12-simplificacao-ficha-cliente.md`). Não alterei nenhum ficheiro.

Legenda: **Fica** · **Sai** · **Junta** (passa a viver num sítio só) · **Muda** · **⏳** decisão da Lúcia

---

## 1. O problema em números

| | Hoje |
|---|---|
| Entradas no menu para o dia a dia | **7** (Início, Clientes, Relatórios, Mensagens, Agenda, Tarefas, Horas) |
| Indicadores (KPI) | Início 5 · Tarefas 4 · Horas 3 |
| Ecrãs que mostram "tarefas em atraso" | **6** (Início, Tarefas, Agenda, lista de clientes, ficha, contador do menu) |
| Ecrãs que mostram "documentos em falta" | **4** (Início, Tarefas, lista de clientes, ficha → Documentos) |
| Sítios onde se cria uma tarefa | **4** (Agenda, Tarefas, cabeçalho da ficha, detalhe da obrigação) |
| Formulários para registar horas | **2** (página Horas e Notas internas da ficha), com regras diferentes |
| Agenda e Tarefas | Os mesmos dados (tarefas e prazos fiscais), os mesmos filtros (cliente, país, responsável) e o mesmo botão "Nova tarefa" |
| Formatos da tabela de clientes | **3**, conforme a largura do ecrã (`medio` e `estreito`), só porque há 8 colunas |

> **Em todos os 7 ecrãs:** o `Titulo` (`ui.jsx:176`) ignora `eyebrow` e `sub` desde 10/10. Os textos de ajuda escritos nas páginas não aparecem a ninguém. Exemplos: "Clique numa célula…" (`Relatorios.jsx:26`) e "As que se repetem criam a próxima sozinhas" (`paginas/Tarefas.jsx:60`). Proposta: limpar estes textos do código. A explicação que fizer falta passa para um (i) ou para o próprio botão.

---

## 2. Ecrã a ecrã

### Início da equipa (`paginas/InicioEquipa.jsx`)
*Para que serve: ver de relance o que há para fazer hoje.*

| Elemento | Veredicto | Porquê |
|---|---|---|
| KPI "Tarefas para hoje" (l. 61) | **Sai** | Repete o cartão Tarefas logo abaixo e o contador do menu. Além disso, muda com o seletor "As minhas/Equipa" do cartão, o que confunde. |
| KPI "Obrigações em atraso" (l. 62) | **Sai** | Repete as primeiras linhas de "Pendências dos clientes". Leva à Agenda do mês, onde não se vê o atraso. |
| KPI "Documentos em falta" (l. 63) | **Sai** | Repete as linhas de documentos das Pendências. Leva à lista de clientes, onde não há nenhuma lista de documentos. |
| KPI "Mensagens por ler" (l. 64) | **Sai** | Repete a linha "Mensagens dos clientes" das Pendências. |
| KPI "As minhas horas hoje" (l. 65) | **Muda** | É o único indicador que não se repete. Passa a um botão discreto "Registar horas · hoje 2 h" no topo. Hoje usa o mesmo ícone da Agenda das obrigações. |
| Cartão "Tarefas" com "As minhas / Equipa" | **Fica** | É o centro da página. Corresponde à "visão interna e visão geral" pedida a 08/10. |
| Linhas de tarefa (l. 74–80) | **Muda** | Não se pode clicar nem concluir uma tarefa. Proposta: a caixa de concluir e o clique para editar, como na tabela de Tarefas. |
| Limite de 8 tarefas sem "+N" (l. 30) | **Muda** | Esconde tarefas sem avisar. Mostrar "+N — ver todas". |
| "Ver todas as tarefas →" | **Fica** | — |
| Cartão "Pendências dos clientes": obrigações em atraso e dos próximos 7 dias | **Fica** | É o sítio certo para isto. **Muda:** hoje corta em 6 (l. 89) sem avisar. Uma 7.ª obrigação em atraso não aparece em lado nenhum desta página. |
| Pendências: documentos em falta por cliente | **Fica** → **Junta** | Passa a ser **o** resumo de documentos em falta da equipa (o painel das Tarefas sai). Encurtar o subtítulo repetido "documentos pedidos que ainda não chegaram" (l. 105). Hoje corta em 4 sem "+N". |
| Pendências: relatórios do trimestre | ⏳ | Fica se os relatórios trimestrais ficarem (ponto 6). |
| Pendências: mensagens por ler | **Fica** | — |
| "As minhas" não filtra as Pendências | ⏳ | O seletor só filtra as tarefas. Pergunta: em "As minhas", as Pendências devem mostrar só os clientes de que sou responsável? |
| "Tudo em dia. ✓" / "Nada para os próximos 7 dias. ✓" | **Fica** | Curto. |

**Resultado:** dois cartões e um botão de horas. Os 5 KPIs eram uma segunda cópia dos cartões.

### Clientes (lista) (`paginas/ListaClientes.jsx`)
*Para que serve: encontrar um cliente e ver quem precisa de atenção.*

| Elemento | Veredicto | Porquê |
|---|---|---|
| Pesquisa (nome, pessoa, setor) (l. 101) | **Fica** | — |
| Filtro País | **Fica** | Decide as regras fiscais. |
| Filtro Serviço | **Fica** | — |
| Filtro Estado (l. 104) | **Muda** | Por omissão deve esconder os **Inativos**. Hoje aparecem misturados com os ativos. |
| `f.responsavel` no estado (l. 27, 33) | **Sai** (código) | Sobra do filtro da equipa, que saiu a 10/10. |
| Botão "Novo cliente" | **Fica** | — |
| Formulário novo: Nome, País, Serviço | **Fica** | — |
| Formulário novo: Setor (l. 65) | **Sai** do formulário | Preenche-se depois em Dados. |
| Formulário novo: Estado (l. 70) | **Sai** | O cliente nasce sempre em "Onboarding" e muda-se em Dados. |
| Formulário novo: Forma, Regime, Periodicidade (l. 75–89) | **Muda** | Só aparecem quando o serviço é Contabilidade. Para os outros serviços, `gerarCalendario` não gera nada. O texto da l. 94 segue a mesma regra. |
| Software escolhido sozinho pelo país (l. 40) | ⏳ | Liga-se ao ⏳ "campo Software" da ficha (ver §3). |
| Quadrado com as iniciais (l. 129) | **Sai** | Decorativo. Saiu do cabeçalho da ficha pela mesma razão. |
| Forma jurídica por baixo do nome (l. 130) | **Sai** | Está na ficha. Não serve para a triagem. |
| Coluna País | **Muda** | Chip curto "PT"/"DE": liberta largura. |
| Coluna Setor | ⏳ | Vem da folha delas (comentário da l. 10), mas não serve para o dia a dia. Continua pesquisável. Proposta: sai da tabela. |
| Coluna Serviço | **Fica** | — |
| Coluna Estado (l. 137) | **Muda** | A mesma regra da ficha: só aparece quando **não** é "Ativo", dentro da coluna Serviço. |
| Coluna "Próxima obrigação" | **Fica** | — |
| Coluna "Atenção" (obrigações, documentos, tarefas, mensagens) | **Fica** | É a coluna mais útil da lista. |
| Coluna Responsável (l. 150) | ⏳ | O filtro saiu a 10/10, e o cliente novo recebe sempre quem o cria. Se for quase sempre a Lúcia, sai. |
| Três formatos da tabela (l. 22–23, 111–113) | **Sai** | Com Nome · País · Serviço(+estado) · Próxima obrigação · Atenção, cabe um formato único. |

### Relatórios (`paginas/Relatorios.jsx` + `partes/Relatorio.jsx`)
*Para que serve: ver quem já recebeu o relatório do trimestre e quem falta. O ecrã inteiro está pendente do ponto 6 (se os relatórios ficam ou não).*

| Elemento | Veredicto | Porquê |
|---|---|---|
| Matriz cliente × trimestre | ⏳ **Fica** | Se a Lúcia confirmar os relatórios trimestrais. Se não, saem juntos esta página, a linha do Início e o separador da ficha. |
| Software por baixo do nome (l. 40) | **Sai** | Não interessa para o estado do relatório. |
| Coluna "T4 · a decorrer" (l. 31, 46) | **Sai** | Mostra quase sempre "—". O rascunho do trimestre corrente vê-se na ficha. Ficam 3 colunas de trimestres fechados. |
| Chips Enviado / Rascunho / Por fazer | **Fica** | — |
| Coluna "Último resultado" (l. 48) | **Sai** | Um valor financeiro numa página que serve para acompanhar o envio. Já está na tabela do separador da ficha. |
| Clientes contados (l. 22) | **Muda** | Conta também clientes inativos. O Início só conta os ativos (l. 43), por isso os dois mostram números diferentes. A mesma regra nos dois. |
| Clique na linha → separador da ficha | **Fica** | Falta um sinal visível ("Abrir →"), porque o texto de ajuda não aparece. |
| **Editor:** nota "Contabilidade em X — valores à mão" (l. 72) | **Sai** | O rodapé do PDF já o diz. |
| Editor: 5 campos + resultado + variação | ⏳ | Que campos a Lúcia preenche de facto (por exemplo, Liquidez)? E compara com o **trimestre anterior**, mas as diretrizes dizem "comparativos **ano a ano**". Pergunta: trimestre anterior ou o mesmo trimestre do ano passado (sazonalidade da construção)? |
| Observações / Recomendações | **Fica** | São as duas secções do PDF. |
| Botão "Guardar" | **Fica** | — |
| Botão "Exportar PDF" | **Fica** | Não grava o que foi escrito. Aceitável, mas convém dizê-lo no botão. |
| Botão "Guardar e marcar como enviado" (l. 106) | **Muda** | Desde a migração 040, marcar como enviado **publica o relatório ao cliente**. O rótulo tem de o dizer: "Marcar como enviado (fica visível ao cliente)". |
| Botão "Fechar" (l. 107) | **Muda** | Fecha sem gravar e sem avisar: perdem-se os números escritos. Avisar ou gravar como rascunho. |

### Mensagens (`paginas/Mensagens.jsx` + `partes/Comunicacao.jsx`)
*Para que serve: a caixa de entrada de todos os clientes.*

| Elemento | Veredicto | Porquê |
|---|---|---|
| Lista de conversas (ordem: por ler, depois a mais recente) | **Fica** | — |
| Clientes sem mensagens e inativos na lista | **Muda** | Com 40 clientes, a lista enche-se de "Sem mensagens". Proposta: os inativos saem; os clientes sem conversa ficam agrupados no fim em "Outros clientes (N)", para poder começar uma conversa. |
| Avatar com as iniciais (l. 33) | **Sai** | Decorativo, a mesma regra da ficha. |
| Data, pré-visualização e contador de por ler | **Fica** | **Muda:** o "📎" da pré-visualização (l. 39) passa a `Ic.clip`. |
| Cabeçalho: botão WhatsApp (l. 49) | **Fica** | É um terceiro ponto de WhatsApp, além do cabeçalho da ficha e do detalhe da obrigação. Mas, numa caixa de entrada, é a ação natural. Anoto-o para a Lúcia saber que existe. |
| "Página do cliente →" | **Fica** | — |
| Conversa (autor · data · lida / via WhatsApp / registo interno) | **Fica** | — |
| Aviso "não tem conta… use o WhatsApp" | **Fica** | Evita escrever para quem nunca vai ler. |
| Anexo pendente "📎 nome ✕" (`Comunicacao.jsx:58`) | **Muda** | Ícone SVG em vez do emoji. |
| Ctrl+Enter para enviar | **Fica** | Não há nenhuma indicação no ecrã; basta um título no botão. |
| "Registar" uma nota para clientes sem conta | ⏳ | Repete o tipo "Contacto registado" das Notas internas (ver §3). Pergunta: os contactos registam-se onde? |
| Compositor WhatsApp (modelos + obrigação) | **Fica** | — |

### Agenda (`paginas/Agenda.jsx`)
*Para que serve: tarefas e prazos fiscais no calendário.*

| Elemento | Veredicto | Porquê |
|---|---|---|
| Botão "Nova tarefa" | **Junta** | O mesmo botão está em Tarefas. Fica um só, se as duas páginas se juntarem (§4). |
| Vistas Dia / Semana / Mês | **Muda** | Ficam **Mês** e **Dia**: clicar num dia do mês já abre o Dia. A Semana sai, porque repete as outras duas. No telemóvel continua a abrir em Dia. |
| ‹ Hoje › e título do período | **Fica** | — |
| Filtro Cliente (l. 119) | **Sai** | A visão de um cliente é a ficha (Obrigações + Tarefas no Resumo). |
| Filtro País | **Sai** | Pouco valor para uma equipa de 2–3 pessoas. |
| Filtro Responsável | **Fica** | Separa "a minha agenda" da da equipa. |
| "Prazos fiscais" e "Mostrar concluídas" | **Fica** | — |
| Legenda "📅 prazo fiscal · ✓ tarefa · vermelho = em atraso" (l. 124) e ícones dos itens (l. 53) | **Muda** | `Ic.agenda` e `Ic.tarefas` em vez de emojis (regra do QA de 10/10). Com ícones, a legenda pode encolher. |
| Clique numa tarefa com cliente (l. 49) | **Muda** | Leva a `/gestao/clientes/:id/tarefas`, um separador que já não existe (cai no Resumo). E não deixa editar a tarefa. Uma tarefa deve abrir sempre o `FormTarefa`; uma obrigação abre a ficha. |
| Caixa de concluir (só na vista Dia) | **Fica** | — |

### Tarefas (`paginas/Tarefas.jsx` + `partes/Tarefas.jsx`)
*Para que serve: a lista de todas as tarefas.*

| Elemento | Veredicto | Porquê |
|---|---|---|
| Destaques "Tarefas de hoje", "Próximos prazos", "Em atraso" (l. 64–66) | **Junta** | Fazem o mesmo que o filtro "Prazo" (l. 91). Passam a pílulas com contagem: *Hoje (3) · 7 dias (5) · Em atraso (2) · Todas*. O filtro Prazo sai. |
| Destaque "Documentos em falta" e o seu painel (l. 67, 70–83) | **Sai** → **Junta** no Início | Não são tarefas. O resumo fica nas Pendências do Início; o detalhe por tipo e mês já está na ficha → Documentos. |
| Obrigações dentro de "Próximos prazos" e o cartão das l. 94–104 | **Sai** | Prazos fiscais vivem no Início e na Agenda. Além disso, a l. 100 tem os estados escritos à mão: "Em revisão" aparece como "Por preparar", e uma obrigação em atraso não diz "Em atraso". |
| Filtro Cliente | **Sai** | Desde 12/10, a ficha mostra todas as tarefas do cliente no Resumo. |
| Filtro País | **Sai** | Pouco valor. |
| Filtro Responsável | **Fica** | — |
| Filtro Estado (5 opções, l. 90) | **Muda** | Passa a *Por fazer · Concluídas*. Depende do ⏳ "Em curso", abaixo. |
| Tabela: caixa de concluir, título, ↳ obrigação, ↻ repete | **Fica** | — |
| Tabela: "🔔 lembrete" (l. 100) | ⏳ | Ver "Lembrete automático", abaixo. Se ficar, ícone SVG. |
| Tabela: país por baixo do cliente (l. 105) | **Sai** | Pouca relevância. |
| Tabela: Responsável | **Fica** | — |
| Tabela: Prazo (data + "daqui a N dias") | **Fica** | — |
| Tabela: coluna Estado com lista Pendente / Em curso (l. 113–119) | ⏳ | Três estados para uma tarefa que se fecha com uma caixa. O chip "Em atraso" repete o texto vermelho "N dias em atraso" do Prazo. Pergunta: "Em curso" é usado? Se não, a coluna sai. |
| "Editar" | **Fica** | — |
| **Formulário:** Tarefa, Cliente, Obrigação, Prazo, Repetir, Notas | **Fica** | — |
| Formulário: Responsável por omissão (l. 17) | **Muda** | Hoje é `s.equipa[0]` e não quem está a criar (`s.eu`). Uma tarefa nova pode ficar atribuída à pessoa errada sem se dar por isso. |
| Formulário: "Lembrete automático" (l. 51–54) | ⏳ **Sai** (proposta) | Não envia nada: só mostra o 🔔 na lista. O nome promete o que não faz. O Início já destaca os próximos 7 dias. O valor na base fica (por omissão 2). |

### Horas (`paginas/Horas.jsx`)
*Para que serve: quanto tempo foi para cada cliente ou atividade.*

| Elemento | Veredicto | Porquê |
|---|---|---|
| Registar: Dia, Cliente ou atividade, Horas, O que foi feito, Registar | **Fica** | — |
| Registar: "Quem" (l. 86) | ⏳ | Qualquer pessoa regista horas em nome de outra, mas só pode apagar as suas (l. 72). Proposta: "Quem" só para admin. Junta-se à pergunta já aberta: "cada colaboradora vê só as suas horas?" |
| "Outra atividade…" | **Fica** | — |
| Mensagem "entre 0,25 e 24" | **Muda** | O código aceita qualquer valor acima de 0 (l. 43). Alinhar o texto com a regra. |
| "Ver:" pessoa / equipa | **Fica** | — |
| KPIs Hoje / Esta semana / Este mês (l. 123–125) | **Muda** | Três cartões com o mesmo ícone. "Este mês" repete o "Total de <mês>" do cartão de baixo e ignora o mês escolhido nesse cartão. Passa a uma linha só: "Hoje 2 h · Semana 10 h". |
| Cartão "Por cliente e atividade" com barras e "de X h" | **Fica** | É a razão do ecrã: horas contra as horas incluídas. |
| Nota "de X h = horas incluídas…" | **Fica** | — |
| Tabela de registos: coluna "Quem" | **Muda** | Só aparece em "Toda a equipa". Com uma pessoa escolhida, repete-se em todas as linhas. |
| Apagar "✕" | **Fica** | — |

---

## 3. Informação repetida entre ecrãs

| Informação | Onde aparece | Proposta |
|---|---|---|
| Tarefas em atraso | Início (KPI + cartão) · Tarefas (destaque, filtro e chip na linha) · Agenda · Clientes → Atenção · ficha → Resumo · contador do menu em Tarefas (`Sidebar.jsx:186`) | Início + Tarefas + Atenção. O KPI e o destaque saem. |
| Obrigações em atraso / próximos 7 dias | Início (KPI + Pendências) · Tarefas (destaque + cartão) · Agenda · Clientes (Próxima + Atenção) · ficha → Obrigações | Início (Pendências) + Agenda + lista. Saem das Tarefas. |
| Documentos em falta | Início (KPI + Pendências) · Tarefas (destaque + painel) · Clientes → Atenção · ficha → Documentos | Início (resumo) + ficha (detalhe) + Atenção. |
| Mensagens por ler | Início (KPI + Pendências) · Clientes → Atenção · Mensagens · contador no separador da ficha | **Muda:** o contador do menu passa de Tarefas (que repete o Início) para **Mensagens**, que hoje não tem nenhum. |
| Relatórios por fazer | Início · página Relatórios · botão no separador da ficha | ⏳ ponto 6 |
| Horas | Início (KPI) · página Horas (KPI Hoje + formulário) · ficha → Notas internas (cartão com **outro** formulário: sem dia nem pessoa, descrição por omissão "Trabalho") | ⏳ Contradiz a proposta da ficha ("as horas ficam na ficha"). Proposta nova: regista-se só em Horas; a ficha mostra "X h de Y h este mês" com ligação para Horas. Dois formulários diferentes geram dados diferentes. |
| Nova tarefa | Agenda · Tarefas · cabeçalho da ficha · detalhe da obrigação | Um botão por ecrã, num ecrã de tarefas só (§4). |
| WhatsApp | ficha (cabeçalho + obrigação) · página Mensagens | Fica assim (ver Mensagens). |
| Registar um contacto | Mensagens ("registo interno", clientes sem conta) · Notas internas (tipo "Contacto registado") | ⏳ Um sítio só. |
| Software contabilístico | lista Relatórios · editor do relatório · **rodapé do PDF** (`Relatorio.jsx:48`) | **Corrige a auditoria da ficha.** Ela diz que o Software "não é usado em lado nenhum", mas aparece no rodapé do PDF do relatório. Se o campo sair, o rodapé tem de mudar. |
| Iniciais em quadrado ou círculo | Clientes · Mensagens (na ficha já saiu) | Sai dos dois. |
| Filtros Cliente / País / Responsável | Agenda · Tarefas | Fica só Responsável, uma vez. |

---

## 4. Itens do menu a juntar

1. **Agenda + Tarefas → uma entrada ("Agenda")** com a alternância **Lista | Mês**. São os mesmos dados, os mesmos filtros e o mesmo botão; muda só a forma de ver. A Lista é a tabela atual das Tarefas, com as pílulas Hoje / 7 dias / Em atraso / Todas. ⏳ Recomendado, mas o documento original (secção 4) pedia as duas separadas, por isso é a Lúcia que confirma.
2. **Início ≠ Agenda.** O Início fica com o urgente: as minhas tarefas e as pendências dos clientes. A Agenda fica com a lista completa. Deixa de haver KPIs que repetem uma coisa e outra.
3. **Relatórios:** ⏳ ponto 6. Se ficarem, a página fica só como matriz de estado. Se não, sai com a linha do Início e o separador da ficha.
4. **Mensagens** e **Horas** ficam: cada uma faz uma coisa diferente.

**Resultado: 7 → 5 entradas** (Início, Clientes, Mensagens, Agenda, Horas), ou 6 com os Relatórios.

---

## 5. Problemas de interface encontrados no código

- **Cortes sem aviso** no Início: 8 tarefas, 6 obrigações, 4 clientes com documentos e 3 nomes (l. 30, 89, 101, 114). Sem "+N", uma obrigação em atraso pode não aparecer em lado nenhum da página.
- **Clientes inativos contados de forma diferente:** as obrigações em atraso contam-se em qualquer cliente (Início l. 33, Clientes l. 123); os relatórios do Início só contam ativos (l. 43); a página Relatórios conta todos. É preciso uma regra única, por exemplo ignorar os inativos.
- **Emojis no lugar de ícones:** 📅 ✓ (Agenda l. 53, 124), 🔔 (`partes/Tarefas.jsx:100`), 📎 (Mensagens l. 39, `Comunicacao.jsx:58`). Contrariam a regra do QA de 10/10.
- **Ícone repetido:** `Ic.agenda` serve para obrigações, horas e o cartão "Registar horas" (Início l. 62, 65; Horas l. 82, 123–125).
- **Ligação a um separador que já não existe:** Agenda l. 49 aponta para `…/tarefas`.
- **Estados escritos à mão:** `paginas/Tarefas.jsx:100` mostra estados errados (ver Tarefas).
- **Responsável errado por omissão** numa tarefa nova (`partes/Tarefas.jsx:17`).
- **Perde-se o que foi escrito no relatório** ao clicar "Fechar".
- **Nada grava a cada tecla** nestes ecrãs. O risco aqui é o contrário: fechar sem gravar.
- **Tamanho do texto:** nada abaixo de 11 px. Muito texto secundário está a 11–11,5 px (chips, subtítulos, cabeçalhos de tabela); aceitável.
- **Código morto:** `f.responsavel` (ListaClientes) e as props `eyebrow`/`sub` em todas as páginas.

---

## 6. Plano

**Pode avançar já, sem decisão da Lúcia:**
- Início sem os 4 KPIs repetidos; horas num botão; "+N" nas listas; linhas de tarefa que se podem clicar.
- Clientes:
  - sem o quadrado das iniciais nem a forma jurídica;
  - País em chip; Estado só quando não é "Ativo";
  - inativos escondidos por omissão;
  - formulário novo sem Setor nem Estado, com os campos fiscais só para Contabilidade;
  - um único formato da tabela.
- Relatórios: sem software, sem a coluna "a decorrer" nem "Último resultado"; a mesma regra de clientes que o Início; rótulo "fica visível ao cliente"; aviso ao fechar.
- Mensagens: sem avatares; inativos fora; ícones SVG.
- Agenda: sem Semana nem os filtros Cliente e País; ícones; uma tarefa abre o formulário; ligação corrigida.
- Tarefas:
  - pílulas com contagem em vez dos destaques e do filtro Prazo;
  - sem o painel de documentos nem as obrigações;
  - sem os filtros Cliente e País; sem o país na linha;
  - responsável por omissão = quem cria.
- Horas: KPIs numa linha; "Quem" só em "Toda a equipa" na tabela; texto da validação alinhado.
- Contador do menu passa de Tarefas para Mensagens.
- Limpeza do código morto.

**Para a reunião com a Lúcia (juntar aos pontos 6–7):**
1. Juntar Agenda e Tarefas numa entrada só?
2. Relatórios trimestrais ficam? Que campos? Comparação com o trimestre anterior ou ano a ano?
3. A tarefa precisa do estado "Em curso"?
4. O "Lembrete automático" sai?
5. As colunas Setor e Responsável ficam na lista de clientes?
6. Horas: só na página Horas ou também na ficha? Quem pode registar horas em nome de outra pessoa?
7. Contactos registados: em Mensagens ou em Notas internas?
8. Em "As minhas", as Pendências do Início devem filtrar pelos clientes de que sou responsável?
9. O campo Software: se sair, muda o rodapé do PDF.

**Conflitos com o BACKLOG:**
- A proposta de horas contradiz a auditoria da ficha ("as horas ficam na ficha").
- A auditoria da ficha diz que o Software não é usado; aparece no PDF do relatório.
- O documento original pedia Agenda e Tarefas separadas.
- A comparação do relatório com o trimestre anterior choca com a diretriz "comparativos ano a ano".
- Tirar os KPIs do Início é compatível com a "visão interna e visão geral" de 08/10: essa visão já é feita pelo seletor As minhas / Equipa.
