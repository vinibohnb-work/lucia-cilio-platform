---
name: qa-interface
description: QA de interface e usabilidade de uma plataforma Scalasys — varre todas as telas no desktop, tablet e celular, estressa os fluxos como um usuário faria, e devolve um checklist de bugs, dificuldades de uso e oportunidades de melhoria. Use quando o usuário pedir teste de QA, revisão de UI/UX, "testa a plataforma", "vê se está bom no celular", verificação de usabilidade, acessibilidade, responsividade, ou antes de entregar as telas para o cliente final.
---

# QA de interface

Você é o primeiro usuário hostil da plataforma. O cliente vai abrir isso no iPhone dele, no
meio do consultório, com uma mão só — e o que quebrar ali quebra na frente de um cliente
pagante. Seu trabalho é achar antes.

Duas camadas, e as duas são necessárias: uma **varredura automática** que mede o que o olho
não mede com confiança (contraste, alvo de toque, overflow, erro de console, rótulo
acessível), e uma **exploração dirigida** em que você usa o sistema tentando quebrá-lo. A
primeira dá cobertura; a segunda dá julgamento. Relatório só com a primeira é um lint com
outro nome.

O entregável é **um único arquivo Markdown** — o checklist de correções e oportunidades,
com caixas de seleção, passo a passo para reproduzir cada problema e captura de tela como
prova — salvo em `<projeto>/docs/auditorias/<AAAA-MM-DD>-interface.md` e **entregue na
conversa ao final** (SendUserFile), não apenas citado por caminho. Ele mora no projeto
auditado, junto das capturas, para que a próxima auditoria o encontre e compare.

## Regra de credencial

**Você não digita a senha de ninguém.** Quando o teste exigir estar logado, quem loga é o
Vinícius — e você continua a partir dali. São dois caminhos, os dois previstos abaixo:
`scripts/sessao.mjs` (abre o Chrome, ele entra, os cookies ficam salvos para a varredura) ou
o login feito por ele na própria aba do preview, para a exploração manual.

## Fluxo

### 1. Levante telas, papéis e o que o app promete fazer

Antes de abrir o navegador: liste as rotas em `app/**/page.tsx`, os papéis (`Admin`,
`Mentor`, `Customer Success`, `Comercial`, `Mentorado`/cliente final) e o que cada área
deveria permitir. Leia o `README`/`PRODUCAO.md` do projeto — ele costuma dizer qual é o fluxo
principal, e é contra essa promessa que você testa.

Duas perguntas orientam a auditoria inteira: **qual é o trabalho que a equipe repete toda
semana** (essa tela precisa ser rápida e à prova de erro) e **o que o cliente final vê**
(essa tela é a cara do cliente da Scalasys — não pode ter aspereza).

### 2. Suba o app

Prefira **desenvolvimento local**, não produção: aqui você vai criar registro lixo,
enviar formulário duas vezes e digitar coisa inválida — nada disso deve acontecer na base
real do cliente. Se só houver produção, restrinja-se ao que não grava dado e diga isso no
relatório.

O projeto costuma ter `.claude/launch.json`; se tiver, `preview_start` com o nome de lá. Se
não tiver, crie um (`npm run dev`, porta 3000) — vale para as próximas vezes.

### 3. Capture a sessão de cada papel

Dois caminhos. **Prefira o primeiro** — ele não ocupa o Vinícius e não usa a senha de
ninguém de verdade.

**a) Conta descartável, tudo automático** (quando existe ambiente de QA/staging e você tem o
`service_role` dele em `.env.staging.local`):

Crie uma conta de teste por papel, use, e apague no fim. Vários projetos já têm o script
pronto para isso — no Método APEX é `scripts/cria-contas-teste.mjs` (cria a conta, copia
dados de um molde com prefixo `[TESTE]`, imprime a senha gerada, e `--remover` limpa tudo).
Se o projeto não tiver, crie o usuário pela Admin API do Supabase com uma senha que você
mesmo gera.

Com a conta na mão, troque a senha por uma sessão sem abrir navegador:

```bash
node .claude/skills/qa-interface/scripts/sessao-api.mjs \
  --env .env.staging.local --email qa-admin@exemplo.com --senha "<a que o script gerou>" \
  --saida .qa/sessao-admin.json
```

Isto vale para **conta descartável de QA**. Nunca para a senha pessoal de um usuário real —
nesse caso use o caminho (b).

**b) O próprio usuário loga** (produção, conta real, ou projeto sem service_role à mão):

```bash
node .claude/skills/qa-interface/scripts/sessao.mjs --base http://localhost:3000 --saida .qa/sessao-equipe.json
```

Abre o Chrome visível, o Vinícius entra, o script detecta a sessão, salva e fecha sozinho.

**Onde a sessão mora** — a varredura aceita os dois formatos, mas vale saber qual é o do
projeto, porque o sintoma de errar é a varredura rodar deslogada sem reclamar:

| O projeto usa | A sessão fica em | Caminho que funciona |
|---|---|---|
| `@supabase/ssr` + `middleware.ts` (MindBiz, Alph Club) | cookie | (a) ou (b) |
| `@supabase/supabase-js` direto no client (Método APEX) | `localStorage` | **(a)** — o (b) só captura cookie |

Confirme no relatório da varredura: o cabeçalho diz quantos cookies e itens de localStorage
foram carregados, e se as rotas protegidas continuarem caindo no login, a sessão não pegou.

Os arquivos de `.qa/` contêm token válido: acrescente `.qa/` ao `.gitignore` do projeto e
apague-os ao terminar.

### 4. Varredura automática, por papel

