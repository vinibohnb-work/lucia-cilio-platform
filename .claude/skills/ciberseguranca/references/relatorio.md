# Formato do relatório de segurança

Arquivo: `<projeto>/docs/auditorias/<AAAA-MM-DD>-seguranca.md`.

Este documento tem dois leitores: o Vinícius decidindo o que corrigir antes de publicar, e o
próprio Vinícius daqui a um ano, provando que houve diligência quando o cliente perguntar.
Ele precisa dizer o que foi verificado — inclusive o que passou.

**Nenhum valor de segredo neste arquivo.** Tipo, local e ação. Nunca a chave.

## Esqueleto

```markdown
# Auditoria de segurança — <Cliente/Plataforma>

Auditado em <data> · escopo: <código, banco, painéis> · fora do escopo: <o que não foi visto>
Ambiente verificado: <dev / produção> · projeto Supabase: <ref> (<região>)

## Veredito

**<Pode publicar / Publicar depois de resolver #1 e #2 / Não publicar>**

<Duas ou três frases. Qual é o risco dominante e por quê.>

| Severidade | Itens |
|---|---|
| 🔴 Crítico | N |
| 🟠 Alto | N |
| 🟡 Médio | N |
| 🔵 Baixo | N |

## ⚡ Ação imediata

<Só existe se houver chave válida vazada ou dado exposto agora. Passo a passo numerado,
na ordem de execução. Se não houver, escreva "Nada exige ação hoje." e siga.>

## 🔴 Crítico

- [ ] **#1 · <O que está exposto>** — `P`
  **Onde:** `supabase/migrations/0001_schema.sql:212` · tabela `pagamentos`
  **Risco:** <quem consegue o quê, e como — concreto>
  **Como confirmei:** <a consulta, o trecho, ou "a confirmar: <teste>">
  **Correção:** <a ação, com o SQL ou o trecho quando for curto>

## 🟠 Alto / 🟡 Médio / 🔵 Baixo
<mesma estrutura>

## Matriz de isolamento por tabela

| Tabela | Dado sensível | RLS | Cliente final lê o alheio? | Escreve? | Veredito |
|---|---|---|---|---|---|
| mentorados | CPF, telefone | on | não | não | ok |
| pagamentos | valores | on | **a testar** | não | a confirmar |

<É a tabela que responde "os dados estão protegidos?". Preencha mesmo com "a testar" —
a lacuna visível vale mais que a linha ausente.>

## LGPD

| Item | Situação | Ação | De quem |
|---|---|---|---|
| Política de privacidade publicada | lacuna | publicar antes do lançamento | Scalasys |
| Base legal para marketing | não aplicável | — | — |

## Verificado e conforme

<Lista curta do que foi checado e está certo: RLS ativa nas 8 tabelas, cadastro fechado,
middleware validando com getUser, .env fora do Git. Esta seção é o que transforma o
documento em evidência — sem ela, "não achei nada" é indistinguível de "não olhei".>

## Não verificado

<Honestidade explícita: o que ficou de fora e por quê — sem acesso ao painel, ambiente de
produção não testado, integração X não auditada.>
```

## Regras de escrita

**Risco é uma frase com sujeito.** "Qualquer usuário logado consegue baixar a tabela de
pagamentos inteira com uma requisição" — não "possível exposição de dados sensíveis". Quem
consegue, o quê, com que esforço.

**Separe o confirmado do suposto.** Todo item traz *Como confirmei*. Se for teste que você
não executou (porque não se testa ataque em produção), escreva o teste e marque **a
confirmar**. Nunca apresente hipótese como fato: em segurança, um alarme falso corrói a
atenção que o alarme verdadeiro vai precisar.

**Correção específica.** "Aplicar RLS" não é ação; a policy escrita é. Quando couber em 6
linhas de SQL, escreva o SQL — e diga que vai numa migration nova, nunca editando uma já
aplicada.

**Severidade justificada quando for 🔴.** Uma linha dizendo por que é agora e não depois.

**Numeração contínua** entre as seções, para citar item em conversa e comparar auditorias.
