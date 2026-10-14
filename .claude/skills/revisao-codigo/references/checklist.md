# Catálogo de verificações

Calibrado para o stack padrão das plataformas Scalasys: **Next.js 15 (App Router) + React 19
+ TypeScript + Supabase (Postgres, Auth, RLS) + Vercel**, com painel de equipe e portal do
cliente final no mesmo app, papéis em `profiles.papel`.

Cada item traz **como detectar** e **por que importa**. Nem tudo se aplica a todo projeto —
descarte o que não faz sentido em vez de forçar um achado.

---

## 1. Corretude e regra de negócio

O eixo que produz prejuízo silencioso: ninguém reclama, e o número está errado.

**Erro do Supabase descartado.** `const { data } = await supabase.from(...)` sem olhar
`error`. Em falha, `data` vem `null` e a tela renderiza vazia como se não houvesse registro —
o cliente conclui que perdeu dados. Detectar: `const {data` sem `error` na mesma
desestruturação. Vale para `insert`/`update`/`delete` também, onde o efeito é pior: a
interface diz "salvo" e nada foi gravado.

**Regra que só existe na interface.** Unicidade, obrigatoriedade, faixa de valor, transição de
status válida. Se a única barreira é o formulário, ela não existe: qualquer chamada direta à
API do Supabase (o cliente final tem a anon key no navegador) passa por cima. Confronte cada
validação do formulário com `not null`, `check`, `unique` e trigger no schema.

**Transição de status sem guarda.** Kanban, funil de prospecção, status de pagamento: veja se
é possível ir de "cancelado" para "ativo", pular etapa, ou reabrir algo fechado. Costuma ser
`update({ status })` livre.

**Dinheiro em ponto flutuante.** `number` no TypeScript e `float`/`double precision` no
Postgres para valor de mensalidade, comissão ou desconto. Some 0.1 + 0.2 e explique a
diferença de centavos na fatura. O certo é `numeric(12,2)` no banco e centavos inteiros ou
string no transporte.

**Data, fuso e o dia que anda para trás.** O Brasil é UTC−3, e o padrão que quebra é
`new Date(...).toISOString().slice(0,10)`: uma sessão marcada às 21h de terça vira quarta no
relatório. Verifique se a coluna é `date` (sem fuso, para aniversário/vencimento) ou
`timestamptz` (para evento com hora), e se a formatação usa `toLocaleDateString('pt-BR')` com
`timeZone: 'America/Sao_Paulo'`.

**Percentual e divisão por zero.** Taxa de conversão, ocupação, evolução mês a mês: com
denominador zero (cliente novo, mês sem dado) sai `NaN`, `Infinity` ou `-100%` na tela.

**Agregação no cliente sobre página parcial.** O total, a média e o "faturamento do mês"
calculados em cima de um array que veio com `limit` ou paginado: o número apresentado é do
pedaço, não do todo. Agregação é trabalho de banco (`count`, `sum`, view ou RPC).

**Documento brasileiro sem validação real.** CPF/CNPJ conferidos só por tamanho, telefone e
CEP sem máscara consistente. Barato de arrumar e caro de descobrir depois, quando a base já
tem 200 registros sujos.

**Exclusão que deixa órfão.** `delete` numa tabela referenciada sem `on delete cascade` nem
`set null`, ou exclusão lógica (`ativo = false`) que as consultas de listagem esquecem de
filtrar — o registro "excluído" reaparece em um relatório.

**Concorrência: última escrita vence.** Dois usuários da equipe editando o mesmo mentorado. Se
o `update` manda o objeto inteiro, o segundo apaga o trabalho do primeiro sem aviso. Mandar só
os campos alterados reduz; `updated_at` conferido no `where` resolve.

## 2. Redundância

O que o usuário chamou de "mesmo trabalho feito duas vezes" — e que aparece em duas escalas.

