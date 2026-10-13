# Simplificação: ecrãs comerciais e de administração (Gestão)

**12/10/2026 · item 13-D, continuação.** Segue o critério de `docs/auditorias/2026-10-12-simplificacao-ficha-cliente.md`. Legenda: **Fica** · **Sai** · **Junta** (passa a viver num sítio só) · **Muda** · **⏳** (decisão da Lúcia).

Nada nestes cinco ecrãs grava a cada tecla: todos usam "Guardar" explícito. O resto do R-B11 não se aplica aqui.

---

## 1. O problema em números

| | Hoje |
|---|---|
| Itens de menu nesta área | 5: Prospeção, Marketing, Financeiro e Acessos (na secção Gestão); Diagnósticos (na secção **Serviços**, longe do CRM) |
| Ícone `IconKpi` repetido no menu | 3 itens: Relatórios trimestrais, CRM e Diagnósticos (`Sidebar.jsx:99,106,114`) |
| Sítios onde se cria um lead | 3: CRM "+ Lead", Diagnósticos "Juntar ao CRM", ConsultoriaDetalhe "Juntar ao CRM" |
| Sítios onde se cria uma conta | 2: Acessos e CRM "Criar acesso" (a ficha → Dados só tem uma ligação para Acessos) |
| Sítios onde se confirma o pagamento da avença | **2**: Financeiro e ficha → Notas internas → "Controlo da avença" |
| Sítios que dizem se o cliente já entrou | **4**: Acessos ("pendente" / último acesso), ficha → Dados → Conta, Conta na plataforma (chip), passo "acesso" do onboarding |
| Botões "ver como o cliente" | 2: cabeçalho da ficha e "Visualização completa" em Conta na plataforma |

---

## 2. Prospeção (CRM) — `src/pages/gestao/Crm.jsx`

**Para quê:** acompanhar os potenciais clientes desde o primeiro contacto até fechar ou perder.

