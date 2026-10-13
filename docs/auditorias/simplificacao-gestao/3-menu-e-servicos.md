# Simplificação: menu da Gestão, Consultorias e Consultorias ESG

**12/10/2026 · item 13-D do BACKLOG.** Revisão campo a campo e botão a botão do menu lateral da Gestão (`src/components/layout/Sidebar.jsx`), das Consultorias (`src/pages/gestao/Consultorias.jsx`, `ConsultoriaDetalhe.jsx`, `ConsultoriaRelatorio.jsx`) e das Consultorias ESG (`ConsultoriasESG.jsx`, `CasoESG.jsx`, `ApresentacaoESG.jsx`). Segue os critérios de `docs/auditorias/2026-10-12-simplificacao-ficha-cliente.md`. Não editei nenhum ficheiro.

Legenda: **Fica** · **Sai** · **Junta** (passa a viver num sítio só) · **Muda** (fica, mas muda) · **⏳** decisão da Lúcia

> **Achado que não espera pela revisão:** o PDF do relatório da consultoria, "o documento que vai ao banco", imprime as **Notas internas** da ficha com o título "Nota interna" (`src/lib/relatorioModelo.js:273`). Também as envia à IA como "Notas internas da consultora" (`api/consultoria-relatorio.js:235`). São as mesmas notas que o Modo apresentação esconde por serem internas (`ConsultoriaDetalhe.jsx:377`). Tem de se decidir já se saem do PDF ou se mudam de nome.

---

## 1. O problema em números

| | Hoje |
|---|---|
| Itens no menu da administradora | **14** em 4 grupos (Início · Clientes 3 · Gestão 7 · Serviços 3) |
| Ícones repetidos no menu | `IconKpi` em 3 itens (Relatórios, CRM, Diagnósticos) · `IconRelatorios` nas Consultorias e em 2 itens da ESG |
| Rótulos repetidos | Grupo "Clientes" com o item "Clientes" · grupo "Gestão" dentro da plataforma "Gestão" · "Diagnósticos" (formulário público) e "Diagnóstico ESG" (fase 2) são coisas diferentes com o mesmo nome |
| Coisas diferentes chamadas "Consultoria" | **3**: Consultorias (questionário IHK, tabela `consultorias`) · "Consultoria & Histórico" (`consulting_notes`, na ficha → Conta na plataforma, e item "Consultoria" do menu do cliente) · Consultorias ESG |
| Botões "Modo apresentação" que fazem coisas diferentes | 2 (Consultoria: esconde o que é interno na própria página · ESG: abre outra página só de leitura) |
| Sítios onde se vê o progresso de uma consultoria | **5** (barras do passo a passo dos blocos, contador do Enquadramento, contador no rodapé da ficha, lista, "x% preenchido" no Relatório) |
| Sítios onde vive a mesma pessoa ou empresa | até **6** sem ligação entre si: consultoria · caso ESG · lead do CRM · resposta do Diagnóstico · ficha do cliente · conta (R-C1) |

---

## 2. Menu lateral da Gestão (`Sidebar.jsx`)

**Para que serve:** chegar a cada área da Gestão. Também tem a troca para a Demonstração, a língua, o tema e a saída.

### Estrutura e itens (`NAV.management`, `Sidebar.jsx:91-116`)

