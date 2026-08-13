# Plano de implementação — Módulo de Consultoria

> **Base:** reunião de 13/08/2026 (extração do sistema interno — a transcrição em si não está
> disponível, só os 10 itens de ação, 9 alinhamentos e 5 riscos).
> **Prazo real:** a Lúcia começa a usar com clientes **em setembro**, e tem uma consultoria
> **já amanhã** que gostaria de testar com alguma coisa.

## 1. O que ficou decidido na reunião

| Decisão | Consequência para o desenho |
|---|---|
| A Lúcia acede **como administradora** e regista o contacto/lead **sem criar conta ao cliente** | O módulo vive na **Gestão** e não pode depender de `auth.users` |
| Etapas: **diagnóstico → SWOT → TOWS → projeções → relatório** | Um fluxo por etapas dentro de uma ficha |
| **SWOT/TOWS** substitui "chances e riscos" | O TOWS é *derivado* do SWOT — a interface deve ajudar a derivar |
| Relatório em **PDF** para entregar ao cliente | Vista de impressão, como já se fez no Relatório ESG |
| **Links**, não ficheiros pesados (vídeos, comunidade, Instagram, contactos) | Secção de recursos só com URLs |
| Material da Câmara de Comércio alemã é **referência, não cópia** | O conteúdo do diagnóstico vem do Word dela |
| Simples e utilizável em **telemóvel e computador** | Etapas empilham no telemóvel; ela usa em sessão presencial |

## 2. A questão estrutural (a decisão mais importante)

O que já existe **não serve**: a tabela `consulting_notes` está ligada a `user_id` →
`auth.users`, ou seja, **só funciona para quem já tem conta na plataforma**. A reunião decidiu
exatamente o contrário — registar o contacto **sem criar conta**.

Proposta: tabela própria `consultorias`, com os dados de contacto embutidos e **duas ligações
opcionais**:

- `lead_id` → `crm_leads` — quando a consultoria nasce de um lead que já está no funil
- `user_id` → `auth.users` — preenchido **mais tarde**, se o cliente vier a ter conta

Assim a consultoria funciona sozinha desde o primeiro minuto, e liga-se ao resto quando fizer
sentido. Sem isto, ou se força a criação de conta (contra o que foi decidido), ou a consultoria
fica desligada do CRM e do Financeiro.

## 3. Modelo de dados

```
consultorias
  id · created_at · updated_at
  ── contacto (sem conta) ──
  nome · empresa · email · telefone · setor · notas
  ── ligações opcionais ──
  lead_id → crm_leads      (de onde veio)
  user_id → auth.users     (se/quando virar cliente da plataforma)
  ── estado ──
  fase        diagnostico | swot | tows | projecoes | relatorio | concluida
  ── conteúdo (JSONB, uma linha por consultoria) ──
  diagnostico  respostas do questionário
  swot         { forcas[], fraquezas[], oportunidades[], ameacas[] }
  tows         { so[], wo[], st[], wt[] }   ← cada estratégia guarda de que itens SWOT nasceu
  projecoes    cenários e valores
  recursos     [{ titulo, url, tipo }]
  relatorio    texto editável por secção
```

Uma linha por consultoria, conteúdo em JSONB — o mesmo padrão do `esg_materiality` e do
`esg_reports`, que já provou funcionar aqui.

## 4. Como aparece na plataforma

**Onde:** nova entrada **Consultorias** no menu da **Gestão**, entre Clientes Ativos e CRM.
Admin apenas (o papel `comercial` não vê — é trabalho dela).

### 4.1 Lista de consultorias

Cartões, um por consultoria: nome do contacto e empresa, **etiqueta da fase**, data da última
alteração e uma barra de progresso das 5 etapas. Filtros por fase. Botão **+ Nova consultoria**
pede só nome e empresa — começa-se a trabalhar em 5 segundos, que é o que interessa numa sessão
ao vivo.

### 4.2 Ficha da consultoria — o local de trabalho