| Elemento | Veredicto | Porquê |
|---|---|---|
| Título (só para leitores de ecrã, l.295) e `subtitle` (l.124, definido mas nunca mostrado) | **Sai** o `subtitle` | Texto morto nas 3 línguas. |
| Botão "+ Lead" (l.297) | **Fica** | — |
| Faixa "⏰ N lead(s) sem contacto há 7+ dias" (l.301–306), que liga o filtro | **Fica** | É o alerta mais útil do ecrã. |
| Botão "⏰ Só follow-up pendente" (l.319) | **Sai** (junta-se à faixa) | Faz exatamente o mesmo que clicar na faixa. Dois controlos para um só filtro. |
| Rótulo "Filtros" (l.310) | **Sai** | Os dois selects já dizem "Temperatura: Todos" e "Origem: Todos". |
| Filtro Temperatura (l.311) | **Sai** | Os cartões já vêm ordenados por pontuação, e a temperatura vê-se no chip e na borda. Com poucas dezenas de leads, filtrar não compensa. |
| Filtro Origem (l.315) | ⏳ | Só é útil se a Lúcia quiser medir de onde vêm os leads (Instagram, diagnóstico…). Se não, sai. |
| "✕ Todos" (limpar filtros) | **Fica** se ficar algum filtro | — |
| 8 colunas: Mapeado, Em abordagem, Conectado, Reunião, Proposta, Fechado, Perdido, Futuro (l.18) | ⏳ | No computador, oito colunas lado a lado ficam estreitas. As vendas são social selling e diagnósticos (01/10), por isso "Mapeado" (lista fria) e "Em abordagem" podem passar a uma coluna só. Pergunta: usa a coluna Mapeado? Perdido fica (diretriz "histórico de perdas"). |
| Subtítulo de cada coluna, 2.ª linha (l.352) | **Sai** | Já existe como `title` (tooltip) na l.349. Ganha-se uma linha em 8 colunas. |
| Contador por coluna | **Fica** | — |
| Cores das colunas `STAGE_TONE` (l.22–31) | **Muda** | Hex fixos que não seguem o tema nem o modo noturno. Passam a tokens do tema. |
| Cartão: nome e empresa | **Fica** | — |
| Cartão: ✎ editar | **Muda** | Clicar no cartão abre a edição; o lápis deixa de ser preciso. |
| Cartão: ✕ eliminar (l.383) | **Muda** | Fica a 4 px do ✎ e é irreversível. Passa para dentro do modal. |
| Chip de temperatura com emoji 🔥🌤❄ (l.388; `leadScore.js:57`) | **Muda** | Fica o chip. A borda esquerda colorida repete-o (l.372) e sai; a borda vermelha fica só para "em atraso". Emojis passam a ícones (regra do QA de 10/10). |
| Chip de origem (l.389) | **Sai** do cartão | Informação de consulta; continua no modal. |
| Chip "★ pontuação" (l.390–392) | **Fica** | Explica a ordenação. Cor fixa `#eaf5ee/#0a7a3e` passa a token. |
| "✉ contacto" (l.395) | **Fica** | Ícone SVG em vez de ✉. |
| "💬 dor" (l.396) | **Fica** | Sem o emoji. |
| Notas, 2 linhas (l.397) | **Sai** do cartão | Num lead vindo do diagnóstico, as notas são o resumo inteiro do enquadramento (`leadsCrm.js:51`) e repetem a dor da linha de cima. Ficam no modal. |
| Motivo da perda (l.398) | **Fica** | Cor fixa `#991b1b` passa a token. |
| "⏱ há N dias" + "✓ Registar contacto" (l.403–410) | **Fica** | — |
| "📞 N tentativas" + "+1 tentativa" (l.412–417) | **Junta** | Em "Em abordagem" há dois botões que atualizam o último contacto. Fica um só: "Registar contacto", que nessa coluna também soma uma tentativa. |
| Fechado: "→ Criar contrato" (l.425) | **Muda** | Cria a linha em `client_billing` **sem `cliente_id`** (l.217–223). A avença não aparece na ficha do cliente, que lê por `cliente_id` (`portal/dados.js:195`). Até ao item 12, deve pedir a ficha. Depois do 12, fechar o lead cria a ficha e o contrato. |
| Fechado: "Criar acesso" (l.428) | **Junta** (Acessos / ficha) | Repete a criação de conta de Acessos, mas pior: palavra-passe num `window.alert` (l.256), sem a mensagem de boas-vindas (BoasVindas), sem país e sem ligar à ficha. Fica um só fluxo de criação de conta (ver Acessos). |
| Botão "+" no fundo de cada coluna (l.437) | **Muda** | São 8 botões extra só para escolher a etapa. Ver a linha seguinte. |
| Modal: Nome, Empresa, Contacto, Origem | **Fica** | — |
| Modal: campo **Etapa** | **Muda** (falta) | Não existe. Mudar de etapa só se faz a arrastar, e o drag & drop HTML5 não funciona em ecrã tátil: **no telemóvel não se consegue mover um lead**. Com um select "Etapa" no modal, os "+" por coluna podem sair. |
| Caixa "Perfil (cliente ideal) · ★ x/100": Temperatura, Faturação anual, Setor, Dor | **Fica** | Alimenta a pontuação. |
| "Valor do negócio (€)" (l.146) | **Muda** o rótulo | O código trata-o como **valor por mês** (l.155, l.220). Passa a "Avença mensal prevista (€)". |
| Notas | **Fica** | — |
| `window.prompt` para motivo da perda, valor e e-mail; `confirm`/`alert` (l.210, 241, 268) | **Muda** | Caixas do navegador, fora do tema e sem tradução dos botões. O motivo da perda e o valor passam para o modal. |

---

## 3. Diagnósticos — `src/pages/gestao/Diagnosticos.jsx`

**Para quê:** caixa de entrada do formulário público `/diagnostico`. A triagem marca "Qualificado" ou "Abaixo do corte", e a Lúcia decide o que passa ao CRM.

