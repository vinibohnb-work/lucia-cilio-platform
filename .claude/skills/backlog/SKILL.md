---
name: backlog
description: Lê e atualiza o backlog de desenvolvimento do cliente no sistema interno da Scalasys (Clientes Ativos → cliente → Backlog), com o token pessoal de quem está usando. Use quando a pessoa pedir "/backlog", perguntar o que tem para fazer no projeto, escolher a próxima tarefa, terminar um item (marcar como feito e registrar o que foi entregue), anotar algo que surgiu no desenvolvimento, ou triar as ações das reuniões. Substitui o antigo BACKLOG.md e a skill /capturar-backlog.
---

# Backlog do cliente (sistema interno Scalasys)

O backlog de cada cliente vive no sistema interno, e não mais num `BACKLOG.md`. O Vinícius
e a Raquel operam pelo painel, e o Claude Code de cada um opera por esta skill. O que um
grava, o outro vê na hora.

## Como chamar

```bash
node .claude/skills/backlog/scripts/backlog.mjs <ação> [args]
```

- **O cliente** vem da linha `Sistema interno: cliente \`<id>\`` do `CLAUDE.md` do projeto.
  Fora de um projeto, use `--cliente <id ou nome>`. Para ver a lista, use a ação `clientes`.
- **O token pessoal** fica em `~/.scalasys/token` ou na variável `SCALASYS_TOKEN`.
  - Sem token, o script para com exit 2. Explique como gerar: no painel, Clientes Ativos →
    qualquer cliente → Backlog → **Conectar o Claude Code**.
  - **Nunca** leia, imprima ou copie o token para o chat ou para um repositório.
- **O que fica gravado:** tudo sai no nome de quem gerou o token.

| Ação | Uso |
|---|---|
| `listar` | Abertos, diretrizes e o resto, na ordem do painel (o primeiro de cada grupo é o mais prioritário). `--estado aberto` para só os abertos. |
| `criar --titulo "…" [--detalhe "…"] [--grupo "…"] [--tipo dev\|validacao\|diretriz] [--responsavel "…"]` | Algo que surgiu no desenvolvimento. |
| `concluir <id> --entrega "…"` | Item terminado, com uma frase do que foi entregue (commit, tela, migração). |
| `atualizar <id> --campo valor` | Corrigir título ou detalhe, mudar o grupo ou o responsável, descartar (`--estado descartado`). |
| `pendentes` | Ações das reuniões dos últimos 60 dias que ninguém decidiu ainda. |
| `decidir <meeting_id> <item> <dev\|validacao\|comercial\|tratada> [--titulo "…"]` | Dar destino a uma ação de reunião. |

Acrescente `--json` para receber os dados crus.

## Como trabalhar

1. **No começo de uma tarefa,** rode `listar --estado aberto` e mostre os primeiros itens.
   - Se a pessoa não disse o que fazer, sugira o de cima, considerando também a sprint da
     semana (meta + 3 entregas, no painel).
   - Ao pegar um item sem responsável, ponha o nome de quem está trabalhando
     (`atualizar <id> --responsavel "<nome>"`).
2. **Ao terminar um item,** só depois de verificado (build passando, tela testada), rode
   `concluir <id> --entrega "<o que foi entregue>"`.
   - Nunca marque como feito algo que não foi feito.
   - Item feito em parte continua aberto. Atualize o detalhe dizendo o que falta.
3. **Algo novo que apareceu no caminho** (bug, débito técnico, pedido do cliente): `criar`,
   no grupo certo. Use os grupos que já existem; veja-os no `listar`.
4. **Triagem das reuniões:** rode `pendentes` e proponha um destino para cada ação.
   - `dev`: construir ou alterar software.
   - `validacao`: investigação técnica, confirmar algo.
   - `comercial`: enviar, cobrar, marcar, negociar. Não é desenvolvimento.
   - `tratada`: já está no backlog com outras palavras, ou já foi feita.

   **Mostre a proposta e espere a confirmação da pessoa antes de rodar os `decidir`.**
   Ajuste o título quando a ação vier vaga.
5. **Descartar ou excluir é decisão humana:** pergunte antes. Descartar
   (`--estado descartado`) mantém o registro. Excluir de vez só pelo painel.

## Notas

- Diretrizes (`tipo diretriz`) são regras de produto que guiam a priorização. Leia antes de
  propor uma solução; não são tarefas para concluir.
- Os itens importados dos antigos `BACKLOG.md` têm origem "importado". O `BACKLOG.md` que
  ainda existir na pasta é arquivo morto: não edite, não leia como fonte.
- A Edge Function é `backlog-api` (projeto interno). Erro 401 = token inválido ou revogado.
