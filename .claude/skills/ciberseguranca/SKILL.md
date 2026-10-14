---
name: ciberseguranca
description: Auditoria de segurança de uma plataforma Scalasys antes da implantação — chaves e segredos expostos, RLS e permissões no Supabase, autorização por papel, vazamento de dados e PII, sessão e autenticação, cabeçalhos e LGPD. Saída em checklist de pontos de atenção, riscos iminentes e correções. Use quando o usuário pedir revisão/auditoria de segurança, análise de risco, "tem chave vazando?", "os dados do cliente estão protegidos?", verificação de RLS ou de LGPD, ou antes de colocar uma plataforma no ar para o cliente.
---

# Auditoria de cibersegurança

Auditoria defensiva do próprio código, antes de o cliente entrar. O que está em jogo nas
plataformas Scalasys é específico: cada projeto guarda a carteira inteira de um cliente —
mentorados, pacientes, faturamento — num Supabase cuja **anon key roda no navegador de todo
mundo**. Se a RLS falhar em uma tabela, qualquer usuário logado (ou, dependendo da policy,
qualquer pessoa com a URL) lê a base toda. Não existe firewall no meio para salvar.

O resultado é um **checklist de riscos** para o Vinícius decidir o que corrigir antes de
publicar. Você audita e propõe; não altera policy, não roda migration, não rotaciona chave.

## Três regras inegociáveis

**1. Nenhum valor de segredo entra no relatório.** Registre onde está, que tipo é e o que
fazer — nunca a chave, o token ou a senha. Um relatório com a chave dentro é mais uma cópia
do vazamento, e ele vai para o Git.

**2. Nada de teste ofensivo em produção.** Verificação aqui é leitura: ler código, ler
`pg_policies`, rodar `select` em base de desenvolvimento. Se um risco só se confirma
exercitando o sistema (ex.: "o mentorado consegue puxar a tabela inteira?"), descreva o
teste, marque como **a confirmar** e deixe a execução para o Vinícius decidir — em ambiente
de desenvolvimento, com dado de teste.

**3. Anon key exposta não é achado; anon key exposta *sem RLS* é catástrofe.** A
`NEXT_PUBLIC_SUPABASE_ANON_KEY` é publicada de propósito no bundle — é assim que o Supabase
funciona. Reportá-la como vazamento queima a credibilidade do relatório inteiro. O que é
achado grave: a **service_role key** em qualquer lugar que chegue ao navegador (ela ignora
RLS por definição), e qualquer tabela sem RLS ou com policy permissiva.

## Fluxo

### 1. Entenda a superfície antes de procurar buraco

Leia, nesta ordem: as migrations (`supabase/migrations/*.sql`), o `middleware.ts`, os
`layout.tsx` que decidem papel, a camada de dados (`lib/`), e todo `app/api/**/route.ts`.
Anote quem são os papéis, quais tabelas existem e qual é o dado mais sensível ali dentro —
tudo depois se mede contra isso. Em plataforma de saúde (AURA, consultórios) o dado é
sensível no sentido legal, e a régua sobe.

### 2. Varredura de segredos

```bash
node .claude/skills/ciberseguranca/scripts/segredos.mjs "<pasta do projeto>"
```

Procura chaves em arquivos e no histórico do Git, e faz o que um grep não faz: **decodifica
o JWT encontrado e diz se a claim `role` é `anon` ou `service_role`** — que é a diferença
entre "normal" e "incidente". Também confere se `.env*` está no `.gitignore`, se algum
`.env` está rastreado pelo Git, e se existe variável `NEXT_PUBLIC_` com nome de segredo.

Ele imprime só metadado (tipo, papel, projeto, tamanho), nunca o valor.

### 3. Banco: RLS, policies e permissões

O eixo mais importante e o único que não dá para auditar lendo só o código, porque o que
vale é o que está aplicado no banco — não o que a migration dizia. Use o **MCP do Supabase**
com o projeto certo (`list_projects` → confirme com o usuário qual é).

Roteiro completo em **`references/supabase.md`**: `get_advisors` (security e performance),
tabelas sem RLS, policies `using (true)`, `grant` para `anon`, funções `security definer` com
`search_path` mutável, buckets de Storage públicos, e o teste de isolamento entre clientes.

