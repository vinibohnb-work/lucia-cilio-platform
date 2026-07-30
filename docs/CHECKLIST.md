# Checklist — Correções e Melhorias

> Base: reuniões com a Lúcia (22/07 e 30/07/2026) + itens em aberto de reuniões anteriores.
> Prazo do projeto: início de maio → **início de novembro de 2026** (6 meses).
> Marcar `[x]` à medida que fica resolvido. Cada item tem o **porquê** (contexto da reunião).

**Prioridades definidas pela Lúcia (30/07):** *"CRM e consultoria"* é o foco agora.
A contabilidade *"está excelente como está, é só corrigir o português"*.

---

## 🔴 P1 — Rápidas e de alto impacto (fazer primeiro)

- [ ] **Disclaimer de valores estimados** — nota visível nas páginas com cálculos fiscais:
      *"Valores estimados com base nos lançamentos. Confirme sempre os valores finais com a
      Autoridade Tributária ou com o seu contabilista certificado."*
      **Porquê:** sugestão do Filipe; protege a Lúcia — *"a tua plataforma disse que eu ia pagar isto"*.
      Hoje há notas de estimativa dispersas (Dashboard, Obrigações, Rücklagen) mas sem aviso
      consistente nem referência às finanças/contabilista. Aplicar a: Dashboard, Rücklagen &
      Steuern, Obrigações Fiscais, Precificação, Planeamento Mensal.
- [ ] **Revisão de nomenclatura PT-PT** — rever todos os termos para português de Portugal.
      **Porquê:** *"toda a nomenclatura dos pontos... que seja português daqui"*. ⚠️ A Lúcia
      ficou de fazer esta revisão ("tenho de sentar e ver") — combinar como nos envia as correções.
- [ ] **Revisão da nomenclatura DE e EN** — a seguir à PT.
- [ ] **Inglês = regras de Portugal** — a versão EN deve usar a mesma configuração fiscal/Segurança
      Social de PT (o DE mantém as regras alemãs).
      **Porquê:** *"o inglês eu quero que seja só Portugal... não sou certificada na Inglaterra"*;
      serve os muitos estrangeiros em Portugal. **Verificar** se hoje o EN herda regras erradas.

## 🟠 P2 — CRM (o foco atual)

- [ ] **Campo de origem do lead** (`crm_leads.source`) — Instagram · formulário · site · manual · indicação.
      **Porquê:** base para tudo o resto; a tabela ainda não tem este campo.
- [ ] **Temperatura do lead** (quente/morno/frio) + filtro.
      **Porquê:** *"tipo, olha, este cliente é quente, dá para tu ligar... fazer assim um filtrozinho"*.
- [ ] **Alerta de follow-up** — cartão fica vermelho após N dias sem contacto + notificação
      *"falar com X"*. Guardar data do último contacto.
      **Porquê:** combinado na reunião (exemplo dos 7 dias).
- [ ] **Entrada automática de leads: formulários JotForm / landing page / e-book** → CRM,
      já numa fase definida do funil.
      **Porquê:** ela vai lançar um e-book ("o que fazer depois de abrir atividade") com formulário —
      *"todos estes dados, isto é CRM, não é? São leads"*.
- [ ] **Instagram → CRM**: importar os ~250 seguidores atuais (ela limpa manualmente na plataforma)
      + automação da Meta API com mensagem inicial de abordagem.
      **Porquê:** pedido repetido em duas reuniões. ⚠️ Investigar primeiro o estado atual da API da
      Meta e os custos antes de prometer prazo.
- [ ] **Ranking de "cliente ideal"** — faturação, setor e dor, com ordenação de aderência.
      **Porquê:** conceito do Igor (preço pelo valor agregado) — *"se ajudava muito, é um filtro"*.
- [ ] **Lead "fechado" → contrato no Financeiro** (com valor).
      **Porquê:** *"o que é que passou para cliente, em que valor"*.

## 🟠 P2 — Acessos e equipa

- [ ] **Papel "comercial"** — acesso apenas ao CRM, para a assistente (Carla), que entra na próxima semana.
      **Porquê:** *"é possível ela ter acesso só a esta parte, CRM?"*. Hoje só existem os papéis
      `user` e `admin` — é preciso um terceiro papel com âmbito restrito.
- [ ] **Acesso limitado para o gestor de tráfego (Filipe)** — dados de marketing.
      **Porquê:** *"a gente pode criar uma conta pra eles, dar um acesso limitado"* — mantém os
      dados retidos na base dela mesmo que troque de fornecedor.

## 🟡 P3 — Consultoria e jornada do cliente

- [ ] **Página de Consultoria** — validar com a Lúcia o desenho atual (hoje está focada em documentos).
      **Porquê:** Vinícius ficou de *"mandar para validar contigo"*.
