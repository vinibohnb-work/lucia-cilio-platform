# Auditoria de arquitetura e segurança — orientada a GDPR/RGPD e SaaS

> **Plataforma:** Lúcia Cílio · Office Consulting
> **Data:** 21/08/2026 · **Âmbito:** as 15 perguntas da Lúcia + preparação para
> comercialização em Portugal e Alemanha
> **Método:** varredura de segredos (código + histórico Git), leitura do schema e das
> policies aplicadas (`SETUP_COMPLETO.sql`, secções 1–18), leitura das funções serverless e
> testes de RLS já feitos em sessões anteriores contra a base real. Sem testes ofensivos em
> produção. Este relatório não contém nenhum valor de segredo.

## Veredito em uma linha

**A fundação de tenant isolation e gestão de segredos está sólida; a plataforma NÃO está
pronta para dados reais de vários clientes** — faltam quatro peças estruturais (região UE
confirmada, dev separado de prod, MFA, audit log) e há uma falha de eliminação a corrigir.
Nada disto é refazer: é acrescentar. A resposta à pergunta 4 da Lúcia é **sim, a base
aguenta a comercialização** — este documento diz o que falta pelo caminho.

---

## ⚡ Para tratar já (não são vazamentos, mas não devem esperar)

1. **A eliminação de um cliente é incompleta.** Apagar o utilizador remove as 15 tabelas
   com `on delete cascade`, mas **os ficheiros do bucket `client-docs` ficam órfãos** — a
   pasta `uid/` do cliente não é apagada com ele. Para o RGPD (direito ao apagamento,
   art. 17), isto é uma não-conformidade direta. Correção: no `api/admin-users.js`, antes
   do `deleteUser`, listar e remover `client-docs/<uid>/**`.
2. **`.env.local` (com a service_role) vive numa pasta sincronizada com o OneDrive.** A
   chave está fora do Git, mas está a ser copiada para a nuvem da Microsoft a cada gravação.
   Mover o projeto para fora do sincronizador, ou excluir `.env.local` da sincronização.
3. **Região do Supabase: confirmar no painel (2 minutos).** Dashboard → Settings → General
   → Region. Tudo o resto deste relatório depende dessa resposta — ver pergunta 2.

---

## As 15 perguntas, uma a uma

### 1. Onde está alojada a base de dados?
**Supabase** (projeto `wefdhqurbdvsmzmtweno`), que corre sobre AWS. Um único projeto:
Postgres + autenticação + Storage no mesmo lugar.

### 2. Em que país/região ficam fisicamente os dados?
**A confirmar no painel** — a região é escolhida na criação do projeto e não consigo lê-la
por fora (o tráfego passa por Cloudflare, que esconde a origem). ⚠️ **Ponto importante: a
região de um projeto Supabase não se muda depois de criado.** Se não estiver em Frankfurt
(`eu-central-1`), o caminho é criar um projeto novo em Frankfurt e migrar (dump do Postgres
+ cópia do Storage) — trabalho de um dia, e há um momento perfeito para o fazer (ver
recomendação R1).

### 3. Onde ficam as faturas e documentos dos clientes?
No **Supabase Storage**, bucket **`client-docs`, privado**, com RLS por pasta: cada cliente
só lê `client-docs/<o-seu-uid>/…`; o download é por URL assinada com 120 s de validade.
Está bem desenhado. Fica na mesma região do projeto — ou seja, a resposta real depende da
pergunta 2.

### 4. Que dados passam ou ficam armazenados na Vercel?
**Passam:** todo o tráfego da aplicação (HTML/JS pela CDN global) e o corpo das chamadas às
duas funções serverless (`admin-users`, `consultoria-relatorio`) — incluindo, em trânsito,
palavras-passe temporárias criadas pela administradora e os dados da ficha de consultoria.
**Ficam:** os ficheiros estáticos do site (sem dados de clientes) e os logs de execução das
funções. Dados de clientes **não são armazenados** na Vercel — a base e os documentos estão
todos no Supabase. ⚠️ Uma nuance: o erro 504 de ontem mostrou `gru1` (São Paulo) no
identificador do pedido — as funções serverless **não estão fixadas a uma região da UE**.
Corrige-se com uma linha no `vercel.json` (`"regions": ["fra1"]` — Frankfurt). → R2

### 5. Existem dados pessoais ou financeiros nos logs da Vercel?
**Não por ação nossa** — verificado: as funções serverless não têm um único `console.*`, e
as mensagens de erro devolvidas não incluem dados de clientes. A Vercel regista metadados
de pedido (rota, status, duração, IP) por período curto. Manter a disciplina de não fazer
log de payloads é uma regra a escrever no futuro documento de desenvolvimento.