| Elemento | Veredicto | Porquê |
|---|---|---|
| Logótipo (`:228-230`) | **Fica** | — |
| Início (`:95`), solto no topo | **Fica** | — |
| Rótulo de grupo "Clientes" (`:215`) | **Muda** | Repete o item "Clientes" logo abaixo. O Início, os Clientes e o trabalho de todos os dias ficam juntos, sem rótulo (ver menu proposto). |
| Clientes (`:98`) | **Fica** | É onde a equipa passa o dia. |
| Relatórios (`:99`, rótulo "Relatórios") | ⏳ | Depende do ponto 6 (relatórios trimestrais visíveis ao cliente ou só PDF). O Início já mostra "relatórios do trimestre por fazer". Se ficar, passa a chamar-se **"Relatórios trimestrais"**: "Relatórios" sozinho confunde-se com os Relatórios ESG e com o Relatório da consultoria. |
| Mensagens (`:100`) | **Fica** | Caixa de todos os clientes. Sobe para junto de Clientes e Tarefas. |
| Rótulo de grupo "Gestão" (`:213`) | **Muda** | Fica "Gestão" dentro de "Gestão". Com o menu proposto, deixa de ser preciso. |
| Agenda (`:103`) | **Junta** → Tarefas | Os mesmos dados (tarefas e prazos de todos os clientes) e os mesmos filtros que as Tarefas, por dia, semana e mês (`portal/paginas/Agenda.jsx:11-12`). Passa a ser uma vista "Lista · Calendário" dentro de Tarefas. Sai um item. |
| Tarefas (`:104`) | **Fica** | Recebe a Agenda como vista. |
| Horas (`:105`) | **Fica** | Totais da equipa por cliente e por atividade (pedido da Letícia, 09/10). Registar horas na ficha do cliente continua (⏳ da ficha). Sobe para o grupo de todos os dias. |
| Prospeção (CRM) (`:106`) | **Fica** → "Prospeção" | Recebe os Diagnósticos (ver abaixo). |
| Marketing (`:107`) | **Fica** | Partilhado pelas três (reunião de 01/10). |
| Financeiro (`:108`) | **Fica** | Só admin. |
| Gestão de Acessos (`:109`) | **Muda** → "Acessos", no fim do menu | Usa-se raramente. O nome comprido destoa dos outros, que têm uma palavra. |
| Rótulo "Serviços" (`:214`) | **Fica** | Divisão gestão/serviços da reunião de 10/09. |
| Consultorias (`:112`) | **Fica** | — |
| Consultorias ESG (`:113`) | ⏳ **Junta** (proposta) | As duas listas já usam a mesma tabela `ListaCasos`, de propósito ("a Lúcia lê as duas da mesma maneira", `ListaCasos.jsx:4-6`). Proposta: um item "Consultorias" com dois separadores, Negócio · ESG. Os casos ESG continuam a abrir num separador próprio do browser. **Conflito:** a decisão de 18/09 ("a ESG mantém-se módulo separado") é sobre o produto, não sobre o menu, mas convém perguntar. |
| Diagnósticos (`:114`, em Serviços) | **Junta** → Prospeção | Não é um serviço: é a caixa de entrada do formulário público, que decide o que sobe ao CRM (`Diagnosticos.jsx:12-17`). Passa a ser um separador "Formulário" dentro da Prospeção e o nome deixa de chocar com o "Diagnóstico ESG". Não se perde nada: as respostas abaixo do corte continuam guardadas. |
| Visibilidade por papel (`roles`, `STAFF`) | ⏳ | O comercial e o marketing veem Clientes, Relatórios, Mensagens, Agenda, Tarefas e Horas. Depende do ponto 7 (o que essas contas veem). |
| Ícones | **Muda** | Um ícone por item. Hoje Relatórios, CRM e Diagnósticos usam o mesmo gráfico (`:99,106,114`) e a Agenda usa o ícone das Obrigações (`:103`). |
| Badge de tarefas em atraso (`:180,184-186`) | **Muda** | Só aparece se o portal já foi aberto nesta sessão: o número aparece e desaparece. Ou é sempre calculado, ou sai. |
| Caixa com o nome da empresa por cima do menu, num caso ESG (`:241-245`) | **Junta** → tira do caso | O nome já está na tira do `CasoESG.jsx:88`. A caixa usa cores fixas. |

### Rodapé

| Elemento | Veredicto | Porquê |
|---|---|---|
| Círculo com as iniciais (`:259-261`) | **Sai** | Decorativo, como o quadrado de iniciais da ficha. O nome está mesmo ao lado. |
| Nome do utilizador (`:263-265`) | **Fica** | — |
| Botão Sair (`:267-269`) | **Fica** | — |
| Alternador Gestão / Demonstração (`:274-290`) | ⏳ | Ocupa espaço fixo em todas as páginas por uma coisa que se usa só nas demonstrações. Pergunta: a Lúcia usa a Demonstração? Se usa, passa a ser uma ligação discreta ("Abrir demonstração") junto ao nome. Se não usa, sai. Nos clientes "both" (Contabilidade + ESG) fica como está. |
| Bandeiras PT / DE / EN (`:293-297`) | ⏳ **Muda** | Pergunta: alguém usa EN? Se não, ficam só PT e DE. São `<span>` com `onClick`, sem teclado nem leitor de ecrã: passam a botões. Liga-se ao ponto 6 (onde o cliente muda a língua). |
| Tema claro/escuro (`:298-300`) | ⏳ | Já está na sessão 16-B (modo noturno). O texto de ajuda não tem EN e os nomes `SunIcon`/`MoonIcon` estão trocados (`:47-48`), o que é só confusão no código. |