| Elemento | Veredicto | Porquê |
|---|---|---|
| "Ligação do formulário: …/diagnostico" em `<code>` (l.96–98) | **Muda** | Passa a botão "Copiar ligação". Hoje é preciso selecionar o texto à mão, e é a única coisa que se faz com ela. |
| Filtros Novos / No CRM / Descartados / Todas, com contagem (l.104–112) | **Fica** "Novos" e "Descartados"; ⏳ "No CRM" | Depois de passar ao CRM, o contacto vive lá: as notas do lead têm o enquadramento todo. "No CRM" repete o CRM. "Todas" pode sair. |
| Nome · empresa | **Fica** | — |
| Chip "Qualificado / Abaixo do corte" + motivo (l.126, l.134) | **Fica** | Decisão de 27/08 (o formulário é um filtro e nada se perde). |
| E-mail · telefone · data (l.130–133) | **Fica** | — |
| "Respostas ▾" (l.138–141) | **Fica** | — |
| Respostas abertas com as chaves cruas: "pais:", "iniciou:", "faturacao:" (l.167) | **Muda** | Passam a usar os rótulos de `CAMPOS` (`rot(cp, lang)`), os mesmos do formulário e de `resumoEnquadramento` ("País", "Já iniciou atividade"…). |
| "+ Juntar ao CRM" (l.146) | **Fica** | Entrada manual de propósito (diretriz de 18/09). |
| Descartar / Repor | **Fica** | — |
| "Ver no CRM →" (l.143) | **Muda** | Abre o quadro inteiro, não o lead (`crm_lead_id` está gravado). Ou abre o lead, ou sai com o filtro "No CRM". |
| Lugar no menu: secção "Serviços" (`Sidebar.jsx:114`) | **Muda** / ⏳ | É comercial, não um serviço, e tem os mesmos papéis do CRM (admin e comercial). Ver a secção 7: juntar ao CRM. |
| Ícone `IconKpi`, igual ao do CRM | **Muda** | — |

---

## 4. Marketing — `src/pages/gestao/Marketing.jsx`

**Para quê:** planeamento do Instagram da LC Office, partilhado pela Lúcia, pela Letícia e pela Nicole (01/10).

| Elemento | Veredicto | Porquê |
|---|---|---|
| Vistas Feed / Calendário / Lista / Anotações (l.120) | **Fica** Feed, Calendário e Lista; ⏳ Anotações | Ver as duas últimas linhas da tabela. |
| Linha "3 ideias · 2 rascunhos · …" (l.122–124) | **Sai** | Resumo decorativo. Os estados já estão em chips na Lista e nas Próximas. |
| "+ Nova publicação" | **Fica** | — |
| Feed: "Prévia do feed" (grelha 3×N) | **Fica** | É a razão de ser da aba. |
| Feed: etiqueta de data/estado sobre cada imagem; etiqueta de formato | **Fica**, **Muda** a cor | `rgba(14,61,51,.82)` e `#0E3D33` fixos (l.143–144) passam a tokens. |
| Feed: nota "As mais recentes em cima… stories fora da grelha" (l.149) | **Muda** para (i) | Explica uma vez e passa a ruído. |
| Feed: cartão "Próximas publicações" (l.151–162) | ⏳ | Repete o Calendário. Proposta: fica (é a lista do "o que sai a seguir") e o Calendário fica para planear o mês. Decide a Letícia. |
| Calendário: mês, ‹ Hoje ›, clicar no dia para criar, publicações por dia com cor por estado | **Fica** | — |
| Lista: Data, Formato, Publicação, Estado, Quem | **Fica** | Único sítio com as ideias **sem data** e com o autor. |
| Editor: imagem, Título interno, Data, Hora, Formato, Legenda, Hashtags, contador 2200, "Copiar legenda", Notas da equipa | **Fica** | Tudo serve para publicar. |
| Editor: Estado com 5 opções (Ideia, Rascunho, Aprovado, Agendado, Publicado) (l.21–27) | ⏳ | Com três pessoas, "Aprovado" só faz sentido se a Lúcia aprovar cada publicação. "Agendado" só faz sentido se agendarem no Meta. Pergunta à Letícia: usam os 5? |
| Editor: "criada por X" (l.302) | **Fica** | — |
| Anotações (lista com caixa de verificação) | ⏳ **Junta** | Há dois sítios para ideias: Anotações e publicações em estado "Ideia" sem data. Os lembretes e pedidos são o que Tarefas já faz. Proposta: as ideias passam a publicações "Ideia" e os lembretes a Tarefas. Pede migração das notas existentes, para não perder nada. |
| ✕ apagar anotação, sem confirmação (l.237) | **Muda** | Apaga de imediato e sem desfazer, ao contrário das publicações (l.90). |
| Comentário em `Sidebar.jsx:88–90` ("o Marketing sai do menu da administradora") | Nota | Contradiz o código (l.107 dá-o ao admin) e a diretriz de 01/10. Corrigir o comentário. |

