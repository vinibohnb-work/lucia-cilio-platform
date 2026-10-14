# Catálogo de verificações de segurança

Stack de referência: **Next.js 15 (App Router) + Supabase (Auth, Postgres, RLS, Storage) +
Vercel**, anon key no navegador, painel de equipe e portal do cliente final no mesmo app.

O eixo do banco tem arquivo próprio (`supabase.md`) porque é onde mora o risco principal.

---

## 1. Segredos e chaves

**service_role em qualquer caminho que chegue ao navegador.** Componente client, `lib/` sem
`server-only`, variável `NEXT_PUBLIC_*`, ou — o mais fácil de deixar passar — uma rota de API
que usa service_role e não faz a própria checagem de quem está chamando. A service_role
ignora RLS: quem a tem, tem o banco. 🔴 sempre.

**Chave em arquivo que não é `.env`.** Os lugares onde ela realmente aparece nestes projetos:
o `.html` do sketch comercial deixado no repositório, `PRODUCAO.md` e `README.md` com o passo
a passo do deploy, `docs/`, seed SQL, comentário de código, e print colado numa issue.

**`.env` rastreado pelo Git.** Verifique `git ls-files | grep env` — não basta estar no
`.gitignore` hoje se foi commitado ontem. Confira também o histórico (`segredos.mjs` faz).

**Senha no `PRODUCAO.md`.** Senha temporária de usuário criada no painel do Supabase e
anotada no guia "para não esquecer". Vira credencial permanente.

**Chave de terceiro** (OpenAI, Stripe, WhatsApp/Meta, SendGrid, Google) no client. Se o
serviço precisa ser chamado do navegador, o caminho é uma rota de API que faz a chamada com a
chave do servidor.

**`.vercel/`, `.env.local` e afins no `.gitignore`.** E a pasta do projeto fora de sincronizador
de nuvem compartilhada — conforme o `GOVERNANCA-ARQUIVOS.md` da casa.

## 2. Autorização na aplicação

**Papel decidido só no cliente.** `if (papel === 'Admin') return <Painel/>` é organização de
interface, não controle de acesso: quem digita a URL entra, e o navegador tem a anon key para
consultar direto. A pergunta a fazer para cada tabela é *"se o mentorado montar a requisição
na mão, o que ele traz?"* — e a resposta está na RLS, não no React.

**Cobertura do `matcher` do middleware.** Exceções escritas com regex negativo escondem
buracos. Cheque item por item o que ficou de fora: `/api/*` costuma ficar, e rotas de arquivo
estático liberadas por extensão (`.*\\.(png|jpg|...)$`) liberam qualquer URL terminada assim.
Confirme também que o middleware valida com `getUser()` (que verifica o token no servidor) e
não com `getSession()` (que só lê o cookie).

**Route handler sem verificação própria.** Todo `app/api/**/route.ts` precisa identificar o
usuário e checar permissão dentro do handler. Middleware que redireciona página não protege
API chamada por `fetch`.

**IDOR.** `/mentorados/[id]` ou `?id=` buscando pelo identificador sem filtrar por dono. Com
RLS correta o banco recusa; sem ela, trocar o número na URL abre o registro do vizinho. Vale
também para exclusão e edição.

**Escalada por auto-atualização.** O usuário consegue dar `update` no próprio
`profiles.papel`? Se a policy de update em `profiles` é "o usuário pode editar o próprio
registro" sem restringir colunas, qualquer mentorado vira Admin com uma requisição. Este é o
furo mais comum de todos nesta arquitetura. Corrige-se com policy por coluna, trigger que
bloqueia a mudança de `papel`, ou tirando `papel` de `profiles`.

**Convite e criação de usuário.** Se existe tela de convite no app, ela pode criar Admin? Quem
pode chamá-la?

## 3. Exposição de dados

**Coluna sensível trafegando para o portal.** `select('*')` numa tabela que tem CPF, telefone,
valor de mensalidade, anotação clínica ou observação interna sobre a pessoa — servido a uma
tela do cliente final que mostra só o nome. Está no JSON da resposta, visível na aba Network.
Corrige-se listando colunas, ou com uma view específica do portal.

**Anotação interna da equipe visível ao cliente.** Campo tipo `observacoes`/`notas` que a
equipe usa para escrever o que não diria na frente da pessoa. Verifique especificamente a
policy dele.

**PII em log.** `console.log(user)`, `console.error(error, dadosDoFormulario)`. Em produção
isso vai para os logs da Vercel e do Supabase, que ficam retidos e são acessíveis a quem tem
acesso ao painel — inclusive gente que não deveria ver dado de cliente.

