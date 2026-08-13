# Plano de implementação — Módulo de Consultoria

> **Base:** transcrição completa da reunião de 13/08/2026 + o documento
> *"Der Businessplan (BP)"* da Câmara de Comércio alemã (IHK), 7 páginas, que a Lúcia enviou.
> **Prazo real:** ela começa a usar com clientes **em setembro**.
>
> **Estado — 13/08/2026:** ✅ **Fases 0 e 1 construídas e testadas** (migração 029 aplicada; fluxo e
> RLS verificados contra a base real). As fases seguintes estão no `BACKLOG.md`, uma entrada
> por fase.

## 1. Correção ao plano anterior: são DUAS consultorias, não uma

A primeira versão deste plano tratou tudo como um fluxo único. A transcrição mostra que são
dois produtos distintos, e ela tem os **dois já amanhã**:

| | **Consultoria gratuita** | **Consultoria de Implementação de Negócio** |
|---|---|---|
| Objetivo | *"entender o negócio da pessoa e que serviços posso oferecer"* | Estruturar o negócio até estar pronto a arrancar |
| Duração | 1 sessão, gratuita | **4 sessões em bloco** |
| Base | O formulário que ela tem no Forms | O documento da IHK |
| Saída | Perceber o encaixe comercial | Plano apresentável **ao banco** |
| Estado | ⚠️ O formulário ainda não chegou | ✅ Documento recebido e estruturado |

O destino final da consultoria de implementação é **financiamento**: *"estruturar esta
informação numa tabela para, em caso de financiamento, teres a informação para apresentar ao
banco"*. Isto muda o desenho do relatório — não é um resumo bonito, é um documento que um
gestor de crédito lê.

## 2. A estrutura real (do documento da IHK)

O documento está em alemão; a Lúcia disse *"podes traduzir para português"*. As perguntas
abaixo são as do original.

### Bloco 1 — Ideia e pessoa *(sessão 1)*

**1.1 A minha ideia de negócio**
- Quais são os meus produtos / que serviços ofereço?
- Porquê estes produtos ou serviços?
- Onde vejo uma lacuna de mercado ou um nicho?
- Em que localização quero começar?
- Sozinho ou com sócios?
- Quando quero iniciar a atividade?
- Em que regime — tempo inteiro ou parcial?

**1.2 As minhas competências pessoais e técnicas** *(juntar CV)*
- Porque me quero tornar independente?
- Que formação e especializações tenho?
- Onde ganhei experiência neste ramo?
- Tenho experiência ou conhecimentos comerciais?
- Se não tenho, como vou colmatar essa lacuna? (seminários, cursos, coaching)
- Qual é a minha situação familiar? (casado, parceria, filhos)
- Quem vive do rendimento desta atividade?
- Existe outro rendimento no agregado?
- Como concilio a família com a independência?
- Como está organizado o apoio às crianças?
- A minha família apoia-me nesta atividade?

### Bloco 2 — Mercado e estratégia *(sessão 2)*

**1.3 Clientes, concorrência, marketing e vendas**
- Quem são exatamente os meus clientes?
- Onde e como os encontro?
- Quem são os meus concorrentes e o que oferecem?
- O que distingue a minha oferta da deles?
- Que vantagens tem a minha oferta?

**1.4 → SWOT + TOWS** ⭐
No original chama-se *"Perspetivas futuras, oportunidades e riscos"*. A Lúcia anotou **no
próprio Word**: *"substituir por uma análise SWOT e criar uma TOWS"* e *"com aquilo que
descobri no SWOT, o que devo fazer?"*.

As perguntas originais desta secção **não se perdem** — passam a alimentar os quadrantes:
- *Que objetivos tenho? Onde quero estar e quando?* → alimenta Oportunidades
- *Há riscos ou oportunidades que já conheço?* → Ameaças / Oportunidades
- *Consigo viver dos excedentes no início?* → Fraquezas
- *E se o primeiro ano correr pior do que o planeado? E se eu adoecer?* → Ameaças

