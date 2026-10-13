# Simplificação — ficha do cliente (Gestão → Clientes → cliente)

**12/10/2026 · item 13-D do BACKLOG, primeiro ecrã.** Revisão campo a campo e botão a botão
da página do cliente (`src/portal/paginas/PaginaCliente.jsx` e os separadores em
`src/portal/paginas/cliente/`), do ponto de vista de quem quer um sistema simples: o que ajuda a
trabalhar o cliente fica; o que é decorativo, repetido ou raramente usado sai ou passa para um
sítio só.

> A mesma página serve a área do cliente (perfil Cliente). O que se mudar no Resumo, nas
> Obrigações e nos Documentos muda também para o cliente — cada alteração tem de ser vista nos
> dois perfis.

---

## 1. O problema em números

| | Hoje |
|---|---|
| Separadores | **9** (Resumo, Obrigações fiscais, Tarefas, Documentos, Relatórios, Mensagens, Dados do cliente, Notas internas, Conta na plataforma) |
| Botões no cabeçalho | 4 |
| Cartões no Resumo | 7 (2 indicadores + 5 cartões) |
| Sítios onde se escreve um WhatsApp | **4** (botão do cabeçalho, Resumo, Mensagens, detalhe de cada obrigação) |
| Formas de dizer em que ponto está uma obrigação | **3** (estado com 8 opções, checklist de 9 passos, "processo" em setas) |

### Informação repetida

| Informação | Onde aparece |
|---|---|
| Responsável | cabeçalho · Dados · Notas internas |
| Serviços e periodicidade | cabeçalho · Obrigações (critérios) · Dados · Notas internas |
| País, forma jurídica, regime | cabeçalho · Obrigações (critérios) · Dados |
| Próxima obrigação | indicador do Resumo · 1.ª linha do cartão Obrigações · título da Checklist |
| Checklist da obrigação | Resumo · detalhe da obrigação (+ "Processo", que a repete em setas) |
| Avença | Dados · Notas internas · Financeiro |
| Cliente desde | Dados · Notas internas |
| Documentos | separador Documentos · Conta na plataforma (navegador de pastas) |
| Escrever ao cliente | botão Mensagem (só abre o separador) · separador Mensagens |
| Nova tarefa | botão do cabeçalho · separador Tarefas · detalhe da obrigação |
| Obrigações entregues | "Últimas declarações entregues" no Resumo · filtro "Entregues" das Obrigações |

---

## 2. Campo a campo

Legenda: **Fica** · **Sai** · **Junta** (passa a viver num sítio só) · **⏳** decisão da Lúcia

### Cabeçalho

| Elemento | Veredicto | Porquê |
|---|---|---|
| Quadrado com as iniciais ("AB", 104 px) | **Sai** | Decorativo; ocupa a altura de três linhas de informação. |
| Nome do cliente | **Fica** | — |
| Chip do país | **Fica** | Decide as regras fiscais; vê-se de relance. |
| Chip "♥ Ativo" | **Sai** quando ativo | Quase todos estão ativos — o chip só informa quando *não* está (Em pausa, Inativo). |
| Linha "setor · serviço periodicidade" | **Junta** | Fica uma linha só: setor · serviço · forma jurídica · regime — só o que estiver preenchido. |
| Linha "Forma jurídica · Regime · Software · Responsável" | **Sai** | Mostra rótulos vazios ("Regime —", "Software" em branco). Forma e regime sobem para a linha de cima; software e responsável ficam em Dados. |
| Linha 👤 ✉ ☎ | **Fica**, mais limpa | Só os contactos preenchidos, clicáveis (e-mail e telefone), com ícones SVG em vez de emojis (regra do QA de 10/10). Hoje mostra "— — sem telefone". |
| Botão "Ver como o cliente" | **Fica** | Único sítio onde existe; só admin. |
| Botão "WhatsApp" | **Fica** | Passa a ser **o** sítio para escrever um WhatsApp (os outros três saem). |
| Botão "Mensagem" | **Sai** | Só abre o separador Mensagens, que está logo abaixo. |
| Botão "Adicionar tarefa" | **Fica** | Ação frequente; o cartão de tarefas do Resumo perde o seu próprio botão. |

### Separadores

| Separador | Veredicto | Porquê |
|---|---|---|
| Resumo | **Fica** | — |
| Obrigações fiscais | **Fica** | O coração da ficha. |
| Tarefas | **Sai** | Junta-se ao Resumo: o cartão "Tarefas" passa a mostrar todas as tarefas abertas do cliente (hoje mostra 5 e manda para o separador). |
| Documentos | **Fica** | — |
| Relatórios | ⏳ | Depende do ponto 6 (relatórios trimestrais visíveis ao cliente ou só PDF). Se ninguém os usa, sai. |
| Mensagens | **Fica** | Só a conversa; o cartão "WhatsApp com modelo" sai (botão do cabeçalho). |
| Dados do cliente | **Fica** | — |
| Notas internas | **Fica** | Só notas, horas e avença (ver abaixo). |
| Conta na plataforma | ⏳ **Sai** (proposta) | É a ficha antiga embutida: receita/saldo da conta, onboarding, navegador de pastas (repete Documentos) e histórico de consultoria. Ponto 6 já pergunta o que interessa. Proposta: o estado do onboarding passa para Dados → "Conta na plataforma"; o resto sai. |

**Resultado: 9 → 6 separadores** (7 se os Relatórios ficarem).

### Resumo