### 6. Podemos manter base e documentos exclusivamente na UE, de preferência Frankfurt?
**Sim.** O Supabase oferece `eu-central-1` (Frankfurt) como região de projeto — base,
autenticação e Storage ficam lá. Se o projeto atual não estiver na UE, ver R1. A exceção a
declarar: a **geração do relatório de consultoria envia dados à API da Anthropic** (EUA) —
ver pergunta extra no fim.

### 7. Os dados estão encriptados em trânsito e em repouso?
**Sim, nos dois.** Em trânsito: TLS em tudo (Vercel e Supabase; HSTS ativo — verificado nos
cabeçalhos). Em repouso: o Supabase encripta os volumes (AES-256, infraestrutura AWS) e a
Vercel encripta as variáveis de ambiente. É encriptação de infraestrutura, o padrão do
setor — Lexware e DATEV fazem o mesmo; encriptação por cliente ao nível da aplicação seria
um projeto à parte e não é exigência do RGPD.

### 8. Temos backups automáticos e onde ficam?
**Depende do plano do Supabase — a confirmar no painel** (Database → Backups). No plano
Pro: backups diários com 7 dias de retenção, guardados na região do projeto; há PITR
(point-in-time recovery) como extra. Se o projeto estiver no plano gratuito, **não há
backups automáticos** — e isso seria um bloqueador para dados reais. → R3

### 9. Conseguimos exportar e eliminar completamente os dados de um cliente?
**Eliminar: quase** — o `deleteUser` apaga em cascata as 15 tabelas de dados do cliente,
mas ficam órfãos os ficheiros do Storage (⚡1) e ficam registos com `user_id = null` em
`client_billing` e `consultorias` (por desenho — são registos da atividade da própria
Lúcia; precisam é de política de retenção declarada, ver R6).
**Exportar: não** — hoje só o Livro de Caixa sai em CSV. O direito à portabilidade
(art. 20) pede a exportação completa dos dados do cliente num formato estruturado. → R4

### 10. Separação completa dos dados de cada cliente (tenant isolation)?
**Sim — é o ponto mais forte da plataforma.** Todas as tabelas de dados de cliente têm RLS
`auth.uid() = user_id`; o Storage tem RLS por pasta; e o isolamento foi **testado
comportamentalmente** contra a base real em sessões anteriores (um cliente autenticado não
lê, não cria, não altera nem apaga dados de outro — 0 linhas, dados intactos). A anon key
no browser é o funcionamento normal do Supabase; é a RLS que faz a separação, e está feita.

### 11. Permissões diferentes — cliente, funcionário LC, administrador?
**Já existe exatamente isso.** Papéis `user` (cliente), `comercial` e `marketing`
(funcionários LC, cada um limitado à sua área), `admin`. Verificação no servidor via
`is_admin()`/`has_role()` (SECURITY DEFINER) — não é só o menu que esconde: a RLS recusa.
A escalada de privilégios foi pensada: um utilizador não consegue promover-se a admin
(testado quando se construiu o fluxo de palavras-passe).

### 12. Podemos implementar MFA/2FA?
**Podemos — e não está implementado.** O Supabase Auth traz MFA TOTP (app autenticadora)
nativo; falta construir a interface de inscrição/verificação e decidir a política (obrigar
para admins, opcional para clientes é o padrão sensato). Estimativa: 1–2 dias. → R5

### 13. Audit logs — quem acedeu ou alterou o quê?
**Não existe hoje** ao nível da aplicação; o Supabase regista eventos de autenticação
(logins), mas não alterações de dados. Para o nível DATEV/Lexware: uma tabela
`audit_log` alimentada por triggers nas tabelas sensíveis (quem, quando, o quê, valor
anterior) + registo de "ver como" quando a administradora entra na conta de um cliente.
Estimativa: 2–3 dias. → R5

### 14. Development/test separado de production?
**Não — e este é o risco operacional mais sério do dia a dia.** O `.env.local` aponta para
a produção: rodar a aplicação localmente lê e escreve dados reais. Tem sido gerido com
disciplina (registos `[QA]` sempre apagados), mas disciplina não é arquitetura. → R1
resolve isto e a região ao mesmo tempo.

### 15. Segredos protegidos, fora de variáveis de ambiente "normais"?
**O desenho está certo:** a `service_role` e a `ANTHROPIC_API_KEY` vivem só no servidor
(Vercel env vars, encriptadas em repouso) e verificou-se a cada build que **não entram no
bundle** do browser (0 ocorrências — verificado de novo hoje). O histórico do Git está
limpo (os JWTs encontrados são placeholders do `.env.example`). Dois senões: o `.env.local`
sincronizado com o OneDrive (⚡2) e a palavra-passe da conta demo escrita num script do
repositório (aceitável enquanto for demo; apagar quando as demos saírem — cruza com o item
"remover dados de teste" do backlog).