---

## 3. Consultorias — lista (`Consultorias.jsx`)

**Para que serve:** ver as consultorias de arranque de negócio em curso e abrir ou criar uma.

| Elemento | Veredicto | Porquê |
|---|---|---|
| Título `h1` escondido ("so-leitores", `:94`) | **Fica** | — |
| Botão "+ Nova consultoria" (`:96`) | **Fica** | — |
| Formulário: Nome * (`:105`) | **Fica** | — |
| Formulário: Empresa (`:106`) | **Fica** | — |
| Formulário: Tipo, Implementação de negócio / Gratuita (`:107-111`) | ⏳ | Só serve para pôr uma etiqueta: as perguntas, o relatório e o PDF não mudam com o tipo (não é usado em `relatorioModelo.js` nem na API). Depois de criada a consultoria, o tipo **não se pode mudar** na ficha. Pergunta: a distinção serve para alguma coisa (faturação, estatística)? Se não, sai. Se sim, passa a ser editável na ficha. |
| Formulário: E-mail, Telefone, Setor (`:113-117`) | **Junta** → ficha | Os mesmos três campos estão no cabeçalho da ficha (`ConsultoriaDetalhe.jsx:262-267`), para onde a criação leva logo a seguir. Criar só com Nome e Empresa arranca mais depressa numa sessão ao vivo. Não se perdem dados. |
| Mensagem de erro "é necessária a migração 029" (`:55`) | **Muda** | Texto técnico. Passa a "Não foi possível carregar. Tenta de novo." |
| Filtros Ativa / Concluída / Pausada / Todas (`:128-136`) | **Fica** | — |
| Quadro vazio com 🗂 em 34 px (`:139-144`) | **Muda** | Só o texto, ou um ícone SVG. |
| Coluna Cliente: nome · empresa · setor | **Fica** | — |
| Coluna Cliente: etiqueta do Tipo (`:159`) | ⏳ | Segue o Tipo. |
| Coluna Estado (`:158`) | **Muda** | Com o filtro "Ativa" (o habitual), todas as linhas dizem "Ativa". Mostrar a coluna só no filtro "Todas". |
| Coluna Blocos, 4 barras (`:160`) | **Fica** | — |
| Coluna Progresso, "Bloco 2 · 14/40" (`:161`) | **Muda** | "Bloco 2" repete a barra destacada ao lado. Fica só "14/40 respostas" (ou %). O "bloco atual" é marcado sem querer (ver ficha). |
| "Abrir →" em cada linha | **Fica** | A linha inteira já abre. Pode encolher para uma seta. |
| Textos que nunca aparecem: `eyebrow`, `subtitle`, `abrir` (`:29-57`) | **Sai** | Código morto. |

---

## 4. Ficha da consultoria (`ConsultoriaDetalhe.jsx`)

**Para que serve:** preencher a consultoria **ao vivo**, muitas vezes com o cliente a ver o ecrã. Por isso grava sozinha e tem modo apresentação.

### Cabeçalho

| Elemento | Veredicto | Porquê |
|---|---|---|
| "← Consultorias" (`:228`) e faixa do Modo apresentação (`:222-226`) | **Fica** | — |
| Nome, editável no próprio título (`:235`) | **Fica** | Atenção: é fácil mudá-lo sem querer porque não parece um campo. Proposta: um contorno ao passar o rato. |
| Empresa, editável no título (`:237`) | **Fica** | — |
| "A guardar… / Guardado ✓" (`:241`) | **Muda** | Cor fixa `#0a7a3e`; passa para o token `t.dueOk.ink`. |
| Etiqueta do Tipo (`:244`) | ⏳ | Segue o Tipo (lista). Hoje não se consegue mudar. |
| "+ Juntar ao CRM" / "No CRM ✓" (`:245-251`) | **Fica**, **Muda** o destino | O botão manual foi decidido a 18/09. "No CRM ✓" abre o quadro do CRM inteiro (`:246`), não o lead. Deve abrir o lead. |
| "Relatório →" (`:252`) | **Fica** | É o que se entrega. |
| Estado Ativa / Concluída / Pausada (`:254-256`) | **Fica** | — |
| "Modo apresentação", o botão principal (`:257`) | **Fica** | Ver a colisão de nome com a ESG nas duplicações. |
| Grelha E-mail · "Contacto" · Setor (`:262-267`) | **Muda** | "Contacto" é o telefone: passa a "Telefone". "E-mail" e "Setor" estão escritos à mão no código e não se traduzem (`:263`): em DE aparece "Setor". |