Cabeçalho com o contacto e um **stepper de 5 etapas** sempre visível, mostrando onde se está.
No telemóvel o stepper vira uma lista compacta e as etapas empilham.

**① Diagnóstico** — questionário guiado, no formato do Diagnóstico ESG (que já funciona):
pergunta, resposta, progresso `x/n`. ⚠️ *As perguntas vêm do Word dela — sem isso, esta etapa
fica com uma estrutura vazia.*

**② SWOT** — quatro quadrantes num quadro 2×2, com as cores já usadas na plataforma:

```
┌───────────────────────┬───────────────────────┐
│  FORÇAS  (interno +)  │  FRAQUEZAS (interno −)│
│  + adicionar item     │  + adicionar item     │
├───────────────────────┼───────────────────────┤
│ OPORTUNIDADES (ext +) │  AMEAÇAS  (externo −) │
│  + adicionar item     │  + adicionar item     │
└───────────────────────┴───────────────────────┘
```

Cada item é uma linha curta que se escreve e enter. No telemóvel os quadrantes empilham em
coluna, mantendo os rótulos (interno/externo, positivo/negativo).

**③ TOWS** — a etapa que dá o valor. Matriz 2×2 onde **as linhas são o externo** e **as colunas
o interno**, e cada célula cruza os dois:

```
                  FORÇAS              FRAQUEZAS
OPORTUNIDADES  │ SO — atacar     │ WO — melhorar     │
               │ usar força para │ corrigir fraqueza │
               │ agarrar a opor. │ para agarrar opor.│
AMEAÇAS        │ ST — defender   │ WT — proteger     │
               │ usar força para │ reduzir exposição │
               │ mitigar ameaça  │                   │
```

**O que a plataforma faz aqui e o Word não faz:** ao abrir uma célula, ela mostra **os itens do
SWOT que alimentam aquele cruzamento** (na célula SO, as forças e as oportunidades já escritas),
e a Lúcia escreve a estratégia com eles à vista. Cada estratégia **guarda de que itens nasceu** —
é isso que torna o relatório defensável em vez de opinião solta.

**④ Projeções** — cenários lado a lado (ex.: atual · conservador · alvo) com as linhas que ela
usa. ⚠️ *Estrutura a definir com o material dela — não invento indicadores financeiros.*

**⑤ Relatório** — igual ao Relatório ESG, que já está feito e ela conhece: secções
pré-preenchidas com os dados ao vivo (contacto, diagnóstico, SWOT, TOWS, projeções) e **um campo
de texto editável por secção**, mais o botão **🖨 Imprimir / PDF** que gera o documento limpo
para entregar.

**Recursos** — barra lateral com links (vídeos, comunidade, Instagram, contactos), sempre
acessível. Só URLs, sem ficheiros.

## 5. Faseamento

| Fase | O que entra | Depende de |
|---|---|---|
| **0 — para já** | Tabela + lista + ficha + **SWOT e TOWS** completos | Nada |
| **1** | Diagnóstico com as perguntas reais | ⚠️ O Word dela |
| **2** | Projeções | ⚠️ O Word dela |
| **3** | Relatório em PDF | Fases 0–2 |
| **4** | Formulário de consultoria gratuita → cria a consultoria e o lead no CRM | ⚠️ O formulário dela + alinhamento com o Filipe |

**A Fase 0 é entregável sem depender de ninguém** — o SWOT e o TOWS são metodologia padrão, não
precisam do material dela. É o que faz sentido ter pronto para a consultoria de amanhã.

## 6. A decidir com a Lúcia

- **Projeções:** que indicadores? Faturação, custos, margem? Quantos cenários?
- **Diagnóstico:** quantas perguntas e em que blocos? (o ESG tem 28 — serve de referência)
- **Uma consultoria pode virar cliente?** Se sim, um botão "criar acesso à plataforma" que
  transforma o contacto em utilizador e liga o `user_id`.
- **Idiomas:** o resto da plataforma é PT/DE/EN. A consultoria também?
