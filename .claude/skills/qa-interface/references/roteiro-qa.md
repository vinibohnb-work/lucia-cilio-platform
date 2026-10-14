# Roteiro de estresse

O que a varredura automática não pega. Rode com o sistema aberto, tentando quebrá-lo.

Não é para executar tudo em toda tela — é para escolher o que se aplica. Dois princípios
guiam a escolha: **teste primeiro o caminho que dá dinheiro** (cadastrar, cobrar, marcar,
entregar) e **teste o portal do cliente final com mais rigor que o painel interno**, porque
o painel tem o Vinícius por perto para explicar e o portal não tem ninguém.

---

## 1. Fluxos críticos, ponta a ponta

Faça cada um inteiro, como um usuário faria, sem atalho pela URL:

- **Entrar e chegar onde importa.** Login → primeira tela útil. Quantos cliques até a tarefa
  principal? A tela inicial responde "o que eu faço agora?" ou é só um painel de números?
- **Criar → ver na lista → abrir → editar → excluir** o registro central (mentorado,
  paciente, lead). O ciclo completo, conferindo se a lista atualiza sem recarregar a página.
- **O trabalho semanal.** Aquilo que a equipe repete: registrar sessão, mover card no funil,
  dar baixa em pagamento. Faça três vezes seguidas e conte os cliques — repetição é onde a
  fricção vira reclamação.
- **O que o cliente final faz.** Entrar no portal, ver o próprio progresso, responder um
  formulário, encontrar a próxima sessão. Faça isso no celular, que é onde ele vai fazer.
- **Sair e voltar.** Logout de verdade; e depois entrar de novo — o estado anterior ficou
  coerente?

## 2. Formulários (onde mais aparece defeito)

- **Enviar vazio.** A mensagem diz qual campo e o quê, ou é um "erro ao salvar" genérico?
- **Duplo clique no botão de salvar.** Criou dois registros? O botão desabilita durante o
  envio?
- **Texto gigante:** 300 caracteres num campo de nome. Quebra o layout na listagem depois?
- **Caracteres reais do Brasil:** acento, cedilha, apóstrofo (`D'Ávila`), nome composto,
  emoji. Salva e reexibe igual?
- **Números indevidos:** valor negativo, zero, `1e9`, vírgula onde se espera ponto,
  `1.234,56` colado do Excel.
- **Datas:** ontem onde só cabe futuro, 31/02, ano 1900, ano 2099. E confira se a data
  exibida depois é a **mesma** que você digitou — o erro de fuso aparece exatamente aqui.
- **E-mail e telefone inválidos.** Aceita `a@b`? Aceita telefone com 3 dígitos?
- **Escrever, sair sem salvar.** Avisa que vai perder, ou perde calado?
- **Anexo** (se houver): arquivo grande, extensão inesperada, nome com acento.
- **Sem feedback de sucesso.** Salvou e nada mudou na tela? O usuário salva de novo — e aí
  duplica.

## 3. Navegação e estado

- **Voltar do navegador** depois de salvar, depois de abrir um drawer, depois de filtrar.
  Volta para onde deveria, ou reenvia o formulário?
- **Recarregar (F5) no meio do fluxo** — perdeu o que estava preenchido? O filtro sobreviveu?
- **Link direto** para uma tela interna, colado numa aba nova. Carrega, ou explode por falta
  de estado que só existia na navegação anterior?
- **Duas abas abertas** editando o mesmo registro.
- **Sessão expirada:** deixe parado e volte depois, ou apague o cookie. A tela avisa e manda
  para o login, ou fica travada num spinner eterno?
- **URL de registro inexistente** (`/mentorados/999999`) e de registro de outro usuário —
  este segundo é também item de segurança.
- **Rede lenta ou caída.** No DevTools, `Slow 3G` e `Offline`: aparece indicação de
  carregamento, ou a tela finge que está tudo bem?

## 4. Estados dos dados