### Bloco 0 · Enquadramento (`components/consultoria/BlocoEnquadramento.jsx`)

| Elemento | Veredicto | Porquê |
|---|---|---|
| Os 8 campos (país, já iniciou, data, regime, IVA, faturação, contabilista, dificuldade) | **Fica** | Alimentam o aviso e o relatório (`api/consultoria-relatorio.js:142`). Ver duplicações: são as perguntas do formulário público, que se voltam a escrever à mão. |
| Subtítulo "Do formulário de diagnóstico inicial" (`:30`) | **Muda** | Faz pensar que os dados vêm do formulário, mas escrevem-se à mão. Passa a "As perguntas do diagnóstico inicial". |
| Contador 5/8 (`:50`) | **Sai** | Mais um contador de progresso. |
| Aviso "Esta pessoa já está a faturar" com ⚠ (`:54-58`) | **Fica** | Útil. O "Bloco 1 para negócio em curso" está em Depois da entrega. Ícone SVG em vez do caractere ⚠. |
| "Nas palavras do cliente" (`:94-99`) | **Fica** | Entra no relatório. |
| O cartão inteiro, sempre aberto em cima | **Muda** | Depois da primeira sessão já está preenchido e só empurra o trabalho para baixo. Fechado, mostra uma linha de resumo ("PT · já fatura · regime simplificado") que se abre para editar. |

### Blocos

| Elemento | Veredicto | Porquê |
|---|---|---|
| Passo a passo dos 4 blocos com barras (`:273-291`) | **Fica**, **Muda** o efeito | Clicar num bloco só para espreitar **grava esse bloco como o atual** (`:278`) e muda a coluna Progresso da lista. Na ESG a fase é calculada, "não marcada à mão" (`ConsultoriasESG.jsx:12`). Proposta: o bloco atual passa a ser o primeiro por acabar. |
| Subtítulo do bloco, "Sessão 1 · …" (`:294`) | **Fica** | — |
| Cartão 🚧 "Este bloco chega na próxima fase" (`:296-301`) | **Sai** | Código morto: nenhum bloco tem `porConstruir` em `consultoriaBlocos.js`. |
| Números das secções do IHK, "1.1 … 1.4b, 2.1, 2.2.1" (`:306`) | **Muda**, depois do item 15 | Não batem com os blocos (o Bloco 3 tem as secções 2.1 a 2.2.2). Ou saem, ou passam a "3.1, 3.2". A estrutura pode mudar com os 8 passos do mentor. |
| Nota ⓘ por secção (`:309`) | **Fica** | — |
| Perguntas (textareas) (`:312-318`) | **Fica** | Que perguntas saem é com o **item 15** (⏳ ponto 10). Não proponho cortes aqui. |
| SWOT: 4 quadrantes (`:321-326`) | **Fica** | Decisão de 13/08. |
| SWOT: "interno +" / "externo −" no cabeçalho do quadrante (`:410`) | **Sai** | Decorativo: o nome e a cor do quadrante já o dizem. |
| SWOT: contador de pontos por quadrante (`:411`) | **Sai** | Os pontos estão à vista. |
| SWOT: campo "+" que acrescenta **ao sair do campo** (`:419`) | **Muda** | Clicar noutro sítio acrescenta texto a meio. Passa a acrescentar só com Enter ou com um botão. |
| SWOT: perguntas de apoio (`:328-341`) | **Fica**, fechadas por omissão | — |
| TOWS: texto de ajuda, 4 células, origem rastreável (`:353-371`, `CelulaTows`) | **Fica** | Decisão de 13/08. É o que dá valor à TOWS. |
| Tabelas de números dos Blocos 3 e 4 (`TabelasNumeros.jsx`) | **Fica** | O semáforo usa os emojis 🟢🔴: passa a ícone. |

### Rodapé da ficha

| Elemento | Veredicto | Porquê |
|---|---|---|
| Notas internas (`:377-380`) | **Fica**, ⏳ | Ver o achado no topo: hoje vão para o PDF do banco. Pergunta: as notas são para o banco ou não? Se não, saem do PDF. Se sim, mudam de nome (ex.: "Observações da consultora"). |
| Recursos (links) (`:381-394`) | **Muda** | Ficam como dois campos de texto e **não se podem clicar** (não há `<a>`). Passam a mostrar a ligação, com um lápis para editar. O "—" de quando está vazio sai. |
| Contador final "14/40" (`:397`) | **Sai** | É o quinto sítio com o progresso. |

