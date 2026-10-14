# Formato do relatório

Arquivo: `<projeto>/docs/auditorias/<AAAA-MM-DD>-codigo.md`.

O documento é uma **lista de trabalho**, não um ensaio. Quem lê está decidindo o que entra na
próxima sprint, com o repositório aberto ao lado. Isso impõe: caixa de seleção em todo item,
caminho clicável, e uma ação por item — se um item exige duas decisões separadas, são dois
itens.

## Esqueleto

```markdown
# Revisão de código — <Cliente/Plataforma>

Auditado em <data> · escopo: <o que foi olhado> · fora do escopo: <o que não foi>
Stack: <detectado> · <N> arquivos de origem, <N> linhas

## Resumo

<Duas ou três frases: o estado geral, o padrão que mais se repete, e por onde começar.
Honesto nos dois sentidos — se o código está bom, diga; se a base está frágil, diga também.>

| Severidade | Itens |
|---|---|
| 🔴 Crítico | N |
| 🟠 Alto | N |
| 🟡 Médio | N |
| 🔵 Baixo | N |

**Se der para fazer só três coisas:** #1, #4 e #9 — <uma linha do porquê>.

## 🔴 Crítico

- [ ] **#1 · <Título afirmativo do problema>** — `M`
  **Onde:** [`app/(app)/financeiro/page.tsx:88`](app/(app)/financeiro/page.tsx#L88)
  **O que acontece:** <o efeito concreto, com número quando houver>
  **Por quê:** <a causa, em uma frase>
  **Correção sugerida:** <a ação, específica o bastante para virar tarefa>

## 🟠 Alto
...

## 🟡 Médio
...

## 🔵 Baixo
...

## Suspeitas a verificar

Itens que não consegui confirmar sozinho — cada um com a pergunta que resolve.

- [ ] `lib/store.ts:210` — o `update` manda o objeto inteiro; **dois usuários editam o mesmo
      mentorado ao mesmo tempo na prática?** Se sim, vira 🟠.

## O que está bem resolvido

<Três a cinco linhas. Não é elogio de cortesia: registra as decisões que devem ser mantidas
e repetidas nos próximos projetos — e evita que alguém "arrume" o que está certo.>

## Encaminhado para outras auditorias

- Segurança: <uma linha> → `/ciberseguranca`
- Interface: <uma linha> → `/qa-interface`
```

## Regras de escrita dos itens

**Título afirma o problema, não a solução.** "Listagem de mentorados sem paginação" e não
"Adicionar paginação" — porque a solução pode ser outra (filtro obrigatório, busca no servidor)
e a decisão é do Vinícius.

**O efeito vem com número sempre que possível.** "Com 300 mentorados são 301 requisições
(~40s de carregamento)" derruba qualquer discussão; "pode ficar lento" convida a adiar
para sempre.

**Esforço:** `P` (≤ 1h) · `M` (≤ meio dia) · `G` (> meio dia). Estimativa de quem vai fazer,
já contando o teste.

**Numeração contínua** (#1, #2, ...) atravessando as seções: serve para citar item em conversa
e para a próxima auditoria dizer "#7 continua aberto".

**Um item repetido em 12 arquivos é um item**, com os 12 caminhos listados — não 12 itens. O
oposto (agrupar coisas diferentes sob "diversos ajustes") também está errado.

**Trecho de código só quando o texto não basta**: até 6 linhas, e o "antes/depois" só se a
correção não for óbvia pela descrição.

## Reexecução

Quando existir auditoria anterior, o resumo começa por ela:

```markdown
## Comparação com <data anterior>

Resolvidos: 8 · Persistentes: 3 · Regrediram: 1 · Novos: 6

- ✅ #2, #3, #5, #7, #8, #10, #11, #14
- ⏳ #1 (crítico, aberto há 2 auditorias), #6, #12
- ⚠️ #9 voltou — <o que aconteceu>
```

Itens persistentes mantêm o número da auditoria original. Um crítico que sobrevive a duas
auditorias merece uma frase explícita no resumo: ou ele não é crítico e a classificação estava
errada, ou existe um bloqueio que precisa ser nomeado.