**Bloco duplicado entre arquivos.** O `mapa.mjs` detecta blocos repetidos de 8+ linhas. Os
casos típicos aqui: a tabela de listagem copiada entre módulos, o card de métrica reescrito em
cada página, o mesmo formatador de moeda em três arquivos, e — o mais caro — o mesmo trecho
duplicado entre o **painel** e o **portal**, que depois diverge e passa a mostrar números
diferentes para a equipe e para o cliente.

**Query repetida em vez de derivada.** A mesma tabela buscada em três componentes da mesma
tela porque cada um busca o que precisa. Três requisições, três estados de carregamento, três
oportunidades de divergir. Uma busca no nível da página, distribuída por props ou contexto,
resolve.

**Estado duplicado.** O mesmo dado em `useState` local e no store/contexto, sincronizados na
mão por `useEffect`. Toda sincronização manual acaba dessincronizando.

**Recálculo por render.** `array.filter().sort().reduce()` no corpo do componente, refeito a
cada tecla digitada num filtro. Com 50 registros ninguém nota; com 5.000 a digitação trava.
`useMemo` com dependências corretas.

**Componente reescrito em vez de reutilizado.** Dois componentes com o mesmo papel e nomes
diferentes (`Card` e `Box`, `Drawer` e `Painel`). Sinal: o `components/ui.tsx` existe mas
metade das telas não o usa.

**Arquivo morto.** Página não referenciada em nenhum `nav`, componente sem import, o
`<cliente>-plataforma.html` do sketch comercial ainda na raiz do repositório, script de
migração pontual já executado, `dev.log` versionado. Não é urgente, mas confunde quem lê o
projeto depois — inclusive você daqui a três meses.

**Dependência instalada e não usada** (e o contrário: função copiada à mão que já existe numa
dependência instalada).

## 3. Performance e carga

Sempre no volume que o cliente vai ter em um ano, não no volume do seed.

**N+1 no Supabase.** `await` dentro de `.map()`/`for` — buscar cada mentorado de uma lista de
sessões um a um. Cada iteração é uma viagem de rede (~80–150ms). Com 300 registros são 40
segundos. Resolve com `select` aninhado (`select('*, mentorado:mentorados(nome)')`) ou um
`in` único.

**`select('*')` em tabela larga.** Traz colunas que a tela não usa — inclusive colunas
sensíveis que não deveriam trafegar até o portal do cliente. Custo de banda e de risco.

**Listagem sem `limit` nem paginação.** Funciona no lançamento, e degrada linearmente até o
cliente reclamar que "o sistema ficou lento". Toda tela de lista precisa de teto.

**Contagem trazendo os registros.** `const { data } = await ...select('*'); data.length`.
O certo é `select('*', { count: 'exact', head: true })`, que não transfere linha nenhuma.

**Coluna filtrada sem índice.** Cruze todo `.eq('coluna')`, `.order('coluna')` e `.ilike` com
os `create index` das migrations. Sem índice, o Postgres varre a tabela inteira — e no plano
Free do Supabase isso aparece rápido. **Atenção especial às colunas usadas dentro das
policies de RLS**: o predicado roda por linha, então uma policy que compara
`mentorado_id` sem índice multiplica o custo de toda consulta na tabela.

**`await` sequencial que deveria ser paralelo.** Três buscas independentes em sequência somam
os tempos; `Promise.all` cobra o maior. Padrão fácil de achar: `await` em linhas consecutivas
sem uma usar o resultado da outra.

**`'use client'` na página inteira.** Em App Router, marcar a página como client arrasta toda
a árvore para o bundle e joga o fetch para depois do carregamento (spinner em vez de conteúdo).
Verifique se a página precisa mesmo, ou se só a ilha interativa (o drawer, o formulário)
precisava.

**Componente pesado sempre no bundle.** Modal, editor, gráfico complexo que o usuário abre uma
vez por semana e baixa em toda visita. `next/dynamic` com `ssr: false`.

**Imagem sem `next/image`.** Logo de 2 MB servido em tamanho original — no 4G do celular do
cliente isso é a diferença entre 1s e 9s.

