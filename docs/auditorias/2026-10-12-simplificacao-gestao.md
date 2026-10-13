# Simplificação — Gestão inteira (item 13-D)

**12/10/2026.** Revisão campo a campo e botão a botão de todos os ecrãs da Gestão, depois da
ficha do cliente (`2026-10-12-simplificacao-ficha-cliente.md`). Mesmo critério: o que ajuda a
trabalhar fica; o que é decorativo, pouco usado ou repetido sai ou passa para um sítio só — sem
perder dados.

**Detalhe ecrã a ecrã** (tabelas "Elemento · Veredicto · Porquê"):

| Parte | Ecrãs | Ficheiro |
|---|---|---|
| 1 · Dia a dia | Início, Clientes, Relatórios, Mensagens, Agenda, Tarefas, Horas | [`simplificacao-gestao/1-dia-a-dia.md`](simplificacao-gestao/1-dia-a-dia.md) |
| 2 · Comercial e administração | Prospeção (CRM), Diagnósticos, Marketing, Financeiro, Acessos, Conta na plataforma | [`simplificacao-gestao/2-comercial-e-administracao.md`](simplificacao-gestao/2-comercial-e-administracao.md) |
| 3 · Menu e serviços | Menu lateral, Consultorias (lista, ficha, relatório), Consultorias ESG (lista, caso, apresentação) | [`simplificacao-gestao/3-menu-e-servicos.md`](simplificacao-gestao/3-menu-e-servicos.md) |

Legenda: **Fica** · **Sai** · **Junta** · **Muda** · **⏳** decisão da Lúcia

---

## 1. Corrigir já (erros, não gosto)

Encontrados durante a revisão; confirmados no código.

| # | Problema | Onde | Efeito |
|---|---|---|---|
| E1 | **As Notas internas da consultoria vão para o PDF do banco**, com o título "Nota interna", e para a IA | `lib/relatorioModelo.js:273`, `api/consultoria-relatorio.js:235` | Texto interno da Lúcia num documento entregue a terceiros. ⏳ sai do PDF ou muda de nome — decidir antes do próximo PDF. |
| E2 | **"Criar contrato" no CRM** grava a avença sem a ligar à ficha | `pages/gestao/Crm.jsx:217` | A avença não aparece na ficha do cliente. |
| E3 | **Financeiro liga o contrato à ficha pelo nome** escrito à mão | `pages/gestao/Financeiro.jsx:113` | Um nome escrito de outra forma deixa a avença fora da ficha, sem aviso. |
| E4 | **No telemóvel não se muda a etapa de um lead** (só arrastar) | `Crm.jsx:366` | O CRM não funciona em ecrã tátil. |
| E5 | **Relatório da consultoria perde a última edição** ao sair da página e diz "Guardado" mesmo quando falha | `ConsultoriaRelatorio.jsx:80,110` | Perda de texto. |
| E6 | **"Fechar" no relatório trimestral** fecha sem gravar nem avisar | `portal/partes/Relatorio.jsx:107` | Perdem-se os números escritos. |
| E7 | **Tarefa nova fica atribuída à 1.ª pessoa da equipa**, não a quem a cria | `portal/partes/Tarefas.jsx:17` | Tarefas atribuídas à pessoa errada. |
| E8 | **Agenda abre um separador que já não existe** (`…/tarefas`) e não deixa editar a tarefa | `portal/paginas/Agenda.jsx:49` | Clique leva ao sítio errado. |
| E9 | **Estados escritos à mão** nas obrigações da página Tarefas ("Em revisão" aparece como "Por preparar") | `portal/paginas/Tarefas.jsx:100` | Informação errada. |
| E10 | **"Criar acesso" no CRM** mostra a palavra-passe num `alert` do browser, sem mensagem de boas-vindas nem ligação à ficha | `Crm.jsx:256` | Fluxo paralelo e pior que o de Acessos. |
| E11 | **"Marcar como enviado"** no relatório trimestral publica-o ao cliente (desde a 040) sem o dizer | `partes/Relatorio.jsx:106` | O botão não avisa que o cliente passa a ver. |
| E12 | **Cortes sem aviso no Início** (8 tarefas, 6 obrigações, 4 clientes) | `InicioEquipa.jsx:30,89,101` | Uma obrigação em atraso pode não aparecer em lado nenhum da página. |

---

## 2. O que mais se repete