---

## 5. Relatório da consultoria (`ConsultoriaRelatorio.jsx`)

**Para que serve:** a IA escreve um rascunho a partir da ficha, a Lúcia edita por cima e sai um PDF para o banco.

| Elemento | Veredicto | Porquê |
|---|---|---|
| "← Voltar à consultoria" (`:145`) | **Fica** | — |
| Sobretítulo "Consultoria" + título "Relatório" a 34 px (`:149-150`) | **Muda** | O sobretítulo é decorativo e a lista esconde o seu título. O título passa a ser o que interessa: "Relatório · Nome". |
| "Nome · Empresa — 62% preenchido" (`:151-153`) | **Fica** | — |
| "Guardado ✓" (`:156`) | **Muda** | Cor fixa `#0a7a3e`. Mostra "Guardado" **mesmo quando a gravação falha**: `editar` não verifica o erro (`:116`). |
| Imprimir / PDF (`:157-159`) | **Fica** | — |
| Gerar com IA / Gerar de novo (`:160-164`) | **Fica** | — |
| Parágrafo ⓘ com 3 frases (`:168`) | **Muda** | Fica uma linha: "A IA descreve, não avalia. O teu texto ganha sempre. Revê antes de enviar." |
| Quadro "A gerar…" e quadro vazio (`:172-184`) | **Fica** | Já com ícones SVG. |
| "O que ainda falta" (lacunas) (`:187-194`) | **Fica**, **Muda** | É calculado na geração e fica desatualizado à medida que a ficha se preenche. Acrescentar "na geração de dd/mm". |
| 6 secções editáveis com a etiqueta "editado por ti" e "Descartar o meu texto" (`:197-217`) | **Fica** | — |
| Gravação das secções (`:110-119`) | **Muda** (risco de perda) | Grava 0,7 s depois da última tecla, mas ao sair da página o temporizador é **apagado sem gravar** (`:80`). A última frase escrita perde-se. É a mesma falha que o R-A6 corrigiu na ficha. Passa a gravar ao sair do campo e também ao sair da página. |
| "Gerado em … · modelo" (`:219-224`) | **Muda** | Fica a data. O nome técnico do modelo sai. |

---

## 6. Consultorias ESG — lista (`ConsultoriasESG.jsx`)

**Para que serve:** um caso ESG por empresa. A Lúcia preenche e o cliente vê o percurso e o relatório.

| Elemento | Veredicto | Porquê |
|---|---|---|
| Botão "+ Nova consultoria ESG" (`:117`) | **Fica** | — |
| Formulário: Empresa, Pessoa de contacto * (`:126-129`) | ⏳ **Muda** | "Um caso por empresa", mas o campo obrigatório é a pessoa. Pergunta: passa a ser obrigatória a Empresa? |
| Formulário: E-mail, Telefone, Setor (`:130-134`) | **Junta** → "Editar" do caso | Já se editam no caso (`CasoESG.jsx:113`). Criar só com Empresa e Pessoa, como nas Consultorias. |
| Erro "migração 036" (`:55`) | **Muda** | Texto técnico. |
| Filtros de estado (`:143-151`) | **Fica** | — |
| Quadro vazio com 🌱 (`:154-159`) | **Muda** | Só o texto, ou um ícone SVG. |
| Coluna Empresa · contacto · setor (`:173-174`) | **Fica** | — |
| Etiqueta "Conta" (`:176`) | **Fica** | Diz se o cliente pode ver o caso. |
| Coluna Estado | **Muda** | Como nas Consultorias: só no filtro "Todas". |
| Coluna Fases, 5 barras calculadas (`:177`) | **Fica** | — |
| Coluna Próximo passo, "Diagnóstico · 40%" (`:178-180`) | **Fica** | — |
| Abre num separador próprio do browser (`:181`) | **Fica** | Decisão de 19/09. |
| Textos que nunca aparecem: `eyebrow`, `subtitle`, `fase`, `proxima`, `abrir` | **Sai** | Código morto. |

---

## 7. Caso ESG aberto (`CasoESG.jsx` + as 6 páginas ESG)

**Para que serve:** uma tira fina em cima (quem é, estado, o que o cliente vê) e, por baixo, as páginas ESG tal como o cliente as vê.