---

## 5. Financeiro — `src/pages/gestao/Financeiro.jsx`

**Para quê:** contratos (avenças) dos clientes da LC Office e confirmação, mês a mês, do que foi recebido.

| Elemento | Veredicto | Porquê |
|---|---|---|
| Seletor de mês no cabeçalho (l.199) | **Muda** | Só afeta "Recebimentos do mês", não os Contratos. Passa para o título dessa secção. |
| "+ Novo contrato" | **Fica** | — |
| Indicador "Previsto (mês)" | **Sai** | É Recebido + Por receber (salvo quando se confirma outro valor). Três números para dizer duas coisas. |
| Indicador "Recebido (mês)" | **Fica** | Cor `#0a7a3e` fixa passa a token. |
| Indicador "Por receber" | **Fica** | É o número que interessa. `#b45309` passa a token. |
| Indicador "Contratos ativos" | **Sai** | Contagem que se vê na lista logo abaixo. |
| Formulário: Cliente (texto livre com sugestões das fichas, l.226) | **Muda** | Hoje liga à ficha **pelo nome, em silêncio** (l.113–114). Um nome escrito de outra forma deixa a avença fora da ficha. Passa a escolher a ficha, com texto livre só para quem não tem ficha. |
| Formulário: "Utilizador da plataforma (opcional)" (l.228) | **Sai** (depois do item 12) | A conta vem da ficha (`clientes.user_id`). Dois campos para ligar o mesmo cliente. Até lá, preencher sozinho a partir da ficha. |
| Formulário: Serviço (texto livre) | ⏳ | Os serviços já estão na ficha (`regras.js` SERVICOS). Pergunta: o contrato pode ter um serviço diferente do da ficha (ex.: uma consultoria pontual)? |
| Formulário: Valor, Periodicidade, Início, Notas | **Fica** | — |
| "Recebimentos · 2026-10" (l.257) | **Muda** | Mês em ISO cru. Passa a "outubro 2026". |
| Linha de recebimento: cliente, serviço · periodicidade, valor, campo de valor + "Confirmar" / "Recebido ✓" (anular) | **Fica** | O campo do valor real ao lado de cada linha (l.273) poderia aparecer só ao clicar, mas é o que permite registar pagamentos parciais. Fica. Cores `#d1fae5/#065f46` (l.270) passam a tokens. |
| Contratos: nome + 🔗 (conta ligada, l.289) | **Muda** | Emoji passa a ícone. Depois do 12, ligação à ficha em vez de 🔗. |
| Contratos: chip de periodicidade, valor | **Fica** | — |
| Contratos: "Contrato" / "Anexar PDF" | **Fica** | Único sítio onde se anexa o contrato (o passo do onboarding aponta para aqui). |
| Contratos: botão "Ativo" (l.304) | **Muda** | O texto diz sempre "Ativo", também quando o contrato está inativo (só muda a cor: `#f1f5f9/#64748b` fixos). Passa a "Ativo / Inativo", ou a "Terminar contrato" no modal de edição. |
| Contratos: ✎ e ✕ | **Muda** | Ícones de texto. ✕ (eliminar) passa para dentro da edição, como no CRM. |