| Informação | Hoje aparece em | Fica em |
|---|---|---|
| Tarefas em atraso | Início (indicador + cartão), Tarefas (destaque + filtro + chip), Agenda, lista de clientes, ficha, contador do menu | Início, Tarefas/Agenda, coluna Atenção |
| Obrigações em atraso / 7 dias | Início (indicador + cartão), Tarefas (destaque + cartão), Agenda, lista, ficha | Início, Agenda, lista, ficha |
| Documentos em falta | Início (indicador + cartão), Tarefas (destaque + painel), lista, ficha | Início (resumo), ficha (detalhe), Atenção |
| Avença e pagamentos | Financeiro, ficha → Notas internas (também confirma pagamentos), Dados, CRM | Confirmar só no Financeiro; a ficha mostra o estado ⏳ |
| Registar horas | Página Horas e Notas internas da ficha — **dois formulários com regras diferentes** | Só em Horas; a ficha mostra "X h de Y h" ⏳ |
| Criar conta de cliente | Acessos, CRM "Criar acesso" | Um fluxo só (Acessos, com boas-vindas); a seguir, a partir da ficha (item 12) |
| "Já entrou na plataforma?" | Acessos, Dados, Conta na plataforma, onboarding | Acessos (lista) e Dados (ficha) |
| A mesma pessoa/empresa | ficha, conta, lead, diagnóstico, consultoria, caso ESG — sem ligação | Item 12 (uma ficha por cliente) |
| "Consultoria" | Consultorias (IHK), "Consultoria & Histórico" (notas que o cliente lê), Consultorias ESG | Mudar o nome do segundo ⏳ |
| "Modo apresentação" | Consultoria (esconde o interno) e ESG (abre outra página) | ESG passa a "Apresentar ao cliente" |

---

## 3. Menu

**Hoje — 14 itens em 4 grupos**
```
Início
CLIENTES   Clientes · Relatórios · Mensagens
GESTÃO     Agenda · Tarefas · Horas · Prospeção (CRM) · Marketing · Financeiro · Gestão de Acessos
SERVIÇOS   Consultorias · Consultorias ESG · Diagnósticos
```

**Proposta — 10 a 12 itens, por ordem de uso**
```
Início · Clientes · Agenda (Lista | Mês) · Mensagens · Horas
         [+ Relatórios trimestrais, se o ponto 6 os mantiver]
COMERCIAL  Prospeção (Quadro | Formulário) · Marketing
SERVIÇOS   Consultorias · Consultorias ESG         [⏳ ou um item com dois separadores]
ESCRITÓRIO Financeiro · Acessos
```
- **Agenda + Tarefas → uma entrada** com duas vistas (Lista e Mês): os mesmos dados, filtros e
  botão. ⏳ o documento original pedia as duas.
- **Diagnósticos → dentro da Prospeção** (separador "Formulário"): é a caixa de entrada que
  alimenta o CRM, com os mesmos papéis. Sai da secção Serviços em qualquer caso.
- Saem os rótulos repetidos ("Clientes" sobre Clientes, "Gestão" dentro da Gestão); um ícone
  diferente por item (hoje três usam o mesmo); Acessos vai para o fim; o contador do menu passa
  de Tarefas (repete o Início) para Mensagens.
- Rodapé: saem as iniciais. ⏳ Demonstração (usa?), bandeira EN (alguém usa?), modo noturno (16-B).

---

## 4. Ecrã a ecrã — o essencial