| Elemento | Veredicto | Porquê |
|---|---|---|
| "← Consultorias ESG" (`:86`) | **Fica** | — |
| Empresa + pessoa (`:88-89`) | **Fica** | É o único sítio do nome; a caixa no menu lateral sai. |
| "✏️ Editar" (`:90`) | **Muda** | Ícone SVG em vez do emoji. |
| Formulário de edição, com a lista "Conta na plataforma" (`:111-127`) | **Fica** | Só admin. |
| "Modo apresentação ↗" (`:93-94`) | **Muda** o nome | Faz outra coisa que o botão com o mesmo nome na Consultoria. Passa a "Apresentar ao cliente ↗". |
| Estado (lista em etiqueta) (`:95-98`) | **Fica** | — |
| Etiqueta "🔗 Conta ligada / sem conta" (`:99-101`) + caixa "O cliente vê percurso e relatório" (`:102-107`) | **Junta** | Dois controlos para a mesma pergunta. Fica um: **"Cliente vê: Sim · Não"**, ou "sem conta (ligar em Editar)". Sem emoji. |
| Menu ESG: Percurso, Materialidade, Diagnóstico ESG, KPIs & Monitorização, Projetos ESG, Relatórios ESG (`Sidebar.jsx:75-80`) | ⏳ **Muda** | Os nomes não batem com as fases (`esgPercurso.js`: Indicadores, Relatório) e o sufixo "ESG" repete-se dentro de uma secção ESG. Está no R-B10 ("nomes das fases"): alinhar o menu e as fases quando a Lúcia decidir. |

---

## 8. Apresentação ESG (`ApresentacaoESG.jsx`)

**Para que serve:** página sem menus nem campos, com letra grande, para mostrar ao cliente ou imprimir. Só lê, não grava nada.

| Elemento | Veredicto | Porquê |
|---|---|---|
| Barra: empresa, ano de referência (só com mais de um ano), Imprimir / PDF, Fechar (`:145-157`) | **Fica** | Cores fixas `#e9dfc4`, `#c9a84c`, `#0a2f1a`: passam a tokens. |
| Capa: sobretítulo, empresa a 58 px, setor · ano · data (`:161-167`) | **Fica** | Numa apresentação, a capa faz parte do documento. |
| Percurso: % geral + barra (`:172-178`) | **Fica** | — |
| Percurso: 5 cartões de fase (`:179-194`) | **Muda** | O estado aparece três vezes: fundo verde, barra e etiqueta. Ficam a barra e a etiqueta. |
| Percurso: Próximo passo (`:195-199`) | **Fica** | — |
| Matriz de dupla materialidade (`:206-227`) | **Fica** | As siglas nos círculos têm **9 px** (`:224`). Passam a ≥ 11 px, ou fica a lista ao lado como legenda. |
| Lista de temas materiais com 🎯 Meta e 💶 Payback (`:229-248`) | **Fica**, **Muda** | Texto ou ícone SVG em vez dos emojis. |
| Os números, KPIs com a diferença face ao ano anterior (`:253-267`) | **Fica** | Saídas descritivas, de ano para ano (diretrizes). O CO₂ total depende do R-B10 (total vs scopes). |
| O plano: projetos com investimento, poupança e payback (`:270-294`) | **Fica** | Diretriz: os projetos entram com o payback. A barra de progresso não tem número: acrescentar %. 🎯 passa a ícone. |
| Rodapé "Lúcia Cílio · Office Consulting" | **Fica** | — |
| Impressão em modo noturno | **Muda** | O `@media print` força o fundo branco, mas os cartões ficam com as cores escuras do tema (`:138`). A página deve forçar o tema claro. |
| Apresentação vs Relatórios ESG, ambos com "Imprimir / PDF" (`RelatoriosESG.jsx:146`) | ⏳ | Pergunta: o que vai para o cliente, o PDF visual (Apresentação) ou o relatório descritivo com texto (Relatórios ESG)? Se for só um, o outro deixa de imprimir. |

---

## 9. Duplicações entre ecrãs