```bash
node .claude/skills/qa-interface/scripts/varredura.mjs \
  --base http://localhost:3000 \
  --projeto "<pasta do projeto>" \
  --sessao .qa/sessao-equipe.json \
  --saida "<pasta>/docs/auditorias/qa-<data>/equipe"
```

Descobre as rotas sozinha, visita cada uma em **celular (390×844, com toque), tablet
(820×1180) e desktop (1440×900)**, e devolve `varredura.md`, `varredura.json` e as capturas
de tela em página inteira.

O que ela mede: página que não abre ou renderiza vazia, erro de console e exceção, requisição
4xx/5xx, rolagem horizontal (com o elemento culpado), fonte abaixo de 12px, campo com fonte
abaixo de 16px — que faz o iPhone dar zoom sozinho ao focar —, contraste abaixo do mínimo WCAG
AA, alvo de toque menor que 44×44, campo sem rótulo associado, botão de ícone sem nome
acessível, imagem sem `alt`, texto cortado, tabela mais larga que a tela sem rolagem própria,
zoom bloqueado no `meta viewport`, falta de `h1` e de `lang`.

Rotas dinâmicas (`/mentorados/[id]`) ela pula e avisa — rode de novo com `--rotas` passando
ids reais, porque tela de detalhe é onde mais aparece problema de layout.

### 5. Olhe as capturas

Este passo não é opcional e é o que separa esta auditoria de um lint. Abra os PNGs com a
ferramenta de leitura de arquivo — comece pelas versões **mobile**, que é onde quebra.

O que só se vê olhando: hierarquia confusa (tudo com o mesmo peso), espaçamento irregular,
número sem rótulo, coluna espremida, botão primário competindo com secundário, cor de status
sem legenda, estado vazio que parece erro, densidade excessiva de informação, e — o mais
comum em plataforma feita rápido — a tela que está tecnicamente correta e mesmo assim não
diz ao usuário o que ele deve fazer ali.

### 6. Exploração dirigida

Agora use o sistema. O roteiro completo está em **`references/roteiro-qa.md`**: fluxos
críticos, o estresse de formulário (duplo clique, campo vazio, texto gigante, valor negativo,
emoji), navegação (voltar depois de salvar, recarregar no meio, link direto para tela
interna, sessão expirada), estados (vazio, um registro, muitos registros), teclado e leitor
de tela, e o que testar especificamente no celular (arrastar kanban com o dedo, teclado
cobrindo o campo, modal que não rola).

Ferramentas: `navigate`, `read_page` (a árvore de acessibilidade mostra o que um leitor de
tela veria — botão sem nome aparece anônimo ali), `computer` para clicar e digitar,
`resize_window` com o preset `mobile` para emular toque, `read_console_messages` e
`read_network_requests` depois de cada ação que grava dado.

Regra ao encontrar algo: **reproduza de novo antes de anotar**. Bug que você não consegue
repetir vira "não reproduzível" no relatório, com o que você viu — nunca vira item de
correção, porque o Vinícius vai perder uma hora atrás dele.

### 7. Relatório

Formato em **`references/relatorio.md`**. Salve em
`<projeto>/docs/auditorias/<AAAA-MM-DD>-interface.md`, ao lado da pasta de capturas.

### 8. Limpe o que você sujou

Em staging, testar de verdade significa gravar lixo — e lixo de QA que fica vira dado que
alguém depois confunde com real. Antes de escrever o relatório:

- Apague os registros que você criou (o prefixo `[QA]`/`[TESTE]` no nome existe para isso).
- Remova as contas descartáveis (`--remover` do script do projeto, quando houver).
- Apague `.qa/` — os arquivos de sessão.
- Liste no relatório o que criou e apagou. Se algo não deu para apagar (registro com
  dependência, por exemplo), diga qual e onde ficou.

### 9. Feche no chat — e entregue o arquivo

O veredito de entrega em uma linha e os bloqueadores com uma frase cada. Em seguida,
**envie o próprio `.md` do relatório com SendUserFile** (display `render`), para o usuário
abrir com um clique — o caminho em `docs/auditorias/` fica no texto como referência, mas a
entrega é o arquivo. Se houver uma captura que resume o problema mais grave, envie junto.

## Severidade

Do ponto de vista de quem usa, não de quem escreveu:

| | Critério |
|---|---|
| 🔴 **Bloqueia** | Não dá para concluir a tarefa: tela não abre, botão não responde, dado não salva, quebra no celular |
| 🟠 **Atrapalha** | Dá para concluir, mas com erro provável ou esforço indevido: texto ilegível, alvo minúsculo, mensagem de erro incompreensível, estado vazio sem saída |
| 🟡 **Incomoda** | Ruído: desalinhamento, inconsistência entre telas, rótulo ambíguo, falta de feedback ao salvar |
| 🔵 **Oportunidade** | Não é defeito: atalho, filtro salvo, ordenação padrão melhor, algo que o cliente vai pedir no primeiro mês |

Um item 🟠 no portal do cliente final vale mais que um 🔴 numa tela interna que só o Vinícius
usa — diga isso quando for o caso, em vez de deixar a tabela decidir sozinha.

## Reexecução

Havendo auditoria anterior em `docs/auditorias/`, leia antes e classifique os itens antigos
(resolvido / persistente / regrediu) no topo do relatório novo. As capturas antigas ficam:
comparar o antes e o depois da mesma tela é a evidência mais convincente de progresso.

## Fronteira com as outras skills

Achou chave exposta, dado de um cliente aparecendo para outro, ou tela acessível a quem não
deveria? Registre em uma linha e mande para a `/ciberseguranca`. Lentidão com causa no código
(N+1, listagem sem paginação) é `/revisao-codigo` — aqui você registra o **sintoma** ("a tela
de mentorados leva 6s para pintar no 4G") e deixa o diagnóstico para lá.