**Início** — saem os 5 indicadores (repetem os cartões); ficam os cartões Tarefas e Pendências,
com "+N" quando cortam e tarefas que se podem concluir/editar; horas num botão discreto.
**Clientes** — sem iniciais nem forma jurídica; País em chip; Estado só quando não é "Ativo";
inativos escondidos por omissão; um único formato de tabela; cliente novo sem Setor nem Estado e
com os campos fiscais só para Contabilidade. ⏳ colunas Setor e Responsável.
**Relatórios** ⏳ ponto 6 — se ficarem: sem software, sem a coluna "a decorrer" nem "último
resultado"; botão diz que publica ao cliente; avisa ao fechar.
**Mensagens** — sem avatares; inativos fora; clientes sem conversa agrupados no fim; ícones.
**Agenda / Tarefas** — vistas Mês e Dia (sai Semana); fica só o filtro Responsável; pílulas
*Hoje · 7 dias · Em atraso · Todas* em vez dos destaques e do filtro Prazo; saem o painel de
documentos e as obrigações da página Tarefas. ⏳ estado "Em curso"; "Lembrete automático" (não
envia nada).
**Horas** — indicadores numa linha; "Quem" só na vista de equipa; validação alinhada com o texto.
⏳ registar horas por outra pessoa; horas na ficha.
**Prospeção (CRM)** — um só controlo de follow-up; sem filtro de temperatura nem rótulo
"Filtros"; cartão sem origem nem notas; "Registar contacto" absorve "+1 tentativa"; campo Etapa no
modal (resolve o telemóvel) e saem os 8 "+"; eliminar dentro do modal; "Avença mensal prevista".
⏳ coluna Mapeado (8 colunas), filtro Origem.
**Diagnósticos** — "Copiar ligação"; respostas com rótulos legíveis ("País", não "pais:").
**Marketing** — sem a linha de contagens; nota do feed num (i); confirmação ao apagar anotação.
⏳ (Letícia) 5 estados das publicações; Anotações → Ideias e Tarefas.
**Financeiro** — 4 → 2 indicadores (Recebido, Por receber); mês junto aos recebimentos e por
extenso; Cliente escolhido da lista de fichas; botão "Ativo/Inativo" que diz a verdade; eliminar
dentro da edição.
**Acessos** — sai o campo Serviço (não é usado em lado nenhum); País e Plataforma só para
clientes; palavra-passe mostrada uma vez (na mensagem de boas-vindas); sem coluna "Criado"; equipa
e clientes em duas secções. ⏳ verificação em dois passos obrigatória.
**Conta na plataforma** (ficha antiga) ⏳ — "Visualização completa" repete "Ver como o cliente";
obrigações pendentes contam por um campo antigo (podem não bater). **Antes de tirar o separador:**
é o único sítio onde se escrevem as notas que o cliente lê em "Consultoria"; verificar que o
separador Documentos mostra tudo o que está na pasta.
**Consultorias** — criar só com Nome e Empresa (o resto preenche-se na ficha); Estado só no filtro
"Todas"; progresso "14/40" sem "Bloco N"; bloco atual calculado (hoje clicar para espreitar grava);
Enquadramento fechado com resumo depois de preenchido; sem contadores repetidos nem cartão 🚧
morto; SWOT acrescenta só com Enter; Recursos clicáveis; "Telefone" em vez de "Contacto". ⏳ Tipo
(Gratuita / Implementação) — não muda nada no relatório e não se pode editar.
**Consultorias ESG** — criar só com Empresa e Pessoa; um controlo "Cliente vê: Sim/Não" em vez de
dois; nome da empresa só na tira (sai do menu); "Apresentar ao cliente ↗". ⏳ Empresa
obrigatória; Apresentação vs Relatórios ESG (qual vai ao cliente); nomes das fases (R-B10).
**Apresentação ESG** — força o tema claro ao imprimir; % nos projetos; siglas da matriz a ≥ 11 px.

**Em todos:** emojis passam a ícones (regra do QA de 10/10); cores fixas passam a tokens do tema
(hoje partem o modo noturno e a V2); textos técnicos ("migração 029") saem; código morto
(subtítulos que já não aparecem desde 10/10) sai.

---

## 5. Correções às auditorias anteriores

- **Campo Software**: a auditoria da ficha diz que não é usado; aparece no **rodapé do PDF do
  relatório trimestral** (`partes/Relatorio.jsx:48`). Se sair, o rodapé muda.
- **Horas na ficha**: a auditoria da ficha propunha que ficassem; esta propõe registar só em
  Horas (dois formulários geram dados diferentes). ⏳
- **Tirar o separador "Conta na plataforma"** tem duas dependências (notas da "Consultoria" do
  cliente e ficheiros da pasta) — ver acima.

---

## 6. Plano

**Fase A — corrigir os erros E2–E12** (E1 espera pela resposta da Lúcia, mas pode sair já do PDF
como medida prudente, se o Vinícius aprovar).

**Fase B — simplificação sem decisão** (o que está marcado "Fica/Sai/Junta/Muda" sem ⏳ nos três
ficheiros): Início, Clientes, Mensagens, Agenda/Tarefas (sem juntar as entradas), Horas, CRM,
Diagnósticos, Marketing, Financeiro, Acessos, Consultorias, ESG; ícones e tokens; código morto.

**Fase C — com a Lúcia** (juntar à reunião dos pontos 6–10):
1. Notas internas no PDF do banco (E1).
2. Juntar Agenda e Tarefas; Diagnósticos dentro da Prospeção; Consultorias + ESG num item.
3. Relatórios trimestrais: ficam? que campos? comparação com o trimestre anterior ou ano a ano?
4. Tarefas: estado "Em curso"; "Lembrete automático".
5. Lista de clientes: colunas Setor e Responsável.
6. Horas: só na página Horas? quem regista por outra pessoa?
7. Pagamentos confirmados só no Financeiro; serviço próprio no contrato.
8. CRM: coluna Mapeado; filtro Origem.
9. Marketing (Letícia): 5 estados; Anotações.
10. Acessos: Plataforma Lite; verificação em dois passos.
11. Conta na plataforma: o que se salva (receita/saldo, ESG, limite DE, notas "Consultoria").
12. Consultoria: Tipo; ESG: Empresa obrigatória, que PDF vai ao cliente, nomes das fases.
13. Rodapé: Demonstração, EN, modo noturno.