| Informação | Onde aparece | Proposta |
|---|---|---|
| A pessoa ou empresa (nome, e-mail, telefone, setor) | consultoria · caso ESG · lead do CRM (cópia feita com "Juntar ao CRM", que não se atualiza depois) · resposta do Diagnóstico · ficha do cliente · conta | Item **12** (uma ficha por cliente, R-C1). Até lá, a consultoria e o caso ESG não têm ligação nenhuma à ficha do cliente. |
| As perguntas de enquadramento (país, regime, IVA, faturação, contabilista, dificuldade) | formulário público → Diagnósticos · lead do CRM (`enquadramento`) · Bloco 0 da consultoria, **escrito outra vez à mão** | Item 12: quem vem do Diagnóstico deve trazer as respostas. Para já, tirar da ficha o subtítulo que engana. |
| "Consultoria" | Consultorias (IHK) · "Consultoria & Histórico" (`consulting_notes`, em `ClienteDetalhe.jsx:83`, na ficha → Conta na plataforma) · item "Consultoria" do menu do cliente (`/consultoria`) · Consultorias ESG | Mudar o nome do segundo e do terceiro (ex.: "Notas partilhadas"). **Conflito:** a revisão da ficha propõe tirar o separador "Conta na plataforma". É o único sítio onde se escrevem as `consulting_notes` que o cliente lê em `/consultoria`. Antes de o tirar, ou mudam de sítio, ou se decide que saem (ponto 6). |
| Notas | Notas internas da consultoria · "Nas palavras do cliente" · Notas internas da ficha do cliente · notas do lead | Item 12. |
| Progresso da consultoria | passo a passo dos blocos · contador do Enquadramento · contador do rodapé · lista ("Bloco N · x/y") · Relatório ("x% preenchido") | Ficam as barras dos blocos (ficha e lista) e o % do Relatório. |
| "Bloco atual" (consultoria) vs "fase" (ESG) | a mesma tabela `ListaCasos`, com uma regra diferente em cada lado | O bloco passa a ser calculado, como a fase da ESG. |
| Percurso ESG | barras da lista · página Percurso · Apresentação · "Fase ESG" em `ClienteDetalhe` | Aceitável: tudo é calculado. Só o `ClienteDetalhe` sai, se o separador sair. |
| Dois PDFs ESG | Apresentação · Relatórios ESG | ⏳ (ver Apresentação). |
| Nome da empresa num caso ESG | tira do caso · caixa no menu lateral | Fica só na tira. |
| "Modo apresentação" | Consultoria (esconde o que é interno) · ESG (abre outra página) | O da ESG passa a "Apresentar ao cliente". |
| Agenda vs Tarefas | os mesmos dados e filtros | Uma página com duas vistas. |
| Entradas no CRM | Diagnósticos (+ Juntar ao CRM) · Consultoria (+ Juntar ao CRM) | O botão manual fica (18/09). Os Diagnósticos passam para dentro da Prospeção. |

---

## 10. Menu proposto

**Antes: 14 itens em 4 grupos**
```
Início
CLIENTES   Clientes · Relatórios · Mensagens
GESTÃO     Agenda · Tarefas · Horas · Prospeção (CRM) · Marketing · Financeiro · Gestão de Acessos
SERVIÇOS   Consultorias · Consultorias ESG · Diagnósticos
```

**Depois: 10 a 12 itens em 4 grupos, por ordem de uso**
```
Início · Clientes · Tarefas (Lista | Calendário) · Mensagens · Horas
         [+ Relatórios trimestrais, se o ponto 6 os mantiver]
SERVIÇOS   Consultorias (Negócio | ESG)        ⏳ ou dois itens, como hoje
COMERCIAL  Prospeção (Quadro | Formulário) · Marketing
ESCRITÓRIO Financeiro · Acessos
```
Mudanças: a Agenda vai para dentro de Tarefas. Os Diagnósticos vão para dentro da Prospeção. As Consultorias ESG juntam-se às Consultorias, se a Lúcia aceitar. Os rótulos repetidos "Clientes" e "Gestão" saem. As áreas de todos os dias ficam juntas em cima e os Acessos vão para o fim. No rodapé saem as iniciais. A Demonstração, o EN e o tema esperam pela Lúcia e pela 16-B.

---

## 11. Problemas de UX no código