---

## 6. Gestão de Acessos — `src/pages/admin/AdminHome.jsx` (+ `BoasVindas.jsx`, `SegurancaMfa.jsx`)

**Para quê:** criar e gerir as contas de login (equipa e clientes) e redefinir palavras-passe.

| Elemento | Veredicto | Porquê |
|---|---|---|
| "+ Novo utilizador" | **Fica** | — |
| Aviso verde "🔑 Conta X criada. Palavra-passe temporária: …" (l.200) | **Sai** quando aparece a BoasVindas | A palavra-passe aparece duas vezes seguidas (aviso + mensagem). Fica a mensagem. |
| Cartão "Verificação em dois passos (a sua conta)" (l.202), sempre no topo | ⏳ / **Muda** | Ponto 7: é obrigatória? É sobre a conta da própria Lúcia e ocupa o topo de um ecrã sobre os outros. Proposta: depois de ativa, uma linha discreta no fundo. |
| BoasVindas: língua PT/DE/EN, texto, Copiar / WhatsApp / E-mail | **Fica** | Bom fluxo. É o que o "Criar acesso" do CRM devia usar. |
| Formulário: E-mail, Nome de exibição | **Fica** | — |
| Formulário: Plataforma (Contabilidade, Contabilidade Lite, ESG, Contab. + ESG) | ⏳ | Ponto 6 ("conta nova em Lite ou completa?"). Pode ficar com 2–3 opções. |
| Formulário: País (`company_settings.country`) | **Junta** (item 12) | Repete o país da ficha (R-C2). Tem efeito (regras fiscais da conta), por isso até ao 12 fica, preenchido a partir da ficha. |
| Formulário: **Serviço** (`company_settings.service`) | **Sai** | Só é escrito e lido aqui (`AdminHome.jsx:115,146`); nada mais na plataforma o usa. O serviço vive na ficha. A coluna fica na base de dados, sem perda. |
| País / Serviço / Plataforma quando o Perfil é Administrador, Comercial ou Marketing | **Muda** | Não se aplicam à equipa. Mostrar só com o perfil "Utilizador". |
| Perfil (4 opções) | **Fica** | — |
| "ℹ️ Apenas a secção Contabilidade…" (Lite) e "🔑 A pessoa entra…" | **Muda** | Emojis passam a (i) ou ícone. |
| Palavra-passe temporária: campo, "↻ Gerar nova", "⧉ Copiar" | **Fica** | ↻ e ⧉ passam a ícones SVG. |
| Tabela: colunas E-mail, Nome, Plataforma, Perfil | **Fica** | — |
| Coluna "Criado" | **Sai** | Pouco relevante. "Último acesso" diz o que interessa. |
| Coluna "Último acesso" / chip "PENDENTE" (l.280) | **Fica** | É aqui que se vê o estado da conta (ver duplicações). Chip `#fef3c7/#92400e` fixo passa a token. |
| Equipa e clientes misturados numa só lista | **Muda** | Duas secções: "Equipa" (3–4 contas) e "Clientes". |
| Ações: chave (redefinir), Editar, Eliminar | **Fica** | Cores fixas em `roleStyle` e `platChip` (l.176–184) passam a tokens. |
| Textos mortos em `L`: `invite`, `inviteHint`, `invited`, `view`, `eyebrow` | **Sai** | Limpeza. |

---

## 7. Conta na plataforma (ficha antiga) — `src/pages/gestao/ClienteDetalhe.jsx`

