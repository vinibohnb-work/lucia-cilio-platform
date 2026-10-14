# Formato do relatório de QA

Arquivo: `<projeto>/docs/auditorias/<AAAA-MM-DD>-interface.md`, com as capturas em
`<projeto>/docs/auditorias/qa-<AAAA-MM-DD>/`.

Diferença em relação aos outros dois relatórios: aqui **todo item tem passo a passo para
reproduzir**. Quem vai corrigir precisa ver o problema acontecer, e metade dos bugs de
interface só aparece numa combinação específica de tela, papel e tamanho de janela.

## Esqueleto

```markdown
# QA de interface — <Cliente/Plataforma>

Testado em <data> · ambiente: <local http://localhost:3000 / produção>
Papéis testados: <equipe (Admin), cliente final (Mentorado)>
Viewports: celular 390×844 · tablet 820×1180 · desktop 1440×900
Telas cobertas: <N de N> · não cobertas: <quais e por quê>
Capturas: `docs/auditorias/qa-<data>/`

## Veredito

**<Pronto para o cliente / Pronto depois dos bloqueadores / Não entregar ainda>**

<Duas ou três frases. Qual é a impressão de quem abre isso pela primeira vez, e o que mais
atrapalha. Diga também o que está bom — o Vinícius precisa saber o que não mexer.>

| | Itens |
|---|---|
| 🔴 Bloqueia | N |
| 🟠 Atrapalha | N |
| 🟡 Incomoda | N |
| 🔵 Oportunidade | N |

## 🔴 Bloqueia

- [ ] **#1 · <O que acontece, do ponto de vista de quem usa>**
  **Onde:** `/mentorados` · celular · papel: equipe
  **Reproduzir:**
  1. Entrar como Admin no celular (390×844)
  2. Abrir Mentorados → tocar em "Novo mentorado"
  3. Preencher só o nome e tocar em Salvar
  **Esperado:** aviso indicando o campo obrigatório que falta
  **Aconteceu:** a tela congela, sem mensagem; no console: `TypeError: cannot read 'trim'`
  **Evidência:** `qa-2026-08-11/mobile/mentorados.png`
  **Sugestão:** validar antes do envio e mostrar o erro no campo
  **Suspeita de origem:** `components/mentorados/MentoradoDrawer.tsx:120` _(opcional — só quando
  você viu de fato; palpite de código atrapalha mais do que ajuda)_

## 🟠 Atrapalha / 🟡 Incomoda / 🔵 Oportunidade
<mesma estrutura; itens 🔵 podem dispensar o passo a passo>

## Por tela

| Tela | Celular | Tablet | Desktop | Observação |
|---|---|---|---|---|
| /login | 🟠 | ok | ok | fonte 14px nos campos causa zoom no iPhone |
| /mentorados | 🔴 | 🟡 | ok | tabela empurra a página no celular |
| /portal | ok | ok | ok | — |

<Esta tabela é o que o Vinícius olha primeiro: mostra onde está concentrado o problema e
prova que a cobertura foi completa.>

## Não reproduzível

<O que você viu uma vez e não conseguiu repetir. Com o que apareceu na tela e no console.
Vale registrar — não vale virar tarefa.>

## Não testado

<Honestidade explícita: fluxo que exige dado que não existe no ambiente, integração de
pagamento, envio de e-mail, tela que depende de um papel sem usuário de teste.>
```

## Regras de escrita

**O título é o sintoma, na língua do usuário.** "Não consigo salvar um mentorado novo pelo
celular" e não "estado não sincroniza no submit handler". Quem lê tem que reconhecer o
problema sem abrir o código.

**Passo a passo numerado, começando do login.** Sem "faça o de sempre". Inclua papel e
viewport: o mesmo botão funciona no desktop e falha no celular, e um relatório sem essa
informação faz o desenvolvedor concluir que não existe bug.

**Esperado × aconteceu, em duas linhas.** Sem essa separação, discute-se se é bug ou
decisão de projeto — e a discussão volta toda vez.

**Uma captura por item quando ela mostra o problema.** Caminho relativo à pasta do relatório.
Para problema visual, a captura substitui três parágrafos.

**Não invente causa.** Você é QA nesta skill. Console e requisição falhando entram como
evidência; hipótese sobre qual linha causou entra só se você tiver visto, e sempre marcada
como suspeita.

**Oportunidade não é reclamação.** O item 🔵 diz o que o usuário ganharia, não o que você
faria diferente por gosto: "a equipe filtra por status toda vez que abre a tela — salvar o
último filtro economiza dois cliques por acesso".

## Reexecução

```markdown
## Comparação com <data anterior>

Resolvidos: 9 · Persistentes: 2 · Regrediram: 1 · Novos: 5

- ✅ #2, #4, #5 … (capturas de antes em `qa-<data anterior>/`)
- ⏳ #1 (bloqueador, aberto desde <data>)
- ⚠️ #7 voltou depois da mudança no layout
```

Itens persistentes mantêm o número original. Um bloqueador que atravessa duas auditorias vai
para o resumo, nomeado — ou ele não era bloqueador, ou tem algo travando a correção.
