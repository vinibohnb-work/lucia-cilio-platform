---
name: revisao-codigo
description: Auditoria técnica completa de uma plataforma Scalasys — redundâncias, performance, sobrecarga de processamento, erros de regra de negócio, robustez e manutenibilidade — com saída em checklist priorizado para revisão humana. Use quando o usuário pedir revisão de código, code review, auditoria técnica, análise de performance, "olha o código do projeto X", "o que dá pra melhorar nesse sistema", ou antes de entregar/implantar uma plataforma para o cliente. Não é revisão de diff/PR — é varredura do projeto inteiro (ou de um módulo).
---

# Revisão de código

Esta skill existe para o momento anterior à implantação: a plataforma funciona na sua
máquina e você precisa saber, sem se enganar, o que vai doer quando o cliente usar. O
resultado é um **checklist priorizado** que o Vinícius revisa item por item e decide o que
entra na sprint — não um refactor automático. Você não corrige nada aqui, a menos que ele
peça depois.

## A regra que define a qualidade do relatório: evidência antes de opinião

Um relatório com 60 itens dos quais 20 são invenção é pior que um com 12 itens verdadeiros,
porque destrói a confiança nos 40 restantes. Então:

- **Todo item aponta para `arquivo:linha`** e você leu aquele trecho antes de escrever. Sinal
  de script não é achado — é pista para investigar.
- **Todo item descreve o efeito concreto**: "quando o cliente tiver 300 mentorados, esta tela
  faz 301 requisições e leva ~8s", não "poderia ser otimizado".
- **Confiança explícita.** Se você não conseguiu confirmar, o item vai para a seção
  *Suspeitas a verificar*, não para o checklist principal.
- **Preferência de estilo não é achado.** Aspas, nomes, ordem de imports, "eu usaria zod":
  fora. O que entra é o que quebra, o que custa dinheiro, ou o que vai custar caro pra mudar
  depois.
- **Código gerado não conta.** `node_modules`, `.next`, `dist`, `.vercel`, `out`, migrations
  já aplicadas em produção (essas viram item de nova migration, nunca "edite o SQL antigo").

## Fluxo

### 1. Delimite o escopo e o alvo

Padrão: o projeto inteiro, a partir da pasta que o usuário indicou (ou a pasta atual). Se ele
pedir "só o financeiro" ou "só o que mudei", restrinja — e diga no relatório o que ficou de
fora, porque um checklist parcial lido como completo é uma armadilha.

Antes de qualquer coisa, veja se já existe auditoria anterior em `docs/auditorias/`. Se
existir, o trabalho é **comparativo** (ver "Reexecução" no fim).

### 2. Rode o mapa

```bash
node .claude/skills/revisao-codigo/scripts/mapa.mjs "<pasta do projeto>"
```

Ele devolve, em segundos, o que levaria muitas leituras para montar: rotas, componentes,
tamanho de cada arquivo, tabelas e índices das migrations, blocos de código duplicados entre
arquivos, e uma lista de **sinais** (`select('*')`, erro do Supabase descartado, `await` dentro
de laço, string de papel espalhada, `console.log`, arquivo gigante, coluna filtrada sem índice).

Use `--json <caminho>` se quiser o resultado estruturado para cruzar depois.

Os sinais são grep com contexto, então erram: `select('*')` numa tabela de 5 colunas com 20
linhas é irrelevante. Cabe a você separar.

### 3. Leia o que decide a arquitetura

Antes dos passes, leia de verdade — não só grep — estes cinco:

1. **A migration de schema** (`supabase/migrations/0001_*.sql`): tabelas, chaves, índices e
   políticas de RLS. Metade dos problemas de performance e todos os de regra moram aqui.
2. **A camada de dados** (`lib/store.ts`, `lib/supabase/*`, hooks de fetch): é onde as queries
   nascem e onde a redundância se acumula.
3. **O `middleware.ts`** e os `layout.tsx`: onde a sessão e o roteamento por papel acontecem.
4. **O maior componente da lista** do mapa: geralmente concentra os problemas de re-render e
   de regra misturada com apresentação.
5. **O `package.json`**: versões, scripts, dependências que entraram e não são usadas.

### 4. Passes

Leia **`references/checklist.md`** — é o catálogo completo, com o "como detectar" e o "por que
importa" de cada verificação. São seis eixos, nesta ordem (a ordem importa: os dois primeiros
mudam o entendimento do resto):

1. **Corretude e regra de negócio** — o que produz dado errado.
2. **Redundância** — o mesmo trabalho feito duas vezes, no código e no runtime.
3. **Performance e carga** — o que degrada quando o volume real chegar.
4. **Robustez** — o que acontece no caminho infeliz (erro, vazio, rede lenta, duplo clique).
5. **Manutenibilidade** — o que vai custar caro na próxima alteração.
6. **Dependências e build** — o que envelhece ou pesa sem necessidade.

### 5. Confirme cada achado antes de escrever

Para cada candidato: abra o arquivo, leia o entorno, e responda três perguntas. *Isso é
verdade neste código?* *Qual o efeito com o volume real do cliente?* *Existe algo em outro
lugar que já resolve isso?* — essa terceira derruba muito falso positivo: a validação que
"falta" no formulário costuma estar num `constraint` do Postgres, e o `select('*')` costuma
estar protegido por RLS que corta as colunas... ou não, e aí virou achado de verdade.

Quando der para medir, meça: quantas requisições uma tela dispara, quantas linhas tem o
arquivo, quanto tempo leva o `npm run build`. Número convence e sobrevive à discussão.

### 6. Escreva o relatório

Formato e exemplo em **`references/relatorio.md`**. Salve em
`<projeto>/docs/auditorias/<AAAA-MM-DD>-codigo.md`.

### 7. Feche no chat — e entregue o arquivo

Três a cinco linhas: quantos itens por severidade e os três piores com uma frase cada. Em
seguida, **envie o próprio `.md` do relatório com SendUserFile** (display `render`) — o
caminho em `docs/auditorias/` fica no texto como referência, mas a entrega é o arquivo. O
relatório é para trabalhar; o resumo é para decidir se vale abrir agora.

## Como priorizar

A severidade responde "o que acontece se ficar como está", nunca "quão feio é":

| | Critério |
|---|---|
| 🔴 **Crítico** | Produz dado errado, perde dado, ou derruba a tela para o usuário final |
| 🟠 **Alto** | Vai quebrar ou ficar inutilizável no volume real do cliente; ou regra de negócio contornável |
| 🟡 **Médio** | Atrapalha hoje de forma tolerável, ou multiplica o custo da próxima alteração |
| 🔵 **Baixo** | Vale fazer quando encostar no arquivo |

Cruze com esforço (P ≤ 1h, M ≤ meio dia, G > meio dia). O que orienta a sprint é a combinação:
🟠+P antes de 🔴+G, quase sempre — e diga isso na abertura do relatório, em uma linha.

## Reexecução

Quando já houver auditoria anterior, leia-a primeiro e classifique cada item antigo como
**resolvido**, **persistente** ou **regrediu**, antes de listar os novos. O valor de auditar
duas vezes está justamente nessa comparação: mostra se a dívida está crescendo ou encolhendo.
Comece o relatório novo com essa contagem.

## Fronteira com as outras duas skills

Se aparecer chave exposta, RLS ausente, checagem de papel só no client ou PII em log,
**registre em uma linha e aponte para a `/ciberseguranca`** — não desenvolva ali. O mesmo
para fonte pequena, tela que não abre no celular e texto cortado: é `/qa-interface`. Três
relatórios separados são revisáveis; um relatório com tudo não é.