| Cartão | Veredicto | Porquê |
|---|---|---|
| Indicador "Próxima obrigação" | **Sai** | É a primeira linha do cartão Obrigações, logo abaixo. |
| Indicador "Último relatório" | **Sai** | Informação de consulta, não do dia a dia; está no separador Relatórios. |
| Obrigações fiscais (5 em aberto) | **Fica** | — |
| Checklist interna (da próxima obrigação) | **Sai** do Resumo | Repete a checklist do detalhe da obrigação. Ver ⏳ estados vs checklist. |
| Próximas tarefas | **Fica** → "Tarefas" | Todas as abertas do cliente (substitui o separador). |
| Comunicação rápida (WhatsApp) | **Sai** | Repete o botão WhatsApp do cabeçalho. |
| Últimas declarações entregues | **Sai** | É o filtro "Entregues" das Obrigações. |
| Etiquetas "Visível ao cliente" / "Área interna" em cada cartão | **Junta** | Fica só um cadeado nos cartões internos; os outros não levam nada. Menos ruído, a mesma informação. |

**Resultado:** o Resumo fica com dois cartões lado a lado — **Obrigações em aberto** e
**Tarefas** — que é o que a Lúcia precisa de ver ao abrir um cliente.

### Obrigações fiscais

| Elemento | Veredicto | Porquê |
|---|---|---|
| Cartão "Calendário fiscal personalizado" com os critérios em chips | **Sai** o cartão | Os critérios repetem Dados; o texto explicativo passa para um (i). Os botões "Gerar calendário" e "+ Obrigação" sobem para a barra do ano. |
| Ano fiscal + filtros (Em aberto / Em atraso / Entregues / Todas) | **Fica** | — |
| Contador "3 de 12" | **Sai** | Pouco útil. |
| Coluna "Período" | **Junta** | Vai por baixo do nome (como já faz em ecrãs estreitos). |
| Data-limite editável na linha | ⏳ | Editar a data diretamente na tabela é rápido mas fácil de mudar sem querer; proposta: editar no detalhe. |
| Estado (lista de 8) | ⏳ | Ver estados vs checklist. "Em atraso" não devia ser escolhível: já é calculado pela data. |
| Valor (tipo + montante) | **Fica** | Alimenta o WhatsApp de pagamento. |
| Comprovativo | **Fica** | — |
| Detalhe: Checklist | ⏳ | Ver abaixo. |
| Detalhe: "Processo" (setas) | **Sai** | Repete a checklist e o estado. |
| Detalhe: Tarefas ligadas, Notas, Criar tarefa, WhatsApp | **Fica** | O WhatsApp aqui faz sentido: já vem com a obrigação escolhida. |

### Documentos

| Elemento | Veredicto | Porquê |
|---|---|---|
| Receber documento (mês + tipo + ficheiros) | **Fica** | — |
| "Enviados pelo cliente" por classificar | **Fica** | — |
| Estado no ano (4 contadores que filtram) | **Fica** | — |
| Pedir os documentos deste mês | **Fica** | — |
| Alternar "Por mês / Por trimestre" | **Sai** | Segue a periodicidade do cliente (já é o valor por omissão). |

### Dados do cliente

| Elemento | Veredicto | Porquê |
|---|---|---|
| Identificação e contactos | **Fica** | — |
| Perfil fiscal e serviço | **Fica** | Decide o calendário. |
| Software contabilístico | ⏳ | Não é usado em lado nenhum da plataforma. Sai, se a Lúcia não precisar dele. |
| Gestão interna (responsável, horas incluídas, cliente desde, avença) | **Fica** | Passa a ser o único sítio de responsável e cliente desde. |
| Conta na plataforma | **Fica** | Recebe o estado do onboarding (se o separador sair). |
| Exportação RGPD e Eliminar ficha | **Junta** | Ficam num bloco "Mais ações", fechado por omissão — usam-se raramente e não devem estar à vista. |
| Campos que gravam a cada tecla | **Corrige** | Passam a gravar ao sair do campo (resto do R-B11). |

### Notas internas

| Elemento | Veredicto | Porquê |
|---|---|---|
| Notas, dúvidas e contactos | **Fica** | — |
| Cartão "Responsável e serviços" | **Sai** | Repete Dados e o cabeçalho. |
| Horas utilizadas | ⏳ | Existe também a página Horas. Proposta: fica aqui (registar horas no cliente é natural). |
| Controlo da avença | ⏳ | Repete o Financeiro. Proposta: fica só o estado (pago / por pagar) com ligação ao Financeiro. |

---

## 3. Estados vs checklist (⏳ a decisão mais importante)

Hoje uma obrigação tem **8 estados** (Por preparar, A aguardar documentos, Em preparação, Em
revisão, Entregue, Pago, Em atraso, Não aplicável) **e** uma checklist de **9 passos**
(Documentos recebidos, verificados, Contabilidade atualizada, Reconciliação, Declaração revista,
submetida, Comprovativo arquivado, Cliente informado, Pagamento confirmado) **e** um "processo"
em setas. As três dizem quase o mesmo e têm de ser mantidas à mão.

**Proposta:** ficar só com os estados, reduzidos a **5** — *A aguardar documentos · Em
preparação · Entregue · Pago · Não aplicável* — com "Em atraso" calculado pela data (como já
acontece por trás). A checklist sai, ou fica opcional no detalhe para quem a quiser.

---

## 4. Plano

**Sem decisão da Lúcia (pode avançar já):** cabeçalho; Resumo com dois cartões; separador
Tarefas no Resumo; WhatsApp só no cabeçalho e no detalhe da obrigação; Obrigações sem o cartão
de critérios, sem "Processo" nem contador, período por baixo do nome; Documentos sem a
alternância mês/trimestre; Notas sem o cartão repetido; Dados com "Mais ações" e gravação ao
sair do campo; cadeado em vez das etiquetas.

**Para a reunião com a Lúcia (pontos 6–7):** estados vs checklist; separador Relatórios;
separador Conta na plataforma; campo Software; data editável na tabela; horas e avença na ficha.