**Realtime/timer sem limpeza.** `supabase.channel(...).subscribe()`, `setInterval`,
`addEventListener` sem o `return` de limpeza no `useEffect`: cada navegação abre mais uma
inscrição, o navegador acumula e a aba começa a travar depois de meia hora de uso — o padrão
de uso real de um painel de gestão.

**`useEffect` com dependência errada.** Array vazio quando depende de algo (dado velho na
tela) ou objeto/array recriado a cada render na lista de dependências (laço de requisições).
Este segundo caso aparece como "o sistema está lento e o Supabase acusa milhares de chamadas".

**Refetch da tela inteira depois de salvar um campo.** Comum e caro; atualizar o registro em
memória basta.

## 4. Robustez

**Estados que faltam.** Toda tela que busca dado precisa dos quatro: carregando, vazio, erro,
e o feliz. O **vazio** é o mais esquecido, e é exatamente o que o cliente vê no primeiro dia
de uso — tela em branco sem explicação.

**Duplo clique no botão de salvar.** Sem desabilitar durante o envio, cria dois registros.
Verifique todo `onSubmit`: `disabled` enquanto envia.

**Erro engolido.** `try/catch` com `catch {}` vazio ou só `console.error`. O usuário não fica
sabendo que falhou e acha que salvou.

**Mensagem de erro técnica na cara do usuário.** `error.message` do Postgres
("duplicate key value violates unique constraint...") num toast. Precisa de tradução para o
que a pessoa deve fazer.

**Otimismo sem volta.** A interface atualiza antes da confirmação e não desfaz quando falha:
a tela mostra um estado que o banco não tem.

**Rota dinâmica sem caso "não encontrado".** `/mentorados/[id]` com id inexistente ou de outro
cliente: precisa de `notFound()`, não de crash por ler propriedade de `null`.

**`any` e `!` em fronteira de dado.** `as any` no retorno do Supabase e `dado!.campo` são onde
o TypeScript para de ajudar exatamente onde mais precisava — no dado que veio de fora.

**Variável de ambiente com `!`.** `process.env.X!` que, ausente na Vercel, quebra em produção
com erro obscuro (foi o que aconteceu com a `ANON_KEY` mascarada). Uma checagem na
inicialização com mensagem clara economiza uma tarde.

## 5. Manutenibilidade

**String de papel espalhada.** `'Admin'`, `'Mentorado'`, `'Customer Success'` literais em 15
arquivos: um papel novo vira caça ao tesouro e um erro de digitação vira falha de permissão
silenciosa. União de tipos + constante em um lugar só.

**Arquivo grande demais.** Acima de ~400 linhas, uma página costuma estar acumulando busca de
dado, regra e apresentação. Não é regra rígida — o critério é se dá para achar onde mexer.

**Regra de negócio dentro do JSX.** Cálculo de comissão no meio do `return`: impossível de
testar e fácil de duplicar diferente na próxima tela.

**Mistura de português e inglês** em nomes de tabela, coluna e função dentro do mesmo projeto.
Escolha uma e siga; o custo é a hesitação diária de quem escreve.

**Duas fontes de verdade para a mesma coisa** — o exemplo clássico daqui: a lista de itens do
menu em `lib/nav.ts` e as rotas em `app/`. Quando divergem, aparece item que leva a 404 ou
página sem entrada no menu.

**Sem `README`/`PRODUCAO.md` atualizado.** Não é burocracia: é o que permite retomar o projeto
seis meses depois e o que o cliente recebe se a relação terminar.

## 6. Dependências e build

- `npm run build` passa sem warning? Warning de build é erro que ainda não aconteceu.
- Erro de tipo ignorado (`ignoreBuildErrors`, `eslint.ignoreDuringBuilds`) no `next.config`.
- Dependência com vulnerabilidade conhecida (`npm audit`) — reporte só o que tem correção.
- Versões fixadas de forma incoerente entre projetos que vocês mantêm em paralelo.
- `.gitignore` cobrindo `node_modules`, `.next`, `.env*`, `.vercel` (se faltar, é achado de
  segurança — aponte para a `/ciberseguranca`).