**Mensagem de erro técnica devolvida ao usuário.** Erro do Postgres cru revela nome de tabela,
coluna e constraint. Traduza na interface e registre o detalhe no servidor.

**Storage público.** Bucket `public` com contrato, laudo, foto de paciente ou comprovante:
URL adivinhável ou vazada dá acesso sem login. Bucket privado + URL assinada com validade
curta é o padrão.

**Endpoint de diagnóstico esquecido.** `/api/debug`, `/api/seed`, rota que dumpa
`process.env`, página de teste com dado real.

**Source map em produção** e comentário com informação interna no bundle. Baixo, mas gratuito
de resolver.

## 4. Sessão e autenticação

**Cadastro aberto.** *Authentication → Sign In / Providers → Allow new users to sign up*
desligado, nos projetos de acesso por convite. Se estiver ligado, qualquer pessoa cria conta
e passa a ser "usuário autenticado" — e aí toda policy escrita como `to authenticated` se
torna pública.

**Papel padrão de usuário novo.** O trigger que cria o `profiles` precisa nascer com o papel
menos privilegiado. Verifique o `default` da coluna e o corpo do trigger.

**`getSession()` no servidor.** Ele lê o cookie sem validar a assinatura. Em Server Component,
route handler ou middleware, use `getUser()`.

**Redirect URLs.** *Authentication → URL Configuration*: Site URL e Redirect URLs restritas
aos domínios reais. Curinga aberto permite roubo de token via redirecionamento.

**Confirmação de e-mail e expiração de link.** Convite e recuperação de senha com validade
curta; e-mail confirmado antes do primeiro acesso.

**Política de senha** e proteção contra senha vazada (Supabase → Authentication → Policies).
Sem limite de tentativa, o login vira alvo fácil de força bruta — o Supabase tem rate limit
próprio, confira se está nos padrões.

**Logout de verdade.** `signOut()` chamado e estado local limpo; sessão de outra aba encerrada.

**Sessão eterna.** Refresh token sem rotação, ou expiração longa demais para um painel que
roda no notebook do consultório.

## 5. Entrada e injeção

**`dangerouslySetInnerHTML`** com qualquer coisa que venha do banco ou do formulário. Se for
conteúdo fixo (script anti-flash de tema, por exemplo), documente e siga.

**SQL montado em string** em `rpc`, em função do Postgres ou em `.filter('coluna', 'in', ...)`
com valor do usuário concatenado. Dentro de função `security definer` isso é escalada de
privilégio, não só injeção.

**Upload sem validação** de tipo real, tamanho e nome. Nome de arquivo vindo do usuário
usado direto no caminho do bucket permite atravessar pasta.

**Redirect aberto.** `?next=` ou `?redirect=` usado sem conferir se é caminho interno.

**Formulário público sem limite** (contato, inscrição em evento, lead): sem rate limit vira
entrada de spam gravada direto na base do cliente. Na Vercel, o caminho barato é checagem por
IP no route handler ou um honeypot.

**Validação só no cliente.** Ver a seção equivalente na `/revisao-codigo` — aqui o que
importa é que o servidor/banco também valide.

## 6. Cabeçalhos e infraestrutura

Verificáveis com `curl -I https://<dominio>` ou na aba Network:

- **CSP** — a que mais dá trabalho e a que mais entrega; comece por `frame-ancestors 'none'`
  se não houver tempo para a política completa.
- **HSTS** (`Strict-Transport-Security`), **X-Content-Type-Options: nosniff**,
  **Referrer-Policy: strict-origin-when-cross-origin**, **Permissions-Policy** desligando
  câmera/microfone/geolocalização se o app não usa.
- **CORS** em route handler: `Access-Control-Allow-Origin: *` em endpoint autenticado.
- Configuração em `next.config.ts` (`async headers()`) ou `vercel.json`.
- **Preview deployments da Vercel** com dado de produção e URL pública indexável: proteja por
  senha ou aponte o preview para outro projeto Supabase.
- **Dependências**: `npm audit` — reporte o que tem correção disponível e afeta o runtime.
- **Backup**: Supabase Free não faz backup diário. Se a plataforma já opera com dado real do
  cliente, "sem backup" é risco de segurança (disponibilidade), não só de custo.
- **Quem tem acesso aos painéis** (Supabase, Vercel, GitHub, domínio): revise a lista quando
  alguém sai do projeto; use 2FA.