- **Zero registros.** É o primeiro dia do cliente. A tela explica o que fazer e tem um botão
  para criar o primeiro, ou é um vazio mudo que parece defeito?
- **Um registro.** Gráficos e médias com n=1 costumam sair estranhos.
- **Muitos registros** (200+). A lista pagina? A busca funciona? Trava ao digitar no filtro?
- **Dado faltando:** mentorado sem telefone, sessão sem anotação, pagamento sem data. Sai
  `null`, `undefined`, `Invalid Date`, `NaN` ou `R$ NaN` na tela?
- **Valores extremos:** R$ 0,00, R$ 1.250.000,00, 0%, 100%, -15%.
- **Filtro que não devolve nada.** Diz "nenhum resultado para X" e oferece limpar o filtro?

## 5. Celular (o mais importante e o mais pulado)

Emule toque de verdade (`resize_window` preset `mobile`), não só uma janela estreita —
`hover` não existe no celular, e o que só aparece no hover não aparece nunca.

- **Menu:** abre, fecha, fecha ao navegar? Cobre o conteúdo?
- **Teclado na tela:** ao focar um campo do meio do formulário, o campo continua visível ou
  o teclado cobre? O botão de salvar fica alcançável?
- **Zoom automático ao focar** (campo com fonte < 16px no iPhone): a página fica deslocada
  depois?
- **Arrastar:** kanban e qualquer coisa com drag-and-drop. Funciona com o dedo? Se não
  funciona, existe outro caminho (menu "mover para")?
- **Tabela larga:** rola horizontalmente sozinha, ou empurra a página inteira?
- **Modal e drawer:** rolam por dentro? Dá para fechar sem procurar um "×" de 20px no canto?
- **Botão fixo no rodapé** cobrindo o último item da lista.
- **Uma mão só:** o que é mais usado está no alcance do polegar ou no topo da tela?
- **Barra do navegador** aparecendo e sumindo (`100vh` no iOS corta conteúdo).
- **Modo escuro** do sistema, se o app tem tema: contraste continua ok? Alguma cor invertida
  ficou ilegível?

## 6. Teclado e leitor de tela

Não é conformidade formal — é o mínimo que evita constrangimento com um usuário mais velho ou
com baixa visão, público real dos clientes de vocês.

- **Tab** percorre a tela numa ordem que faz sentido, e dá para **ver onde está o foco**.
- **Enter** envia o formulário do campo de senha.
- **Esc** fecha o modal; e o foco volta para onde estava.
- Modal aberto: o Tab fica preso dentro dele ou passeia pela página atrás?
- Na árvore de acessibilidade (`read_page`): botão de ícone anônimo, campo sem nome, imagem
  sem descrição, `div` com `onclick` fazendo papel de botão (não recebe foco nem responde ao
  Enter).
- **Zoom do navegador em 200%** — o layout aguenta ou vira sobreposição?

## 7. Consistência entre telas

Fácil de ignorar tela a tela e evidente quando se olha o conjunto:

- Mesmo conceito, nomes diferentes ("mentorado" numa tela, "aluno" em outra).
- Botão primário com cor, posição ou rótulo diferente entre telas.
- Data em `dd/mm/aaaa` numa tela e `aaaa-mm-dd` em outra; moeda com e sem `R$`.
- Mensagem de sucesso ora em toast, ora inline, ora ausente.
- Ordenação padrão diferente em listas equivalentes.
- Voz inconsistente: "Salvar" × "Confirmar" × "Enviar" para a mesma ação.

## 8. Detalhes que o cliente nota na primeira semana

- Título da aba genérico ("Create Next App") — aparece no favorito e na captura de tela.
- Favicon padrão do Next.
- Erro do Postgres cru num toast.
- "Carregando..." que nunca some quando não há dado.
- Ordenação default inútil (por id, em vez de mais recente primeiro).
- Nada de "voltar ao topo" numa lista longa no celular.
- Impressão/PDF do que o cliente vai querer imprimir (relatório, recibo) saindo cortado.