Só existe embutida no separador "Conta na plataforma" da ficha (`PaginaCliente.jsx:58,174`). A auditoria de 12/10 já propõe que o separador saia (⏳ ponto 6). Aqui fica o detalhe do que se perde e do que se repete.

| Elemento | Veredicto | Porquê |
|---|---|---|
| Botão "Visualização completa" (l.218) | **Sai** | Repete "Ver como o cliente" do cabeçalho da ficha. |
| Chip da plataforma + "● ativo / ○ pendente" (l.225–228) | **Junta** em Dados → Conta na plataforma | Lá já aparece "Conta ativa / Ainda não entrou" (`Dados.jsx:138`). Só falta a plataforma. |
| Resumo: Receita (ano), Saldo | ⏳ | Vêm do livro de caixa do próprio cliente. Útil se a Lúcia faz a contabilidade na conta dele; senão sai. |
| Resumo: Obrigações pendentes (l.140) | **Sai** | Repete o separador Obrigações. Conta pelo campo antigo `status = 'pending'`, enquanto o portal usa `estado`: o número **pode não bater**. |
| Resumo: "Clientes" (nº de clientes do cliente) | **Sai** | Pouco relevante para a gestão. |
| Resumo: Fase ESG / Progresso ESG | ⏳ | Já está no caso ESG (Gestão → ESG). Fica só se a Lúcia quiser ver isto a partir do cliente. |
| Limite de lucro DE (Familienversicherung), 🔴🟡🟢 (l.249–260) | ⏳ / **Muda** | Única informação que não existe noutro sítio da Gestão, mas só para clientes alemães com limite definido. Se ficar, passa para Dados ou Notas internas, com ícone em vez das bolas emoji. |
| Onboarding (`ChecklistOnboarding`) | **Junta** em Dados → Conta na plataforma | Como proposto a 12/10. O passo "Mensagem" diz "a caixa está logo por baixo", mas embutido os avisos estão escondidos (l.271): o texto mente. O passo "Empresa" manda para Acessos (país), que é um campo duplicado. |
| Avisos (`AvisosCliente`) | — | Já escondido quando embutido. Vive em Mensagens. |
| Documentos (`DocsBrowser`) | **Sai**, depois de verificar | Repete o separador Documentos. Antes de tirar, confirmar que o separador mostra tudo o que está na pasta da conta (ex.: `contratos/`, ficheiros carregados na área antiga). Se não mostrar, é o único acesso a esses ficheiros. |
| "Consultoria & Histórico" (`consulting_notes`, l.283–339) | ⏳ | **É visível ao cliente** (página `/consultoria` do cliente lê a mesma tabela, `Consultoria.jsx:46`), e o ecrã não o diz. Repete Mensagens (para o cliente) e Notas internas (para a equipa). Depende do ponto 9: se a página `/consultoria` do cliente não é usada, os registos passam para Mensagens ou Notas, sem apagar dados. |
| Partes para quando não está embutida (voltar, iniciais, título; l.186–216) | **Sai** | Código morto: o ecrã já não tem rota própria. |

---

## 8. Duplicações entre ecrãs