### Bloco 3 — O dinheiro pessoal e o capital *(sessão 3)*

**2.1 Cálculo das retiradas privadas necessárias**
Tabela de rendimentos e despesas do agregado familiar. O princípio que ela sublinhou:
*"a pessoa tem que saber qual é a quantia de dinheiro que precisa para se manter mensalmente,
para não pensar só no negócio"*.

**2.2.1 Necessidade de capital** — investimentos (máquinas, equipamento, mobiliário, viaturas)
+ custos de constituição (consultoria, informação, conceito publicitário, impressos, ação de
abertura) + **reserva** (o documento sugere os custos correntes dos primeiros 3 meses).

**2.2.2 Financiamento** — tem de cobrir a totalidade da necessidade de capital:
- **Capital próprio:** dinheiro + entradas em espécie (viatura, computador, mobiliário)
- **Capital alheio:** empréstimo privado, empréstimo público (KfW *Startgeld* / *Mikrodarlehen*),
  crédito bancário, conta corrente caucionada

### Bloco 4 — Projeções *(sessão 4)*

**2.2.3 Previsão de faturação, custos e lucro** — sempre **faturação líquida (sem IVA)** e
*"planeie com prudência"*. O lucro tem de cobrir **as retiradas privadas do 2.1** mais a
amortização dos créditos — é este o cruzamento que fecha o plano.

**Previsão de liquidez** — considerando sazonalidade, prazos de contratos longos, adiantamentos
e o comportamento de pagamento dos clientes.

## 3. A questão estrutural (mantém-se do plano anterior)

`consulting_notes` está ligada a `auth.users` → só serve quem já tem conta. A reunião foi
explícita ao contrário: *"eu adiciono a pessoa, mas adiciono a pessoa onde?"* → **na própria
consultoria, sem criar conta**.

Tabela `consultorias` com os dados de contacto embutidos e ligações **opcionais** a
`crm_leads` (de onde veio) e a `auth.users` (se um dia vier a ter conta).

## 4. Como aparece na plataforma

**Onde:** entrada **Consultorias** no menu da Gestão, admin apenas.

⚠️ **Restrição de desenho que vem da transcrição:** a consultoria de amanhã é **presencial** e
ela preenche ao vivo — *"eu vou falando, vou perguntando, vou preenchendo"* — com o cliente a
ver o ecrã: *"é legal ter essa coisa visual para a pessoa entrar e ver o que estou a fazer"*.
Ou seja: **tem de ser bonito de mostrar e rápido de preencher ao mesmo tempo**. Nada de
formulários densos.

### Lista
Cartões por consultoria: contacto, empresa, **tipo** (gratuita / implementação), bloco atual e
progresso. "+ Nova consultoria" pede só nome, empresa e tipo.

### Ficha — os 4 blocos
Um bloco por sessão, com o progresso visível. Cada pergunta é uma linha com campo de texto que
guarda sozinho. No telemóvel empilha.

### SWOT — quadro 2×2
```
┌── FORÇAS (interno +) ──┬── FRAQUEZAS (interno −) ──┐
│  + adicionar           │  + adicionar              │
├── OPORTUNIDADES (ext+) ┼── AMEAÇAS (externo −) ────┤
│  + adicionar           │  + adicionar              │
└────────────────────────┴───────────────────────────┘
```

### TOWS — onde a plataforma vale mais que o Word
```
                    FORÇAS                FRAQUEZAS
OPORTUNIDADES  │ SO — atacar        │ WO — melhorar      │
AMEAÇAS        │ ST — defender      │ WT — proteger      │
```
Ao abrir a célula **SO**, a plataforma mostra as forças e as oportunidades já escritas, e ela
escreve a estratégia com elas à vista. Cada estratégia **guarda de que itens nasceu** — é o
*"com aquilo que descobri no SWOT, o que devo fazer?"* dela, tornado rastreável.

