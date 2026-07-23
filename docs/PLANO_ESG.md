# Plano de Implementação — Plataforma ESG

> Elaborado a partir da reunião com a Lúcia (22/07/2026) + auditoria da estrutura atual.
> Princípios da Lúcia: **descritivo, não analítico** · **o mais simples possível** ·
> **tudo amarrado ao financeiro** ("nenhum administrador implementa se não vir benefício").

## 1. O modelo conceptual (como a Lúcia descreveu o fluxo)

```
Diagnóstico (dados por ano)          "neste momento estamos assim; no ano passado, assados"
        ↓
Dupla Materialidade                  "o que é importante para as duas partes" (5×5 = trabalhar)
        ↓  + eixo financeiro         "destes, qual tem mais impacto financeiro?"
Projetos                             "os projetos devem vir da materialidade"
        ↓  investimento · poupança · payback · impacto esperado
KPIs                                 "dizem se seguimos o plano; em conformidade com a materialidade"
        ↓
Relatório                            "desabafar toda esta questão" — narrativa com os 4 pontos acima
```

O relatório é uma **ajuda à introdução** — a Lúcia escreve por cima, mas quer a estrutura:
1. Dupla materialidade (o que a empresa considera importante, impacto financeiro)
2. Diagnóstico (ano passado → este ano → onde queremos estar)
3. Projetos a implementar (com a relação custo/benefício)
4. KPIs (o resultado do que foi implementado, ou não)

## 2. Revisão da arquitetura atual

| Página | Estado | Problema |
|---|---|---|
| Diagnóstico | ✅ dados reais (`esg_diagnostics`) | Só suporta **1 ano por utilizador** (`unique(user_id)`) — a Lúcia quer 2023/24/25 e "ano passado vs este ano" |
| Materialidade | ✅ dados reais (`esg_materiality`) | Falta o **eixo financeiro** ("mais um matrix"); as metas ainda não alimentam nada |
| KPIs | ⚠️ parcial | Cai em `DEMO_ANSWERS` fictícios; **não é ordenado/filtrado pela materialidade**; sem comparação anual |
| Projetos | ❌ 100% fictício | 4 projetos hardcoded, botão "Novo" inerte, cores fixas (sem tema noturno), conceito errado (parece visão da consultora, deve ser projetos DO cliente) |
| Relatórios | ❌ stub | "Em construção" |

Nada disto exige refazer a arquitetura base (React + Supabase por utilizador + RLS + "Ver como" servem perfeitamente). É **completar o fluxo** e **ligar as pontas**.

## 3. Plano de implementação (fases)

### Fase 1 — Diagnóstico multi-ano
- Migração: `esg_diagnostics` passa de `unique(user_id)` para `unique(user_id, reference_year)`.
- UI: seletor de ano no Diagnóstico (criar novo ano copia o anterior como ponto de partida).
- Base para toda a comparação "ano passado vs este ano" (KPIs e Relatório).

### Fase 2 — KPIs 100% ao vivo + alinhados à materialidade
- Remover `DEMO_ANSWERS` (os clientes demo já têm respostas reais; sem dados → estado vazio com link para o Diagnóstico).
- **Ordenar/agrupar os KPIs pelos temas materiais** (mapa tema→perguntas): os KPIs dos temas do quadrante material aparecem primeiro, destacados; os restantes ficam recolhidos.
- Mostrar as **metas 🎯 da materialidade** junto aos KPIs correspondentes (alvo vs valor atual).
- Comparação anual (Fase 1): variação ▲▼ entre anos de referência.

### Fase 3 — Materialidade: eixo financeiro
- Para os **temas materiais**, acrescentar a dimensão financeira (campos no JSONB, sem migração):
  `financial`: { `impacto` (1–5), `investimento €`, `poupança anual €`, `nota` }.
- Segunda leitura da matriz: lista de prioridades = importância (2 eixos) × impacto financeiro.
- Payback simples calculado quando há investimento + poupança (investimento ÷ poupança anual).
- Mantém-se descritivo — projeções complexas (ex.: painéis solares/ROI) ficam com a Lúcia.

### Fase 4 — Projetos ao vivo (nascem da materialidade)
- Nova tabela `esg_projects`: `user_id`, `topic_key` (tema da materialidade), `name`, `description`,
  `status` (planeado/em curso/concluído), `start_month`, `progress`, `investment`, `annual_saving`,
  `expected_impact` (texto: o que muda no KPI), `created_at`.
- Reescrever `ProjetosESG.jsx`: CRUD real, botão **"Criar projeto"** a partir de um tema material
  (herda tema + meta), cartão com investimento/poupança/payback + impacto esperado, tema claro/noturno, "Ver como".
- As metas da materialidade podem ser promovidas a projeto com 1 clique.

### Fase 5 — Relatório (gerador descritivo)
- `RelatoriosESG.jsx`: documento estruturado com as 4 secções da Lúcia, **pré-preenchido com os dados
  ao vivo** (temas materiais + financeiro, diagnóstico ano X vs Y, projetos, KPIs) e com **campos de
  texto editáveis** por secção (guardados em `esg_reports` — `user_id`, `reference_year`, `sections` JSONB).
- Exportar: versão de impressão limpa (window.print → PDF). Sem IA nesta fase — é a estrutura + dados.

### Fase 6 — Seed de demonstração
- Estender `scripts/seed_demo_esg.mjs`: 2.º ano de diagnóstico (2024) para os dois clientes demo
  (valores ligeiramente piores, para os ▲▼ aparecerem), campos financeiros nos temas materiais,
  2–3 projetos por cliente (GrünBau: frota elétrica + fotovoltaico · Café Lisboa: copos compostáveis + torneiras).

### Ordem e dependências
1 → 2 → (3 ∥ 4) → 5 → 6. As fases 1+2 destravam o "ao vivo"; 3+4 são o coração do modelo da Lúcia; 5 consolida; 6 alimenta a demonstração.

## 4. A validar com a Lúcia
- Escala do impacto financeiro (1–5 chega? ou € desde já?)
- Estados/campos dos projetos (falta algo? responsável? prazo?)
- Estrutura exata das secções do relatório (ela disse que muda os tópicos — quais?)
- Perguntas do diagnóstico: validação pendente com o mentor/professor (~80% ok)

## Anexo — Itens da reunião fora do módulo ESG (backlog)
- Limite lucro/faturação: rótulo por país (DE: Familienversicherung · PT: faturação) + **valor editável manualmente**
- CRM ← Instagram: importação dos ~250 seguidores (limpeza manual pela Lúcia) + tag de origem; automação Meta API depois
- Financeiro: registo manual dos 8 contratos dela (ou import do Excel de faturação DE)
- Consultoria & Histórico: tratar transcrições com IA (resumo + próximos passos acionáveis)
- CRM: ranking "cliente ideal" (faturação, setor, dor) a partir do formulário/JotForm
- Dashboard de gestão (visão macro: pagamentos abertos, faturação, funil)
- Exportação contábil no formato do Excel que a Lúcia usa (ela vai enviar o ficheiro)
