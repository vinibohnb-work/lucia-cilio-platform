# LGPD — o que é verificável na plataforma

Escopo desta seção: o que dá para auditar no produto e na infraestrutura. Contrato,
nomeação de encarregado e política interna são decisão do Vinícius com apoio jurídico —
aponte a lacuna, não redija o parecer. Isto é checklist técnico, não aconselhamento legal.

**Papéis:** o cliente (a clínica, o clube, a mentoria) é o **controlador** — ele decide por
que trata os dados. A Scalasys é **operadora** — trata em nome dele. Supabase e Vercel são
**suboperadores**. Essa cadeia define quase todo o resto: a Scalasys responde solidariamente
quando descumpre a instrução do controlador ou a própria lei (art. 42).

**Dado sensível muda a régua.** Saúde, biometria, dado de criança e adolescente, origem
racial, convicção religiosa, filiação sindical, vida sexual (art. 5º, II). Plataforma de
consultório, clínica ou qualquer coisa com prontuário, laudo, queixa ou evolução clínica cai
aqui — e o tratamento exige consentimento específico e destacado, ou outra hipótese do art.
11 (tutela da saúde por profissional, por exemplo). Na prática, para a auditoria: **RLS
frouxa em tabela de dado de saúde é 🔴, não 🟠.**

---

## Checklist

**Inventário do que é tratado.** Liste as tabelas e as colunas com dado pessoal, marcando as
sensíveis. Sem esse mapa nada mais é verificável — e ele é a base do registro de operações
(art. 37). Metade dos itens abaixo se resolve olhando essa lista.

**Minimização.** Existe coluna coletada "porque um dia pode ser útil"? CPF sem uso, endereço
completo quando o CEP bastava, data de nascimento onde só a faixa importa. Coletar menos é a
medida de segurança mais barata que existe: dado que não está no banco não vaza.

**Base legal declarada e visível.** Para cada finalidade (operar o serviço, cobrar, enviar
comunicação de marketing) há uma base — e marketing quase nunca cabe na mesma base da
operação. Se a plataforma dispara e-mail promocional, precisa de consentimento separado e
revogável.

**Política de privacidade e termos publicados** e alcançáveis **antes** do login, com data de
atualização, finalidades, prazo de retenção, com quem se compartilha (Supabase, Vercel,
gateway de pagamento) e canal do titular. O repositório `scalasys` já tem
`privacidade.html`/`termos.html` na raiz — verifique se a plataforma do cliente tem os
equivalentes, e se o conteúdo corresponde ao que o sistema faz de fato.

**Consentimento registrado, quando é a base.** Marcado por ação da pessoa (nunca pré-marcado),
com data, versão do texto aceito e possibilidade de revogar. Se não há coluna guardando isso,
não há prova.

**Direitos do titular operacionalizáveis** (art. 18): confirmação, acesso, correção,
anonimização, portabilidade e eliminação. Não precisa de tela bonita — precisa de um caminho
que funcione em 15 dias. Pergunta prática: *se um mentorado pedir hoje "apague meus dados",
qual é o procedimento?* Se a resposta for "não sei", é achado. Cuidado com o efeito colateral:
apagar um mentorado que tem pagamentos vinculados quebra a contabilidade — o desenho correto
costuma ser anonimizar o pessoal e preservar o registro fiscal, que tem retenção obrigatória.

**Retenção e descarte.** Existe prazo, ou tudo fica para sempre? Lead que nunca virou cliente,
diagnóstico de quem saiu do programa, log com PII. "Para sempre" é a resposta mais comum e não
atende ao art. 15.

**Registro de acesso.** Quem da equipe olhou o dado de quem, e quando. Em dado de saúde isso
deixa de ser boa prática e vira expectativa. Verifique se existe log de acesso/alteração
(tabela de auditoria ou trigger) — a ausência é 🟠 em plataforma clínica.

**Compartilhamento com terceiro.** Toda integração que envia dado pessoal para fora
(WhatsApp/Meta, gateway, e-mail transacional, ferramenta de analytics, modelo de IA) precisa
estar declarada na política e ter contrato. Atenção especial a analytics com PII na URL e a
qualquer envio de conteúdo de cliente para API de IA.

**Região de hospedagem.** Onde está o projeto Supabase (`get_project` mostra a região). Fora
do Brasil é permitido, mas é transferência internacional e precisa estar na política —
`sa-east-1` (São Paulo) evita a discussão inteira.

**Segurança técnica compatível** (art. 46): é o resto desta auditoria. Um relatório de
segurança arquivado com data é, ele próprio, evidência de diligência.

**Plano de incidente** (art. 48): quem avisa a ANPD e os titulares, em quanto tempo, com que
texto, e quem decide. Uma página em `docs/` com três parágrafos e os contatos já resolve o
essencial — e é a diferença entre reagir em horas ou em dias.

**Contrato de operador com o cliente.** Cláusula que diga o que a Scalasys pode e não pode
fazer com o dado, o que acontece no fim do contrato (devolução ou eliminação) e prazos. Se não
existir, é o item mais importante da lista para a Scalasys — não para a plataforma.

**Backup e continuidade.** Perda de dado também é incidente. Supabase Free não faz backup
diário; plataforma em operação real com dado de terceiro precisa de plano pago ou rotina
própria de dump.

---

## Como reportar

Não misture com o resto. Seção própria no relatório, cada item como **conforme / lacuna /
não aplicável**, e a lacuna com o que resolve e de quem é a ação (Scalasys ou cliente).
Distinga o que é bloqueante para publicar (dado sensível sem RLS correta, ausência de política
de privacidade) do que é dívida a resolver nas primeiras semanas (registro de acesso, rotina
de retenção).
