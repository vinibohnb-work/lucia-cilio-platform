# Runbook — Migração do Supabase para Frankfurt (eu-central-1)

> **Porquê:** a região atual é `us-west-2` (Oregon, EUA) — confirmada no painel a 21/08.
> Dados fiscais, NIF e documentos de clientes fora da UE, contra o objetivo GDPR da Lúcia.
> A região de um projeto Supabase não se muda: migra-se para um projeto novo.
> **Bónus da jogada:** o projeto atual vira ambiente de **desenvolvimento** — resolve
> também o dev=prod, o nosso risco operacional mais sério.
>
> **Estado dos dados hoje:** poucos utilizadores (Lúcia, equipa, Tiago Galvão, contas
> demo) e volume pequeno — é o melhor momento que alguma vez vamos ter para migrar.

## Visão geral

| | Antes | Depois |
|---|---|---|
| Produção | `wefdhqurbdvsmzmtweno` (us-west-2) | **projeto novo (eu-central-1)** |
| Desenvolvimento | não existe (dev=prod!) | `wefdhqurbdvsmzmtweno`, com dados de teste |
| Funções Vercel | sem região fixada | `fra1` (R2, no mesmo balanço) |

O que migra: schema (via `SETUP_COMPLETO.sql`, já idempotente e completo — secções 1–18),
**utilizadores com as palavras-passe** (o dump do schema `auth` leva os hashes — ninguém
precisa de redefinir senha), todos os dados, e os ficheiros do bucket `client-docs`.

O que muda para os utilizadores: **as sessões caem uma vez** (o projeto novo tem outro
segredo JWT) — toda a gente faz login de novo, com a mesma palavra-passe. Mais nada.

## Passos

### 1 · Criar o projeto (Vinícius, no painel — ~5 min)
- supabase.com → New project → Region: **Europe (Frankfurt) / eu-central-1**
- Plano: decidir já o **Pro** (é o que traz backups diários — item R3 do backlog; sem
  isto a migração muda a região mas não fecha a pergunta 8 da Lúcia)
- Guardar: URL do projeto, `anon key`, `service_role`, e a password da base de dados
  (Settings → Database) — **só no `.env` local e no painel, nunca no chat nem no Git**

### 2 · Schema (Claude prepara, Vinícius cola — ~5 min)
- SQL Editor do projeto novo → correr o `supabase/SETUP_COMPLETO.sql` inteiro
- É idempotente; foi mantido em dia precisamente para este dia

### 3 · Dados + utilizadores (pg_dump/pg_restore — ~15 min)
Na máquina local, com as connection strings dos dois projetos em variáveis de ambiente:
```
pg_dump  "$DB_ANTIGA" --data-only --schema=public --schema=auth  > dados.sql
psql     "$DB_NOVA"   -f dados.sql
```
- `--data-only` porque o schema já foi criado no passo 2 (e o `auth` vem de fábrica)
- O schema `auth` leva `auth.users` com `encrypted_password` — as senhas sobrevivem
- Conferir no fim: contagem de linhas por tabela igual nos dois lados (script pronto)

### 4 · Ficheiros do Storage (script — ~10 min)
Script Node com as duas service keys: listar `client-docs` no antigo, descarregar e
carregar no novo, pasta a pasta, e conferir contagem+tamanhos. (O bucket e as policies já
existem — vieram no SETUP_COMPLETO.)

### 5 · Apontar a aplicação (Vercel — ~10 min)
- Vercel → Settings → Environment Variables: trocar `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` para o projeto novo
- No mesmo balanço, **R2**: `"regions": ["fra1"]` no `vercel.json` (commit preparado)
- Redeploy → smoke test: login, Livro de Caixa, um documento, uma consultoria, gerar
  relatório IA, admin cria/apaga um utilizador de teste

### 6 · Despromover o antigo a DEV (~10 min)
- `.env.local` local passa a apontar para o **antigo** (que agora é dev) — e sai do
  OneDrive no mesmo gesto (item ⚡2 do backlog)
- No projeto antigo: substituir os dados reais por dados de teste assim que a produção
  nova estiver confirmada estável (1–2 dias de sobreposição por segurança, depois limpar —
  dados reais não devem ficar a viver nos EUA indefinidamente)
- Auth do antigo: apagar os utilizadores reais, manter/criar contas de teste

### 7 · Fechar o rasto
- Backlog: marcar região confirmada, R1, R2 (e R3 se o plano Pro entrou)
- Atualizar o relatório de auditoria com a região nova
- Avisar a Lúcia e os utilizadores: "vais precisar de fazer login de novo"

## Janela e reversão

- **Janela:** ~1h de trabalho efetivo; fazer fora do horário em que a Lúcia usa a
  plataforma com clientes. Entre o passo 3 e o 5, escritas na produção antiga perdem-se —
  por isso: avisar, migrar, apontar, sem pausa entre 3 e 5.
- **Reversão:** até ao passo 5 é só não trocar as env vars. Depois do passo 5, reverter =
  voltar a apontar as env vars ao antigo (que ainda tem tudo até à limpeza do passo 6).

## O que preciso do Vinícius vs. o que eu preparo

| Vinícius | Claude |
|---|---|
| Criar o projeto em Frankfurt e decidir o plano | Script de cópia do Storage |
| Colar o SETUP_COMPLETO no SQL Editor | Script de conferência (contagens dos dois lados) |
| Correr os dois comandos pg_dump/psql | Commit do `vercel.json` com `fra1` |
| Trocar as env vars na Vercel | Smoke test guiado + atualização do backlog/auditoria |
| Guardar as chaves novas (painel + .env local) | Limpeza do projeto antigo (vira dev) |