### Números — tabelas simples
As quatro tabelas (retiradas privadas, capital, financiamento, faturação/custos/lucro) com
totais automáticos e **a verificação que o documento exige**: o lucro previsto cobre as
retiradas privadas + amortizações? Um semáforo responde.

### Resumo com IA — descritivo, não analítico
Ela pediu: *"o que achas que posso oferecer a este cliente em termos de soluções?"* e
*"faz-me depois um pequeno resumo"*. Mas foi clara no limite: *"não é analítica, mas é o
descritivo"* — o mesmo princípio do ESG. A IA resume o que foi preenchido e assinala lacunas
("falta responder X"); **não decide pela consultora**.

### Relatório
Secções pré-preenchidas + texto editável + **🖨 Imprimir/PDF**, como no Relatório ESG.

### Recursos
Barra lateral só com **links** — Instagram, comunidade, contactos (telefone Alemanha e
Portugal). Sem ficheiros: *"vídeos e coisas não colocaria"*.

## 5. Faseamento

| Fase | O que entra | Estado |
|---|---|---|
| **0** | Tabela + lista + ficha + **Blocos 1 e 2, com SWOT e TOWS** | ✅ **Feito** (migração 029) |
| **1** | Blocos 3 e 4 (as tabelas de números) | ✅ **Feito** |
| **2** | Relatório em PDF | Por fazer — já não tem dependências |
| **3** | Consultoria gratuita (o outro tipo) | ⚠️ Aguarda o formulário dela |
| **4** | Resumo com IA (descritivo) | Por fazer — depende das Fases 1–2 |
| **5** | Formulário público → consultoria + lead no CRM | ⚠️ Aguarda formulário + Filipe |

### O que a Fase 0 entregou

- **`consultorias`** (migração 029) — contacto embutido, sem conta para o cliente; ligações
  opcionais a `crm_leads` e `auth.users`; RLS só admin.
- **Lista** — cartões com tipo, estado e progresso por bloco; criar pede só nome, empresa e
  tipo e **abre logo a ficha**.
- **Ficha** — stepper dos 4 blocos e **guardar automático** (700 ms, sem botão).
- **Blocos 1 e 2** — as 23 perguntas do documento da IHK em PT/DE/EN; respostas guardadas
  **por chave**, para a lista poder ser adaptada sem perder dados.
- **SWOT + TOWS** — cada célula TOWS mostra os itens da SWOT que a alimentam e guarda a
  **origem** de cada estratégia.
- **Recursos** — só links.

### O que a Fase 1 entregou

As seis tabelas dos blocos 3 e 4, com os cálculos em `src/lib/consultoriaCalc.js` e as duas
verificações que fecham o plano:

- **O financiamento cobre a necessidade de capital?** — semáforo no bloco 3.
- **O lucro cobre as retiradas privadas + as amortizações?** — semáforo por ano no bloco 4.

Mais dois automatismos que poupam trabalho na sessão: a **reserva sugere-se sozinha** a partir
dos custos do ano 1 (os 3 meses do documento) e a **liquidez assinala em que mês** a caixa fica
negativa.

**Verificado contra a base real:** criação sem conta, gravação de respostas/SWOT/TOWS com
origem, cálculo do progresso, as três restrições (tipo, bloco 1–4, nome obrigatório) e a RLS —
um cliente não lê, não cria, não altera nem apaga. Registos de teste apagados.

## 6. A decidir com a Lúcia

- **Idioma das perguntas:** traduzo para português, mas o cliente dela pode ser alemão. Fica
  trilingue como o resto (PT/DE/EN)?
- **A tabela de retiradas privadas** tem categorias fixas no documento da IHK — uso essas ou
  ela quer simplificar?
- **A consultoria gratuita** aguarda o formulário.
- **Anexos:** o documento pede *"juntar CV"*. Ligo ao repositório de documentos que já existe?