### 4. Autorização na aplicação

Leia **`references/checklist.md`**, seção *Autorização*. O padrão de risco recorrente nestes
projetos: **o roteamento por papel acontece no layout client-side**. Equipe vai para o painel,
cliente final vai para o portal — mas nada impede o cliente final de digitar `/financeiro`
na barra de endereço. Se a página renderizar e a RLS estiver correta, ele vê a tela vazia
(feio, não grave). Se a RLS não cobrir aquela tabela, ele vê o faturamento inteiro.

### 5. Exposição de dado, sessão, entrada e cabeçalhos

Ainda em `references/checklist.md`: PII em log e em mensagem de erro, colunas sensíveis
trafegando para o portal, `getSession` usado como se validasse token no servidor, cadastro
aberto, redirect URLs, upload sem validação, XSS, CSP e cabeçalhos na Vercel.

### 6. LGPD

**`references/lgpd.md`**. Não é enfeite jurídico: a plataforma é operadora de dado de
terceiro, e em vários clientes há dado sensível de saúde (art. 11). O checklist cobre o que é
verificável no produto — política de privacidade e termos publicados, base legal declarada,
retenção e exclusão, exportação, registro de acesso, região de hospedagem, contrato com
suboperadores (Supabase, Vercel) e plano de incidente.

### 7. Relatório

Formato em **`references/relatorio.md`**. Salve em
`<projeto>/docs/auditorias/<AAAA-MM-DD>-seguranca.md`.

A abertura é a parte que precisa estar certa: se houver **ação imediata** (chave real
vazada, tabela sem RLS em produção), ela vai no topo, com o passo a passo da correção — e
você avisa no chat antes de terminar o relatório, sem esperar.

### 8. Feche no chat — e entregue o arquivo

Veredito em uma linha ("pode publicar", "publica depois de resolver #1 e #2", "não publica")
e os riscos altos com uma frase cada. Em seguida, **envie o próprio `.md` do relatório com
SendUserFile** (display `render`) — o caminho em `docs/auditorias/` fica no texto como
referência, mas a entrega é o arquivo. Lembrete: o relatório não contém valor de segredo,
então pode circular; se houver ⚡ ação imediata, ela já foi avisada antes, no momento do
achado.

## Severidade

Combine impacto e facilidade de exploração — não use "crítico" para tudo, ou ninguém prioriza:

| | Critério |
|---|---|
| 🔴 **Crítico** | Dado de cliente exposto agora, ou chave válida vazada. Corrigir antes de qualquer publicação |
| 🟠 **Alto** | Exploração plausível por usuário autenticado ou por quem tem a URL; ou não conformidade legal com dado sensível |
| 🟡 **Médio** | Depende de outra falha, de acesso interno, ou o impacto é limitado |
| 🔵 **Baixo** | Endurecimento — reduz superfície, sem exploração conhecida hoje |

## Se encontrar chave válida vazada

Isso interrompe a auditoria — avise imediatamente e trate como incidente:

1. **Rotacione primeiro, investigue depois.** Supabase: *Settings → API → service_role →
   Generate new key* (a anon key só muda se você trocar a JWT secret, o que invalida todas as
   sessões — planeje). Outros serviços: revogue no painel de origem.
2. **Atualize onde a chave era usada de verdade** — Vercel (*Settings → Environment
   Variables*), `.env.local` no disco. Nunca colando o valor num comando de terminal: o
   histórico do shell guarda, e já houve o caso da `ANON_KEY` chegar mascarada por esse
   caminho e quebrar todo o login em produção.
3. **Considere comprometido tudo que a chave alcançava.** Apagar o commit não resolve — o
   histórico do Git guarda, e repositório privado não é garantia (fork, clone, CI, backup).
4. **Registre**: qual chave, desde quando estava exposta, o que ela dava acesso, e se há
   indício de uso indevido (Supabase → *Logs*).

## Fronteira com as outras skills

Lentidão, N+1, duplicação e regra de negócio errada são da `/revisao-codigo` — aqui só entra
o que tem consequência de segurança (por exemplo: uma listagem sem `limit` que permite baixar
a base inteira numa requisição é achado dos dois lados, e você diz isso). Tela feia ou
confusa é da `/qa-interface`.