| Informação ou ação | Onde aparece | Proposta |
|---|---|---|
| **Avença e pagamentos** | Financeiro (contratos + recebimentos) · Notas internas → "Controlo da avença" (também confirma pagamentos, `AreaInterna.jsx:118`) · Dados → Avença (leitura) · CRM "Criar contrato" · Início do cliente antigo (`contabilidade/Inicio.jsx:91`) | Confirmar pagamentos **só no Financeiro**. Na ficha fica o estado "pago / por pagar" com ligação ao Financeiro (como já proposto a 12/10). |
| **PDF do contrato** | Financeiro (anexar) · passo do onboarding · DocsBrowser (pasta `contratos/`) | Anexar só no Financeiro; o onboarding só verifica. |
| **Criar conta** | Acessos · CRM "Criar acesso" · Dados → "Criar conta em Acessos →" | Um só fluxo: criar a conta a partir da ficha (Dados → Conta na plataforma), com a BoasVindas. Acessos fica para a equipa, redefinir e eliminar. O CRM deixa de criar contas. Encaixa no item 12 ("criar uma conta cria a ficha"). |
| **Já entrou / pendente** | Acessos · Dados → Conta · Conta na plataforma (chip) · onboarding "acesso" | Fica em Dados (na ficha) e em Acessos (na lista). Os outros saem. |
| **País / serviço do cliente** | Ficha → Dados · Acessos (`company_settings`) · Empresa na conta do cliente | O serviço sai de Acessos já. O país junta-se no item 12 (R-C2). |
| **"Ver como o cliente"** | Cabeçalho da ficha · Conta na plataforma | Fica só no cabeçalho. |
| **Obrigações pendentes** | Separador Obrigações · Lista de clientes (Próxima obrigação, Atenção) · Início · Conta na plataforma | Sai de Conta na plataforma (e pode divergir). |
| **Documentos** | Separador Documentos · DocsBrowser | Ver a secção 7 (verificar antes de tirar). |
| **Entrada de leads** | CRM "+ Lead" · Diagnósticos · ConsultoriaDetalhe (`l.151`) | As três são legítimas (fontes diferentes) e passam pela mesma função `criarLeadDeContacto`. Fica, mas Diagnósticos passa para dentro do CRM (secção 9). |
| **Notas e histórico** | Notas internas (equipa) · Mensagens (cliente) · Consultoria & Histórico (cliente, sem aviso) · Marketing → Anotações (equipa) · Tarefas | Uma nota interna, uma conversa com o cliente, uma lista de tarefas. ⏳ consulting_notes e Anotações. |
| **Ideias de publicação** | Marketing → Anotações · publicações em estado "Ideia" | Juntar nas publicações "Ideia" (⏳ Letícia). |

---

## 9. Juntar itens de menu

1. **CRM + Diagnósticos → "Prospeção"**. Têm os mesmos papéis (admin e comercial), o mesmo ícone, e um alimenta o outro. Proposta: no topo do CRM, uma faixa ou separador "Diagnósticos novos (N)" com a mesma lista e os botões Juntar / Descartar. O botão manual fica, o que respeita a diretriz de 18/09. A ligação pública do formulário passa para lá. Menu da área: 5 → 4 itens. ⏳ (confirmar com a Lúcia; não perde nada).
2. **Marketing fica à parte.** Outro papel (marketing), outro conteúdo (Instagram), sem dados em comum com o CRM.
3. **Acessos vs Clientes.** As contas de clientes passam a nascer na ficha (secção 8). Acessos fica "Equipa e acessos" e continua a ser o sítio para redefinir, mudar a plataforma e eliminar. Depende do item 12.
4. **Financeiro fica**, como único sítio de dinheiro da LC Office. A ficha só mostra.
5. **Diagnósticos sai da secção "Serviços"** mesmo que a junção não avance (`Sidebar.jsx:114`). Os ícones de Relatórios trimestrais, CRM e Diagnósticos passam a ser diferentes.

---

## 10. Problemas de usabilidade no código