---

## A pergunta que a Lúcia não fez mas o RGPD faz: a IA

A geração do relatório de consultoria **envia o conteúdo da ficha (nome, negócio, números)
à API da Anthropic**, processada nos EUA. Para uso interno com consentimento é gerível;
para SaaS precisa de: (a) constar da política de privacidade e do registo de tratamento,
(b) DPA com a Anthropic (existe — anthropic.com/legal), (c) avaliar a opção de residência
de inferência na UE quando disponível no plano, e (d) o princípio já seguido de **não
enviar mais do que o necessário** (a ficha vai, mas não vão credenciais nem dados de outros
clientes).

---

## Arquitetura atual vs. alvo da Lúcia

| Camada | Alvo dela | Hoje | Ação |
|---|---|---|---|
| Frontend/app | Vercel | Vercel (CDN global) ✅ | — |
| Funções serverless | — | Vercel, região **não fixada** | R2: fixar `fra1` |
| Base de dados | UE/Frankfurt | Supabase, região **a confirmar** | R1 |
| Documentos | UE/Alemanha | Supabase Storage (mesma região da base) | segue R1 |
| Backups | UE | plano a confirmar; ficam na região do projeto | R3 |
| IA | — | Anthropic (EUA) | DPA + política |

## Recomendações, por ordem — antes de dados reais de vários clientes

- **R1 · Criar um segundo projeto Supabase em Frankfurt — e decidir qual passa a ser o quê.**
  Se o atual já está na UE: o novo é o ambiente de **desenvolvimento** (separa dev/prod).
  Se o atual está fora da UE: o novo em Frankfurt torna-se a **produção** (migra-se com o
  `SETUP_COMPLETO.sql`, que está idempotente e completo — foi mantido para isto — + dump de
  dados + cópia do Storage), e o antigo vira dev. Uma pedrada, dois pássaros. **1 dia.**
- **R2 · Fixar as funções Vercel em Frankfurt** — `"regions": ["fra1"]` no `vercel.json`. **5 minutos.**
- **R3 · Confirmar/ativar o plano com backups** no Supabase (Pro; avaliar PITR). **Decisão de custo, não de código.**
- **R4 · Exportação completa dos dados do cliente** (art. 20) — um endpoint admin que junta
  as 15 tabelas + lista de documentos num ZIP/JSON. **1–2 dias.**
- **R5 · MFA (TOTP) + tabela de audit log** com triggers nas tabelas sensíveis e registo do
  "ver como". **3–5 dias no total.**
- **R6 · O pacote documental RGPD** — política de privacidade, registo de tratamento,
  política de retenção/eliminação (incluindo os registos `user_id = null`), procedimento de
  data breach (72 h), e os DPA/AVV dos suboperadores: Supabase, Vercel, Anthropic (todos os
  três têm DPA publicados para assinar/aceitar). Isto cruza com o item do backlog
  `docs/SEGURANCA_DADOS.md` e com a advogada que ela procura. **Trabalho conjunto com a Lúcia.**

## Resposta direta às 4 perguntas finais

1. **O que já temos:** tenant isolation por RLS testado, papéis com verificação no servidor,
   bucket privado com URLs assinadas, segredos fora do bundle e do Git, TLS/encriptação em
   repouso, sem PII nos logs por ação nossa, eliminação em cascata (15 tabelas), CSV do
   Livro de Caixa.
2. **O que falta:** região UE confirmada/garantida, dev≠prod, MFA, audit log, exportação
   completa, eliminação dos ficheiros do Storage, funções fixadas na UE, backups
   confirmados, pacote documental RGPD, DPA com os três suboperadores.
3. **Antes de dados reais de vários clientes:** ⚡1 e ⚡2 já; depois R1→R2→R3 (a
   infraestrutura), depois R4→R5 (os direitos e o rasto), com R6 em paralelo com a advogada.
4. **Dá para estruturar já para comercialização PT+DE?** **Sim.** A arquitetura
   Vercel → Supabase-Frankfurt → Storage-Frankfurt → backups-UE que ela desenha é
   exatamente o que o Supabase suporta, e o multi-tenant por RLS aguenta o modelo
   micro-empresas/profissionais. O que a separa de um Lexware/DATEV não é a fundação — é o
   rasto (audit), o MFA e o papel; e isso é o roteiro R4–R6, não uma reescrita.