- **Gravar a cada tecla.** A ficha da consultoria grava 0,7 s depois de cada tecla (`ConsultoriaDetalhe.jsx:128-140`). É de propósito (uso ao vivo) e grava o que falta ao sair da página. Proponho mantê-la como **exceção assumida** ao R-B11. O Relatório faz o mesmo, mas **perde a última edição** ao sair e não apanha erros (`ConsultoriaRelatorio.jsx:80,110-119`): corrigir.
- **Ações escondidas.** A SWOT acrescenta ao sair do campo (`:419`). O passo a passo grava o bloco ao clicar (`:278`). O nome edita-se no próprio título (`:235`).
- **Emojis em vez de ícones** (regra do QA de 10/10): 🗂 `Consultorias.jsx:141` · 🚧 `ConsultoriaDetalhe.jsx:298` · ⚠ `BlocoEnquadramento.jsx:56` · 🟢🔴 semáforo em `TabelasNumeros.jsx` · 🌱 `ConsultoriasESG.jsx:156` · ✏️ e 🔗 `CasoESG.jsx:90,100` · 🎯 e 💶 `ApresentacaoESG.jsx:239,241,279`. Os botões "✕" não têm `aria-label`.
- **Texto abaixo de 11 px:** siglas da matriz a 9 px (`ApresentacaoESG.jsx:224`). O resto está a 11 px ou mais.
- **Cores fixas:** `Sidebar.jsx:47-48` (`#c9a84c`), `:242` (rgba, `#f3ecdb`), `:263`, `:286` (`#0a2f1a`) · `ConsultoriaDetalhe.jsx:241` (`#0a7a3e`), `:282` · `ConsultoriaRelatorio.jsx:156` · `ApresentacaoESG.jsx:145-155` · cores da SWOT em `consultoriaBlocos.js:157-160` (fundos claros que destoam no modo noturno).
- **Rótulos pouco claros ou sem tradução:** "Contacto" para o telefone e "E-mail"/"Setor" escritos à mão (`ConsultoriaDetalhe.jsx:263`) · "Relatórios" sem "trimestrais" · dois "Diagnóstico" · três "Consultoria" · dois "Modo apresentação".
- **Texto técnico à vista:** "migração 029/036" (`Consultorias.jsx:55`, `ConsultoriasESG.jsx:55`) · nome do modelo de IA (`ConsultoriaRelatorio.jsx:222`).
- **Quadros vazios com ruído:** emoji de 34 px nas listas · "—" nos Recursos · cartão 🚧 morto.
- **Código morto:** textos `eyebrow`/`subtitle` que nunca aparecem nas duas listas · ramo `porConstruir` na ficha da consultoria.
- **Acessibilidade:** bandeiras de língua em `<span>` sem teclado (`Sidebar.jsx:295`) · ligações dos Recursos que não se podem clicar.
- **Inconsistências:** o badge de tarefas só aparece com o portal carregado · os títulos de página estão escondidos nas listas e visíveis a 34 px no Relatório.

---

## 12. Plano

**Sem decisão da Lúcia (pode avançar já):**
- **Menu:** Agenda dentro de Tarefas; Diagnósticos dentro da Prospeção; um ícone por item; sem os rótulos repetidos; Acessos no fim; sem as iniciais no rodapé; badge sempre calculado ou fora.
- **Listas:** criar só com o essencial; Estado só no filtro "Todas"; Progresso sem "Bloco N"; erros sem texto técnico; sem emojis.
- **Ficha da consultoria:** Enquadramento fechado com resumo; bloco atual calculado; sem 🚧, sem contadores repetidos e sem "interno +"; SWOT só com Enter; Recursos clicáveis; "Telefone" e rótulos traduzidos; "No CRM ✓" abre o lead.
- **Relatório:** gravação corrigida, sem perder a última edição e sem dizer "Guardado" quando falha; aviso numa linha; sem o nome do modelo.
- **Caso ESG:** um controlo "Cliente vê"; "Apresentar ao cliente ↗"; o nome só na tira.
- **Apresentação:** tema claro ao imprimir; % nos projetos; sem emojis; siglas a 11 px.
- **Em todos os ecrãs:** tokens em vez de cores fixas.

**Para a reunião com a Lúcia (pontos 6, 7 e 10):**
- **Já, antes de mais um PDF sair:** as Notas internas no PDF do banco.
- **Tipo da consultoria:** Gratuita / Implementação serve para alguma coisa?
- **Menu:** juntar Consultorias e Consultorias ESG num item (ver a decisão de 18/09); Relatórios trimestrais (ponto 6); o que veem o comercial e o marketing (ponto 7).
- **Rodapé:** usa a Demonstração? Alguém usa EN? Modo noturno (16-B).
- **ESG:** Empresa obrigatória no caso ESG; Apresentação vs Relatórios ESG (qual vai para o cliente); nomes das fases e do menu ESG (R-B10).
- **Antes de tirar o separador "Conta na plataforma" da ficha:** onde passam a viver as `consulting_notes` ("Consultoria & Histórico").
- **Perguntas da consultoria e numeração do IHK:** com o item 15 (8 passos do mentor).