- **Telemóvel:** no CRM só se muda de etapa a arrastar (HTML5 drag & drop), o que não funciona com toque. Não há alternativa.
- **Caixas do navegador** (`prompt`, `alert`, `confirm`) no CRM, incluindo a **palavra-passe num `alert`** (`Crm.jsx:256`).
- **Emojis em vez de ícones** (contra a regra do QA de 10/10): CRM ⏰ ⏱ 📞 💬 ✉ ★ 🔥🌤❄ ✎ ✕; Financeiro 🔗 ✎ ✕; Acessos 🔑 ℹ️ ↻ ⧉; Conta na plataforma 🔴🟡🟢 ● ○.
- **Cores fixas que não seguem o tema** (V2 e modo noturno): `STAGE_TONE` e `#dc2626`/`#0a7a3e`/`#991b1b` no CRM; `TEMPERATURES` em `leadScore.js`; `#0a7a3e`/`#b45309`/`#d1fae5`/`#f1f5f9` no Financeiro; `roleStyle`/`platChip`/`#fef3c7` em Acessos; `KIND_STYLE` e chips em ClienteDetalhe; sobreposições do Feed no Marketing.
- **Rótulos pouco claros:** "Valor do negócio" (é mensal); botão "Ativo" que não muda de texto; chaves cruas "pais:" e "faturacao:" nos Diagnósticos; "Recebimentos · 2026-10".
- **Texto morto:** `subtitle` do CRM, textos de convite em Acessos, partes não embutidas de ClienteDetalhe, passo "caixa logo por baixo" do onboarding.
- **Eliminar sem proteção ao lado de editar:** ✕ nos cartões do CRM e nos contratos; anotações do Marketing apagam sem confirmação.
- **Texto abaixo de 11 px:** nenhum nestes ficheiros (o QA de 10/10 já tratou).
- **Gravação a cada tecla:** nenhuma.
- **Falha de dados (não é só aparência):** o contrato criado pelo CRM não tem `cliente_id`, e o do Financeiro liga à ficha pelo nome. Nos dois casos a avença pode não aparecer na ficha.

---

## 11. Choques com o BACKLOG

- **18/09** (entrada manual no CRM) e **27/08** (formulário como filtro, nada se perde): respeitados. A junção CRM + Diagnósticos mantém o botão e as respostas abaixo do corte.
- **01/10** (Marketing partilhado pelas três): respeitado. O comentário em `Sidebar.jsx:88–90` está desatualizado.
- **Ponto 6:** decide Plataforma "Lite", o separador Conta na plataforma e o que fica de ClienteDetalhe.
- **Ponto 7:** decide a verificação em dois passos (cartão de Acessos) e o que veem os papéis comercial e marketing (afeta quem vê Diagnósticos).
- **Ponto 9:** decide "Consultoria & Histórico" (página `/consultoria` do cliente).
- **Item 12:** as junções de conta, país, ficha no contrato e "fechar lead cria ficha" pertencem-lhe. Aqui só se propõe o remendo provisório.

---

## 12. Plano

**Pode avançar já (sem decisão):**
- CRM: um só controlo de follow-up; sem rótulo "Filtros" nem filtro de temperatura; sem subtítulo das colunas; sem chip de origem e notas no cartão; "+1 tentativa" junta-se a "Registar contacto"; campo Etapa no modal e os "+" por coluna saem; eliminar dentro do modal; rótulo da avença mensal; motivo da perda e valor no modal.
- Diagnósticos: "Copiar ligação"; rótulos legíveis nas respostas; sai da secção Serviços; ícone próprio.
- Marketing: sem a linha de contagens; nota do feed passa a (i); confirmação ao apagar anotação.
- Financeiro: 4 → 2 indicadores; mês junto aos recebimentos e por extenso; Cliente escolhido da ficha; "Ativo / Inativo"; eliminar dentro da edição.
- Acessos: sem campo Serviço; País, Serviço e Plataforma só para clientes; sem o aviso duplicado da palavra-passe; sem a coluna "Criado"; equipa e clientes separados.
- Em todos: emojis passam a ícones e cores fixas a tokens.

**Para a sessão com a Lúcia (pontos 6, 7 e 9) e para a Letícia:**
- juntar CRM e Diagnósticos;
- usar ou não a coluna Mapeado (8 colunas);
- manter o filtro Origem;
- os 5 estados das publicações; Anotações → Ideias e Tarefas; cartão "Próximas publicações";
- serviço próprio no contrato;
- confirmar pagamentos só no Financeiro;
- Plataforma Lite;
- verificação em dois passos (obrigatória? onde fica o cartão);
- o que se salva de Conta na plataforma: receita/saldo, ESG, limite DE, Consultoria & Histórico;
- criar a conta do cliente a partir da ficha (com o item 12).