- [ ] **Cliente poder enviar documentos** pela aplicação — hoje o cliente só consegue **ver e
      descarregar** (`DocsBrowser readOnly`); o envio é só do lado do admin.
      **Porquê:** *"os clientes enviarem uma documentação através da aplicação"*.
- [ ] **Guião de reunião** — roteiro base (data, tema, próximos passos, diagnóstico) na ficha do cliente.
      **Porquê:** *"para eu ter um guião básico também, quando eu abro isso"*.
- [ ] **IA nas transcrições** — resumo + próximos passos com datas + checklist para o cliente.
      **Porquê:** foi o que mais a entusiasmou; princípio **human-in-the-loop** — a IA propõe,
      a Lúcia valida (*"eu não quero que seja tudo automatizado"*).
- [ ] **Mapear a jornada do cliente** (documento, antes de automatizar): Instagram/formulário →
      filtro quente/frio → primeiro contacto → **diagnóstico de 20 min** → serviço.
      **Porquê:** *"o meu receio é dispersar... que façamos isto de uma forma organizada"*.
- [ ] **Agendamento do diagnóstico inicial (20 min)** a partir do formulário.

## 🟡 P3 — Gestão interna

- [ ] **Dashboard macro** — próximos pagamentos, pagamentos em aberto, faturação total.
      **Porquê:** *"é mesmo mais na perspetiva comercial"* (controlling comercial).
- [ ] **Anexar contrato (PDF)** ao contrato do Financeiro.
      **Porquê:** *"contratos ficam aqui, qualquer coisa tem acesso"*.
- [ ] **Exportação no formato do Excel dela** — para o que já entrega ao contabilista/IRS.
      ⚠️ Depende do ficheiro que a Lúcia vai enviar.
- [ ] **Limite de faturação (PT)** — o limite já é editável manualmente, mas só existe na versão
      alemã (Familienversicherung). Falta o equivalente português e o rótulo por país.
      **Porquê:** *"em Portugal será o limite da faturação, mas depois eu confirmo melhor"*.
      ⚠️ Depende da confirmação das regras por ela.

## 🔵 P4 — Infraestrutura, dados e segurança

- [ ] **Definir estratégia de backup** — comparar Microsoft (100–200 €/mês para 50 utilizadores)
      com alternativas (AWS / GCP), que tendem a ser mais baratas. Apresentar proposta com custos.
      **Porquê:** *"a questão dos dados, de colocar isto num servidor onde eu tenho toda esta parte
      dos dados protegida"*.
- [ ] **`docs/SEGURANCA_DADOS.md`** — documento de segurança e backup para o projeto jurídico dela.
      ⚠️ Continua à procura de advogada.
- [ ] **Integração de analytics de marketing** (Meta / Google) na plataforma — a alinhar com o Filipe.
- [ ] **Performance** — monitorizar. Já feito o code splitting (arranque −43%); avaliar o plano pago
      do Supabase se os *cold starts* incomodarem nas demonstrações.

## 🟣 Contínuo — Qualidade

- [ ] **Correção de bugs e ajustes menores** encontrados no uso (texto cortado, etc.).
- [ ] **Recolher feedback dos testadores** — pedir sugestões a quem já está a usar.
      **Porquê:** *"pede pra eles fazerem sugestões também"*; ela precisa de *"ouvir opiniões"*.

---

## ⏳ A aguardar da Lúcia (não bloqueia o nosso trabalho)

- [ ] Validação das 28 perguntas ESG com o mentor economista (adiado — ele esteve doente) e com o professor
- [ ] Revisão da nomenclatura PT-PT / DE / EN
- [ ] Confirmação das regras do limite de faturação em Portugal
- [ ] Ficheiro Excel das contas dela + dados de faturação dos 8 clientes
- [ ] Testadores para a plataforma
- [ ] Trazer o **Filipe** (gestor de tráfego) a uma próxima reunião — ele fala com ela na quinta-feira
- [ ] Piloto real de consultoria ESG do zero com o **co-work** (e uma distribuidora)

---

## ✅ Concluído (referência)

- [x] Ciclo ESG completo: diagnóstico multi-ano, dupla materialidade + eixo financeiro,
      projetos com payback, KPIs ao vivo, relatório descritivo com impressão/PDF
- [x] Remoção de todos os dados fictícios (KPIs passaram a usar sempre dados reais)
- [x] Clientes de demonstração (GrünBau · Café Lisboa) com ESG + contabilidade preenchidos,
      incluindo os projetos de frota elétrica e painéis fotovoltaicos
- [x] Acesso simultâneo às duas plataformas (`both`) + toggle no menu, também em "Ver como"
- [x] Performance: code splitting por rota (arranque de 830 kB → 477 kB)
- [x] CRM kanban, Financeiro, Clientes Ativos, ficha do cliente com documentos e histórico
