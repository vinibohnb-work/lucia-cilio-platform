# -*- coding: utf-8 -*-
"""
Guia da plataforma — de onde vem cada número. DOCUMENTO VIVO.

Gera docs/Guia-da-Plataforma-Origem-dos-Dados.pdf: cada ecrã da plataforma com um
print anotado, a origem de cada número e a conta que está por trás; no fim, a
revisão geral (inconsistências, fontes duplicadas, funcionalidades a retirar) que
orienta a simplificação.

REGRA: quem mudar uma fórmula ou um ecrã atualiza a página correspondente aqui,
acrescenta uma linha em REGISTO e volta a gerar:

    python scripts/gera-guia-plataforma.py

Os prints (docs/guia-plataforma/prints) são tirados com dados de exemplo, numa
cópia local da plataforma ligada a uma base de dados falsa — nunca com dados reais.
Dependências: reportlab, pillow.
"""
from datetime import date
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (BaseDocTemplate, Frame, Image, KeepTogether, NextPageTemplate, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)

VERSAO = "1.2"
DATA = date(2026, 10, 1)

# (data, o que mudou na plataforma, o que mudou neste guia) — mais recente primeiro
REGISTO = [
    ("01/10/2026", "Simplificação, fase 1 (com a migração 038): o cliente só altera as obrigações que não são da equipa (R-A1); "
     "regras antigas da ESG retiradas (R-A2); IVA nas despesas recorrentes e nos lançamentos criados do extrato (R-A3); a consultoria "
     "deixa de perder edições, lê \"1.500\" e mantém a origem das estratégias ao apagar pontos da SWOT (R-A6); ano livre no Painel, "
     "Livro de Caixa e Recorrentes, e filtro por ano e mês (R-B1, R-B2); uma régua para obrigações em aberto (R-B3); uma regra de "
     "periodicidade (R-B4); custos fixos do Painel só até ao mês corrente e \"Resultado após reserva\" (R-B5); Familienversicherung pela "
     "média real (R-B6); % de reserva só na Empresa, omissão 25% (R-B8); um ano de referência na ESG (R-B9); Segurança Social só para "
     "independentes (R-B12); sai o gerador de calendário do cliente (R-C3); ficheiros sem uso (R-D1); Recorrentes no menu (R-D2); menu Lite (R-D3); "
     "Moeda e Início do ano fiscal (R-D8); editar no Catálogo e nos Clientes (R-D9).",
     "v1.2: textos e avisos dos ecrãs afetados e estado da revisão. Os prints de Empresa, Obrigações e Reservas ainda são os da v1.0."),
    ("01/10/2026", "A administradora volta a ter a Contabilidade, como demonstração: usa a própria conta (os dados ficam nela e nenhum cliente os vê), com o botão Gestão / Demonstração no menu e uma faixa a indicá-lo. A ESG do cliente continua só pela Visualização completa.", "v1.1: Quem vê o quê."),
    ("01/10/2026", "Correções encontradas durante a revisão: o calendário das sociedades PT (os três pagamentos por conta "
     "tinham o mesmo código e o calendário inteiro falhava); relatórios trimestrais novos não gravavam; apagar "
     "\"Horas incluídas\" dava erro; contratos novos do Financeiro passam a ligar-se à ficha do cliente (pela conta ou "
     "pelo nome), para a avença aparecer na página do cliente.", "Primeira versão do guia."),
    ("30/09/2026", "Todas as páginas usam a largura toda; a administradora vive só na Gestão (sai o botão "
     "Gestão/Contabilidade).", "—"),
    ("29/09/2026", "O portal de gestão de clientes (a antiga v2) passa a ser a Gestão, com dados reais (migração 037).", "—"),
]

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "docs" / "Guia-da-Plataforma-Origem-dos-Dados.pdf"
PRINTS = RAIZ / "docs" / "guia-plataforma" / "prints"

# ── identidade visual (a da plataforma) ─────────────────────────────────────
DEEP = HexColor("#0a2f1a"); GOLD = HexColor("#b8902f"); GOLD_LIGHT = HexColor("#d9c48a")
INK = HexColor("#1f2e25"); MUTED = HexColor("#5a6b61"); PAPER = HexColor("#f5f1e8")
LINE = HexColor("#ddd2ba"); CODE_BG = HexColor("#efe9dc")
ALTA = HexColor("#a3271c"); MEDIA = HexColor("#a26a12"); BAIXA = HexColor("#4f6b5a")
PAGE_W, PAGE_H = A4
MARG = 1.6 * cm
USAVEL = PAGE_W - 2 * MARG

h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=19, leading=24, textColor=DEEP, spaceAfter=6, spaceBefore=4)
h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=DEEP, spaceBefore=10, spaceAfter=4)
kicker = ParagraphStyle("kicker", fontName="Helvetica-Bold", fontSize=8.6, leading=12, textColor=GOLD, spaceAfter=2)
body = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=14.6, textColor=INK, spaceAfter=6)
small = ParagraphStyle("small", fontName="Helvetica", fontSize=8.8, leading=12.2, textColor=INK)
rotulo = ParagraphStyle("rotulo", fontName="Helvetica-Bold", fontSize=7.8, leading=10.5, textColor=GOLD)
codigo = ParagraphStyle("codigo", fontName="Courier", fontSize=7.6, leading=10, textColor=MUTED)
dica = ParagraphStyle("dica", fontName="Helvetica-Oblique", fontSize=9, leading=13, textColor=MUTED, spaceBefore=2, spaceAfter=6)
bullet = ParagraphStyle("bullet", parent=body, leftIndent=12, bulletIndent=2, spaceAfter=3)
num_st = ParagraphStyle("num", fontName="Helvetica-Bold", fontSize=9.5, leading=12, textColor=white, alignment=1)
aviso_st = ParagraphStyle("aviso", fontName="Helvetica", fontSize=8.8, leading=12.4, textColor=INK)


def P(t, e=body):
    return Paragraph(t, e)


def B(t):
    return Paragraph(t, bullet, bulletText="•")


def tabela(cab, linhas, larguras, fundo_primeira_col=False):
    dados = [[Paragraph(c, rotulo) for c in cab]] + [[Paragraph(x, small) for x in l] for l in linhas]
    t = Table(dados, colWidths=larguras, repeatRows=1)
    st = [("BACKGROUND", (0, 0), (-1, 0), PAPER), ("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
          ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
          ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE), ("BOX", (0, 0), (-1, -1), 0.75, LINE)]
    t.setStyle(TableStyle(st))
    return t


def tela(nome, largura=USAVEL, altura_max=None):
    c = PRINTS / f"{nome}.jpg"
    with PILImage.open(c) as im:
        w, h = im.size
    alt = largura * h / w
    if altura_max and alt > altura_max:
        largura, alt = altura_max * w / h, altura_max
    img = Image(str(c), width=largura, height=alt)
    t = Table([[img]], colWidths=[largura], hAlign="CENTER")
    t.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.75, LINE),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return t


def legenda(itens):
    """Legenda numerada: círculo dourado + nome do número + de onde vem e a conta."""
    dados = [[Paragraph(str(n), num_st), Paragraph(f"<b>{nome}</b>", small), Paragraph(como, small)] for n, nome, como in itens]
    t = Table(dados, colWidths=[0.75 * cm, 4.1 * cm, USAVEL - 4.85 * cm])
    st = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
          ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5), ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE)]
    for i in range(len(dados)):
        st += [("BACKGROUND", (0, i), (0, i), GOLD), ("VALIGN", (0, i), (0, i), "MIDDLE")]
    t.setStyle(TableStyle(st))
    return t


def atencao(itens):
    """Caixa "A ter em conta": o que este ecrã faz de diferente ou de errado, com a referência da revisão."""
    linhas = "<br/>".join(f"• {x}" for x in itens)
    t = Table([[Paragraph(f"<font color='#a26a12'><b>A TER EM CONTA</b></font><br/>{linhas}", aviso_st)]], colWidths=[USAVEL])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), HexColor("#fbf3df")), ("BOX", (0, 0), (-1, -1), 0.6, HexColor("#e6cf95")),
                           ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return t


def ecra(kick, titulo, onde, intro, nome, itens, notas=None, altura_max=13.2 * cm):
    """Uma página por ecrã: título, quem vê e onde está, print anotado, legenda e avisos."""
    bloco = [PageBreak(), P(kick, kicker), P(titulo, h1),
             P(f"<font color='#5a6b61' size='8.6'>{onde}</font>", ParagraphStyle('onde', parent=small, spaceAfter=4)),
             P(intro), tela(nome, altura_max=altura_max), Spacer(1, 7), legenda(itens)]
    if notas:
        bloco += [Spacer(1, 7), atencao(notas)]
    return bloco


def capa(canv, doc):
    canv.saveState()
    canv.setFillColor(DEEP); canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    logo = RAIZ / "public" / "logo.png"
    if logo.exists():
        w = 3.2 * cm
        canv.drawImage(str(logo), (PAGE_W - w) / 2, PAGE_H - 6.0 * cm, w, w, mask="auto", preserveAspectRatio=True)
    canv.setStrokeColor(GOLD); canv.setLineWidth(1.1)
    canv.line(MARG, PAGE_H - 7.0 * cm, PAGE_W - MARG, PAGE_H - 7.0 * cm)
    canv.setFillColor(HexColor("#f3ecdb")); canv.setFont("Helvetica-Bold", 25)
    canv.drawCentredString(PAGE_W / 2, PAGE_H / 2 + 2.4 * cm, "Guia da plataforma")
    canv.setFillColor(GOLD_LIGHT); canv.setFont("Helvetica", 13)
    canv.drawCentredString(PAGE_W / 2, PAGE_H / 2 + 1.3 * cm, "De onde vem cada número, ecrã a ecrã")
    canv.setFillColor(HexColor("#c9d3cc")); canv.setFont("Helvetica", 10.5)
    canv.drawCentredString(PAGE_W / 2, PAGE_H / 2 + 0.2 * cm, "Gestão · Plataforma do cliente (Contabilidade) · Consultoria ESG")
    canv.drawCentredString(PAGE_W / 2, PAGE_H / 2 - 0.45 * cm, "e a revisão geral para a simplificação")
    canv.setFillColor(white); canv.setFont("Helvetica-Bold", 11.5)
    canv.drawCentredString(PAGE_W / 2, PAGE_H / 2 - 2.0 * cm, "lucia-cilio-platform.vercel.app")
    canv.setFillColor(GOLD); canv.setFont("Helvetica", 9.5)
    canv.drawCentredString(PAGE_W / 2, 2.6 * cm, "LÚCIA CÍLIO · OFFICE CONSULTING")
    canv.setFillColor(HexColor("#8fa598")); canv.setFont("Helvetica", 8.5)
    canv.drawCentredString(PAGE_W / 2, 2.0 * cm, f"Documento vivo · versão {VERSAO} · {DATA.strftime('%d/%m/%Y')} · acompanha o código da plataforma")
    canv.restoreState()


def rodape(canv, doc):
    canv.saveState()
    canv.setStrokeColor(GOLD_LIGHT); canv.setLineWidth(0.6)
    canv.line(MARG, 1.3 * cm, PAGE_W - MARG, 1.3 * cm)
    canv.setFillColor(MUTED); canv.setFont("Helvetica", 7.8)
    canv.drawString(MARG, 0.9 * cm, f"Lúcia Cílio · Guia da plataforma · v{VERSAO} ({DATA.strftime('%d/%m/%Y')})")
    canv.drawRightString(PAGE_W - MARG, 0.9 * cm, f"{doc.page - 1}")
    canv.restoreState()


doc = BaseDocTemplate(str(SAIDA), pagesize=A4, leftMargin=MARG, rightMargin=MARG, topMargin=1.4 * cm, bottomMargin=1.7 * cm,
                      title="Guia da plataforma · Lúcia Cílio", author="Scalasys · Lúcia Cílio Office Consulting")
frame = Frame(MARG, 1.7 * cm, USAVEL, PAGE_H - 1.4 * cm - 1.7 * cm, id="corpo")
doc.addPageTemplates([PageTemplate(id="capa", frames=[frame], onPage=capa), PageTemplate(id="miolo", frames=[frame], onPage=rodape)])

S = [Spacer(1, 1), NextPageTemplate("miolo"), PageBreak()]

# ═════════════════════════════════════════════════════════════════════════════
# COMO LER
# ═════════════════════════════════════════════════════════════════════════════
S += [P("PARA COMEÇAR", kicker), P("Como ler este guia", h1)]
S.append(P("A plataforma tem <b>três partes</b>, cada uma com o seu menu: a <b>Gestão</b>, onde a Lúcia e a equipa "
           "trabalham a carteira de clientes; a <b>plataforma do cliente</b> (Contabilidade), onde cada cliente "
           "regista o seu negócio; e a <b>Consultoria ESG</b>, que é um serviço da Lúcia feito dentro da Gestão e "
           "que o cliente pode ver em modo de leitura."))
S.append(P("Para cada ecrã há um print anotado. Cada número dourado no print corresponde a uma linha da legenda, "
           "que diz <b>de onde vem o dado</b> e <b>que conta é feita</b>. Quando um ecrã faz algo diferente dos outros, "
           "ou tem um erro conhecido, aparece uma caixa <b>A ter em conta</b> com a referência para a revisão geral "
           "(por exemplo <b>R-B1</b>), no fim do guia."))
S.append(P("É um <b>documento vivo</b>: quando uma regra muda no código, a página correspondente é atualizada e a "
           "mudança entra no registo da última página. Os prints usam <b>dados de exemplo</b> (clientes e valores "
           "inventados), tirados de uma cópia local da plataforma — nunca dados reais."))

S.append(P("Cinco regras valem para quase tudo", h2))
S.append(B("<b>No Livro de Caixa, o valor é sempre bruto (com IVA).</b> O IVA de cada lançamento é calculado quando se grava: "
           "IVA = valor × taxa ÷ (100 + taxa), arredondado a 2 casas. Por isso, quase todos os totais da plataforma do "
           "cliente são brutos. A exceção é o Relatório EÜR, que em regime normal separa o líquido do IVA."))
S.append(B("<b>Os movimentos privados ficam fora do resultado.</b> Privateinlage e Privatentnahme não entram no lucro, no IVA "
           "nem nas reservas — mas entram no saldo do Livro de Caixa (é dinheiro que entrou ou saiu da conta)."))
S.append(B("<b>Um cliente da Gestão não é o mesmo que uma conta na plataforma.</b> A ficha do cliente (tabela "
           "<i>clientes</i>) existe com ou sem conta. Quando tem conta, a ficha liga-se a ela, e o que a equipa marca nas "
           "obrigações aparece ao cliente, e vice-versa."))
S.append(B("<b>\"Em atraso\" é calculado pela data.</b> Uma obrigação ou tarefa que não está fechada e cujo prazo já passou "
           "aparece como em atraso, mesmo que ninguém a tenha marcado assim."))
S.append(B("<b>Hoje é a data do computador.</b> Prazos, \"faltam N dias\" e o mês corrente contam a partir da data de hoje. "
           "Alguns ecrãs ainda usam o ano 2026 escrito no código — está na revisão (R-B1)."))

# ── Mapa ──
S += [PageBreak(), P("PARA COMEÇAR", kicker), P("Quem vê o quê", h1)]
S.append(P("Cada pessoa entra com um perfil. O perfil decide o menu; os dados que cada um pode ler e escrever são "
           "decididos também na base de dados (as regras de acesso), não só no ecrã."))
S.append(tabela(["Perfil", "O que vê", "Notas"], [
    ["<b>Administradora</b> (Lúcia)", "A Gestão: Clientes, Agenda, Tarefas, Relatórios, Mensagens; Consultorias, Consultorias ESG, "
     "Diagnósticos; CRM, Financeiro, Gestão de Acessos. E a <b>Contabilidade de demonstração</b> (botão Gestão / Demonstração no menu).",
     "A demonstração usa a conta dela: o que lança fica lá e nenhum cliente vê — serve para testar e mostrar. A plataforma de um cliente "
     "abre-se pela <b>Visualização completa</b> (separador Conta na plataforma)."],
    ["<b>Comercial</b> (equipa)", "O portal de clientes (Clientes, Agenda, Tarefas, Relatórios, Mensagens), Diagnósticos e CRM.",
     "Não vê a avença, os pagamentos nem a Conta na plataforma. É o perfil pensado para a Letícia (decisão de 25/09)."],
    ["<b>Marketing</b> (equipa)", "O portal de clientes e a página de Marketing (em preparação).", "Ver R-A4: tem mais acesso do que a página diz."],
    ["<b>Cliente — Contabilidade</b>", "Início, Painel, Livro de Caixa, Conciliação, Catálogo, Obrigações Fiscais; Calculadora de Preços, "
     "Planeamento Mensal, Clientes, Empresa, Consultoria e Despesas Recorrentes. Na Alemanha também Reservas &amp; Impostos e Relatório EÜR.", "—"],
    ["<b>Cliente — Contabilidade Lite</b>", "Início, Painel, Livro de Caixa, Despesas Recorrentes, Catálogo, Obrigações Fiscais.", "Sem Conciliação nem a secção Gestão."],
    ["<b>Cliente — ESG</b> ou <b>Ambas</b>", "As seis páginas da ESG em modo de leitura, se a Lúcia marcar o caso como visível. Com \"Ambas\", "
     "alterna entre Contabilidade e ESG.", "Vê o caso ESG mais recente ligado à sua conta."],
], [3.6 * cm, 8.2 * cm, USAVEL - 11.8 * cm]))

S += [PageBreak(), P("PARA COMEÇAR", kicker), P("De onde vêm os dados", h1)]
S.append(P("Cada número sai de uma tabela da base de dados. Esta é a lista das tabelas que interessam, quem as escreve "
           "e quem as lê. É o mapa a ter à mão quando um número parecer estranho."))
S.append(tabela(["Tabela", "O que guarda", "Quem escreve", "Quem lê"], [
    ["<b>clientes</b>", "A ficha de cada cliente da Gestão: perfil fiscal, serviços, estado, responsável, horas incluídas, conta ligada.",
     "Gestão → Clientes, Dados do cliente", "Todo o portal; Financeiro (para ligar contratos)"],
    ["<b>fiscal_obligations</b>", "Obrigações fiscais: prazo, período, estado (8), valor, comprovativo, checklist.",
     "Gestão → Obrigações; cliente → Obrigações Fiscais", "Portal, Início e Obrigações do cliente, sino e menu"],
    ["<b>tarefas</b>", "Tarefas da equipa, com recorrência e lembrete.", "Gestão (Tarefas, Agenda, ficha)", "Gestão"],
    ["<b>documentos_cliente</b>", "Documentos esperados e recebidos por mês, com estado.", "Gestão → Documentos", "Gestão"],
    ["<b>client_notices</b> / <b>mensagens_cliente</b>", "Mensagens ao cliente (aparecem no Início dele) / registo de WhatsApp e contactos.",
     "Gestão → Mensagens", "Início do cliente; Gestão"],
    ["<b>relatorios_trimestrais</b>, <b>notas_cliente</b>, <b>horas_cliente</b>", "Relatório do trimestre; notas internas; horas gastas.",
     "Gestão", "Gestão"],
    ["<b>client_billing</b> / <b>billing_payments</b>", "Contratos (avença) / pagamentos recebidos por período.", "Financeiro; CRM (criar contrato); portal (registar pagamento)",
     "Financeiro, Notas internas, Início do cliente"],
    ["<b>cash_entries</b>", "Livro de Caixa do cliente (valor bruto, IVA, categoria, privado).", "Cliente → Livro de Caixa, Recorrentes, Conciliação",
     "Painel, Reservas, EÜR, Conta na plataforma"],
    ["<b>company_settings</b>", "Dados da empresa do cliente: país, regime de IVA, taxa, % de reserva, Segurança Social.", "Cliente → Empresa; Gestão de Acessos",
     "Quase toda a plataforma do cliente"],
    ["<b>recurring_expenses</b>, <b>catalog_items</b>, <b>monthly_plans</b>, <b>bank_*</b>", "Despesas fixas; catálogo; planeamento; extratos.", "Cliente", "Painel, Livro de Caixa, Reservas"],
    ["<b>crm_leads</b>, <b>diagnostico_submissoes</b>", "Prospeção; respostas do formulário público.", "CRM; formulário /diagnostico", "CRM, Diagnósticos"],
    ["<b>consultorias</b>", "Consultorias de negócio (respostas, SWOT, números, relatório).", "Gestão → Consultorias", "Gestão"],
    ["<b>esg_*</b> (5 tabelas)", "Caso ESG, materialidade, diagnóstico por ano, projetos, textos do relatório.", "Gestão → Consultorias ESG", "ESG, apresentação, área ESG do cliente"],
    ["<b>clients</b>", "\"Os clientes do seu negócio\" — lista que cada cliente mantém. Foi também a lista antiga da Lúcia.", "Cliente → Clientes", "Só esse ecrã (R-D7)"],
], [3.6 * cm, 5.8 * cm, 3.6 * cm, USAVEL - 13.0 * cm]))

# ═════════════════════════════════════════════════════════════════════════════
# PARTE 1 — GESTÃO
# ═════════════════════════════════════════════════════════════════════════════
K = "GESTÃO · PORTAL DE CLIENTES"
S += ecra(K, "Clientes", "Menu Clientes · /gestao/clientes · administradora e equipa",
          "A carteira inteira, com o que precisa de atenção. Clicar no nome abre a página do cliente.", "g-clientes", [
    (1, "Próxima obrigação", "A primeira obrigação do cliente ainda não fechada (fechadas = entregue, pago, não aplicável), pela data. "
     "Pode ser uma já vencida — fica a vermelho. Fonte: <i>fiscal_obligations</i>."),
    (2, "Atenção", "\"N doc. em falta\" = documentos em falta de qualquer ano; \"N tarefas em atraso\" = tarefas por fazer com prazo "
     "anterior a hoje; \"N mensagens\" = mensagens do cliente por ler. Sem nada disto: \"Tudo em dia\"."),
    (3, "Serviço", "Um chip por cada serviço marcado na ficha (Contabilidade, ESG, Consultoria, Organização)."),
    (4, "Estado", "O estado da ficha (Ativo, Onboarding, Pausado, Inativo). É escolhido à mão; não depende da conta."),
    (5, "Responsável", "Quem da equipa acompanha o cliente (texto da ficha)."),
    (6, "+ Novo cliente", "Cria a ficha com o perfil fiscal e gera logo o calendário fiscal do ano corrente. O responsável é quem a criou."),
    (7, "Menu da Gestão", "Clientes · Serviços · Gestão. O número em Tarefas é o de tarefas em atraso (aparece depois de o portal abrir)."),
], ["\"Tudo em dia\" ignora obrigações em atraso — só a coluna Próxima obrigação fica a vermelho (R-B11).",
    "\"N mensagens\" está sempre a zero: o cliente ainda não responde pela plataforma (R-D5)."])

S += ecra(K, "Página do cliente — Resumo", "Clientes → nome do cliente · /gestao/clientes/:id",
          "O cabeçalho tem o perfil do cliente e os três atalhos (WhatsApp, Mensagem, Adicionar tarefa). O Resumo junta o que "
          "importa hoje.", "g-resumo", [
    (1, "Próxima obrigação", "A mesma regra da lista: a primeira não fechada, pela data, com o estado efetivo."),
    (2, "Documentos em falta", "Quantos documentos deste cliente estão \"em falta\", de qualquer ano; por baixo, até dois tipos."),
    (3, "Valor a pagar", "Soma dos valores \"a pagar\" das obrigações em curso ou entregues e ainda não pagas. Ficam de fora as "
     "\"por preparar\" (mesmo vencidas), as pagas e as não aplicáveis. Sem filtro de ano. Só a equipa vê."),
    (4, "Créditos ou reembolsos", "Soma dos créditos e reembolsos cujo <b>prazo</b> cai no ano civil corrente, em qualquer estado. Só a equipa vê."),
    (5, "Último relatório", "O relatório trimestral mais recente marcado como enviado, com a data de envio."),
    (6, "Checklist interna", "Os nove passos da próxima obrigação. Cada clique grava na obrigação."),
    (7, "Próximas tarefas", "As cinco primeiras tarefas por fazer deste cliente."),
    (8, "Comunicação rápida", "O WhatsApp com modelos, já preenchido com a obrigação mais oportuna."),
], ["\"Valor a pagar\" e \"Créditos\" usam regras diferentes (um sem ano e sem as por preparar, o outro pelo ano do prazo e em qualquer estado) — R-B11."])

S += ecra(K, "Página do cliente — Obrigações fiscais", "Separador Obrigações fiscais",
          "O calendário fiscal do cliente, gerado a partir do perfil da ficha, e o trabalho de cada obrigação.", "g-obrigacoes", [
    (1, "Critérios do calendário", "País, forma jurídica, regime, periodicidade, trabalhadores e serviços — todos da ficha (Dados do cliente)."),
    (2, "Gerar calendário", "PT: IVA (mensal ou trimestral, dia 20 do 2.º mês seguinte), Segurança Social trimestral (fim do mês seguinte) "
     "e IRS (30/06 do ano seguinte); sociedades: pagamentos por conta, IRC (31/05) e IES (15/07); DMR se tiver trabalhadores. "
     "DE: USt-VA (dia 10), Lohnsteuer se tiver trabalhadores, Vorauszahlungen (ESt/KSt e GewSt, exceto Freiberufler) e as "
     "declarações anuais (31/07 do ano seguinte). Gerar outra vez não duplica: ignora o mesmo código e a mesma família a ±14 dias."),
    (3, "Em aberto · Em atraso · Entregues · Todas", "Filtros. \"N de M\" — M são as obrigações do ano fiscal escolhido."),
    (4, "Faltam N dias", "Diferença entre o prazo e hoje; \"N dias em atraso\" quando já passou. Só para as não fechadas."),
    (5, "Estado", "Os oito estados do documento. Se o prazo passou e o estado não é fechado, aparece também \"Em atraso\"."),
    (6, "Valor", "Sem valor · A pagar · Crédito · Reembolso, e o montante. Escrito à mão."),
    (7, "Comprovativo", "O ficheiro fica na pasta do cliente; anexar marca \"Comprovativo arquivado\" na checklist."),
    (8, "Processo", "Os sete passos do documento, lidos do que já existe: tarefa ligada, entregue ou declaração submetida, "
     "comprovativo, cliente informado, pago (ou entregue sem valor), arquivo."),
    (9, "Checklist", "Os nove passos marcados à mão; o contador \"x/9\" aparece por baixo do nome."),
], ["Para clientes com conta, um gatilho na base de dados mantém o estado simples do cliente (pendente/feito) em sincronia com os oito estados.",
    "O cliente vê estas obrigações na plataforma dele mas não as altera nem apaga (migração 038). Este é o único gerador de calendário."], altura_max=8.2 * cm)

S += ecra(K, "Página do cliente — Documentos", "Separador Documentos",
          "Os documentos do cliente por ano e mês (ou trimestre), com quatro estados.", "g-documentos", [
    (1, "Receber documento", "Escolhe-se o mês e o tipo e carrega-se o ficheiro. Vai para a pasta do mês do cliente; se havia um \"em falta\" "
     "desse tipo e mês, passa a \"recebido\"."),
    (2, "Enviados pelo cliente", "O que o cliente enviou pela plataforma dele (Empresa → Documentos) nesse mês e ainda não foi classificado. "
     "\"Classificar\" dá-lhe um tipo e passa a contar."),
    (3, "Estado em ANO", "Contagem dos documentos do ano em cada estado: em falta, recebido, em análise, validado. Clicar filtra."),
    (4, "Pedir os documentos deste mês", "Cria como \"em falta\" os esperados: faturas de venda, de compra, extrato e, se tiver trabalhadores, salários."),
    (5, "Por mês · Por trimestre", "Agrupamento da lista; começa conforme a periodicidade do cliente."),
], ["\"Pedir os documentos deste mês\" usa o ano escolhido com o mês atual — a ver 2025, pede para 2025 (R-B11).",
    "O que o cliente envia não cria registo sozinho: fica por classificar (R-C7)."])

S += ecra(K, "Página do cliente — Relatório trimestral", "Separador Relatórios → um trimestre",
          "O resumo do negócio que a Lúcia envia ao cliente por trimestre. Os valores são escritos à mão (a contabilidade "
          "pode estar no TOConline, Lexware ou DATEV).", "g-relatorios-cli", [
    (1, "Faturação, Despesas, IVA, Impostos, Liquidez", "Introduzidos à mão. A liquidez começa com a do trimestre anterior."),
    (2, "Resultado", "Faturação − Despesas. O IVA e os impostos não entram."),
    (3, "Variação", "(atual − anterior) ÷ |anterior|, com o trimestre anterior que exista. Verde se sobe; nas despesas, ao contrário."),
    (4, "Observações e Recomendações", "Texto livre. No PDF só aparecem as linhas e caixas com conteúdo."),
    (5, "Exportar PDF", "Gera o documento para enviar. \"Guardar e marcar como enviado\" regista a data — o cliente ainda não vê relatórios na plataforma."),
])

S += ecra(K, "Página do cliente — Mensagens", "Separador Mensagens",
          "A conversa com o cliente e o WhatsApp com modelos, no mesmo sítio.", "g-mensagens-cli", [
    (1, "Conversa", "Junta duas fontes: as mensagens que o cliente vê no Início da plataforma dele e o registo de WhatsApp e de contactos."),
    (2, "· lida", "Aparece quando o cliente marcou a mensagem como lida no Início."),
    (3, "Escrever", "Com conta: a mensagem vai para o Início do cliente (1.ª linha = título). Sem conta: fica registada aqui como nota de contacto."),
    (4, "WhatsApp com modelo", "Seis modelos do documento. A obrigação proposta é a primeira em curso com valor; senão a última entregue; senão a próxima."),
    (5, "Rever e enviar", "Abre o WhatsApp com o texto, regista-o na conversa e marca \"Cliente informado\" na checklist."),
], ["No modelo, \"prazo de pagamento\" é o prazo da declaração — no IVA PT o pagamento vence noutro dia (R-B11)."])

S += ecra(K, "Página do cliente — Dados do cliente", "Separador Dados do cliente",
          "O perfil do cliente, mantido pela equipa. É ele que decide o calendário fiscal.", "g-dados", [
    (1, "Identificação e contactos", "Nome, pessoa, setor, e-mail, telefone (usado no WhatsApp), estado."),
    (2, "Perfil fiscal", "País, forma jurídica, regime, periodicidade, software, trabalhadores. Mudar exige gerar o ano outra vez (não duplica)."),
    (3, "Serviços contratados", "Decide o que se gera: sem Contabilidade, não há calendário fiscal nem relatórios trimestrais."),
    (4, "Gestão interna", "Responsável, horas incluídas por mês, cliente desde."),
    (5, "Avença", "Lida do contrato ativo do Financeiro ligado a esta ficha. Só leitura; muda-se no Financeiro. Só a administradora vê."),
    (6, "Conta na plataforma", "Liga a ficha à conta do cliente. Ao ligar, as obrigações da conta aparecem aqui e as daqui passam a aparecer ao cliente."),
], ["Os campos gravam a cada tecla — dois pedidos seguidos podem chegar fora de ordem (R-B11).",
    "Trocar o país não limpa a forma jurídica e o regime (R-B11).",
    "O lado do cliente tem o seu próprio país e regime (Empresa); os dois não se sincronizam (R-C2)."])

S += ecra(K, "Página do cliente — Notas internas", "Separador Notas internas 🔒 · nunca visível ao cliente",
          "O caderno da equipa sobre este cliente.", "g-notas", [
    (1, "Notas, dúvidas e contactos", "Nota, dúvida, contacto, ou assunto a esclarecer com contabilista, Steuerberater ou advogado."),
    (2, "Pendentes", "Dúvidas e assuntos a esclarecer ainda não resolvidos."),
    (3, "Responsável e serviços", "Quem acompanha, desde quando, e os serviços."),
    (4, "Horas utilizadas", "Horas registadas no mês corrente, face às incluídas (barra vermelha se passar). \"Últimos 30 dias\" conta desde o mesmo dia do mês anterior."),
    (5, "Controlo da avença", "Os seis últimos períodos devidos segundo o contrato (início e periodicidade). \"Pago\" se houver pagamento nesse período; "
     "\"Registar\" grava o pagamento no Financeiro, com o valor total da avença. Só a administradora vê."),
])

S += ecra(K, "Página do cliente — Conta na plataforma", "Separador Conta na plataforma 🔒 · só administradora, só clientes com conta",
          "O que o cliente faz na plataforma dele. Era a antiga ficha de Clientes Ativos.", "g-conta", [
    (1, "Visualização completa", "Abre a plataforma exatamente como o cliente a vê, em leitura."),
    (2, "Receita (ano)", "Soma das entradas do Livro de Caixa do cliente no ano corrente, sem privados (bruto)."),
    (3, "Saldo", "Entradas − saídas de sempre, sem privados. (No Livro de Caixa o saldo inclui os privados — R-B5.)"),
    (4, "Obrigações pendentes", "Obrigações da conta com estado \"pendente\", incluindo as futuras."),
    (5, "Clientes", "Quantos clientes <b>do cliente</b> estão na lista dele (Contabilidade → Clientes)."),
    (6, "Lucro / limite (mês)", "Só Alemanha: lucro mensal real (média do ano) ÷ limite da Familienversicherung — a mesma regra do Painel e de Reservas. 🔴 acima, 🟡 a partir de 80%."),
    (7, "Onboarding", "Seis passos lidos do que existe: conta, dados da empresa, contrato anexado, mensagem enviada, primeiro acesso, primeiros documentos."),
    (8, "Consultoria e Histórico", "Registos de reuniões, notas, recomendações e relatórios. <b>São visíveis ao cliente</b> na página Consultoria."),
], ["\"Conta ativa\" usa também o e-mail confirmado — e todas as contas nascem confirmadas, por isso aparecem sempre ativas (R-B11)."])

S += ecra(K, "Agenda", "Menu Agenda · /gestao/agenda",
          "Tarefas e prazos fiscais de todos os clientes, por dia, semana ou mês.", "g-agenda", [
    (1, "Dia · Semana · Mês", "Vista. No mês, até três itens por dia e \"+N mais\"; clicar num dia abre-o."),
    (2, "Filtros", "Cliente, país e responsável (nas obrigações, o responsável é o da ficha do cliente)."),
    (3, "Prazos fiscais", "Liga ou desliga as obrigações; \"Mostrar concluídas\" inclui o que já está fechado."),
    (4, "Legenda", "📅 prazo fiscal · ✓ tarefa · vermelho = em atraso (tarefa vencida ou obrigação em atraso pela data)."),
])

S += ecra(K, "Tarefas", "Menu Tarefas · /gestao/tarefas",
          "O trabalho da equipa, de todos os clientes. As tarefas recorrentes criam a seguinte quando se concluem.", "g-tarefas", [
    (1, "Tarefas de hoje", "Tarefas por fazer com prazo hoje."),
    (2, "Próximos prazos", "Tarefas com prazo de amanhã a +7 dias, mais obrigações não fechadas de hoje a +7 dias."),
    (3, "Em atraso", "Tarefas por fazer com prazo anterior a hoje (não conta obrigações)."),
    (4, "Documentos em falta", "Todos os documentos em falta, de todos os clientes."),
    (5, "Prazo", "\"N dias em atraso\", \"hoje\" ou \"daqui a N dias\". 🔔 aparece quando faltam menos dias do que o lembrete."),
], ["\"Próximos prazos\" conta tarefas a partir de amanhã e obrigações a partir de hoje; o filtro \"7 dias\" inclui hoje (R-B11).",
    "O lembrete é só a etiqueta 🔔 — nada é enviado (R-D11)."])

S += ecra(K, "Relatórios", "Menu Relatórios · /gestao/relatorios",
          "Quem já recebeu o relatório trimestral. Só clientes com o serviço Contabilidade.", "g-relatorios", [
    (1, "Trimestres", "Os quatro últimos; o primeiro está \"a decorrer\"."),
    (2, "Estado por trimestre", "Enviado / Rascunho se existir; senão \"Por fazer\" nos trimestres passados e \"—\" no corrente."),
    (3, "Último resultado", "Faturação − despesas do último relatório enviado."),
], ["\"Por fazer\" aparece também em trimestres anteriores à entrada do cliente (R-B11)."], altura_max=8 * cm)

S += ecra(K, "Mensagens", "Menu Mensagens · /gestao/mensagens",
          "As conversas de todos os clientes; à direita, a conversa e o WhatsApp do cliente escolhido.", "g-mensagens", [
    (1, "Lista", "Ordenada pela data da última mensagem. \"Tu:\" antes das mensagens da equipa, seja quem for que escreveu."),
    (2, "Página do cliente", "Abre a ficha do cliente."),
], altura_max=10 * cm)

K = "GESTÃO · SERVIÇOS"
S += ecra(K, "Consultorias", "Menu Consultorias · /gestao/consultorias · só administradora",
          "As consultorias de negócio (Implementação de negócio ou Gratuita), com o progresso pelos quatro blocos.", "g-consultorias", [
    (1, "Blocos", "Quatro barras: percentagem preenchida de cada bloco."),
    (2, "Progresso", "\"Bloco N · feitas/36\". N é o último bloco aberto na ficha. As 36 peças: 18 perguntas do bloco 1; 5 perguntas e os 4 "
     "quadrantes SWOT do bloco 2; 6 tabelas do bloco 3; 3 tabelas do bloco 4. Uma tabela conta quando tem pelo menos um valor."),
    (3, "Filtros", "Ativa · Concluída · Pausada · Todas. O estado é escolhido à mão."),
], altura_max=7 * cm)

S += ecra(K, "Consultoria — ficha", "Consultorias → Abrir · /gestao/consultorias/:id",
          "O trabalho da consultoria, bloco a bloco. Grava sozinha 0,7 s depois da última alteração.", "g-consultoria", [
    (1, "Enquadramento", "As respostas do formulário de diagnóstico (país, atividade, regime, IVA, faturação, contabilista, dificuldade)."),
    (2, "x/7", "Campos do enquadramento preenchidos (sem contar a data de início)."),
    (3, "+ Juntar ao CRM", "Cria um lead no CRM com estes dados."),
    (4, "Relatório", "Gera o relatório com IA a partir do que está preenchido; o texto editado à mão sobrepõe-se ao da IA."),
], ["Números do plano (lib/consultoriaCalc): retirada privada = despesas − rendimentos (mín. 0), ×12 no ano; necessidade de capital = "
    "investimentos + constituição + reserva (reserva = custos do ano 1 ÷ 12 × meses); lucro por ano = receitas − custos; liquidez = saldo acumulado mês a mês.",
    "Grava sozinha 0,7 s depois da última alteração, juntando tudo o que mudou, e ao sair da página. Lê números como se escrevem (\"1.500\", \"1.500,50\")."])

S += ecra(K, "Diagnósticos", "Menu Diagnósticos · /gestao/diagnosticos · administradora e comercial",
          "As respostas do formulário público /diagnostico. A triagem decide o que sobe ao CRM.", "g-diagnosticos", [
    (1, "Ligação do formulário", "O endereço público para partilhar."),
    (2, "Novos · No CRM · Descartados · Todas", "Contagem por estado."),
    (3, "Qualificado / Abaixo do corte", "Triagem: país PT ou DE obrigatório; pontos — atividade iniciada ou a planear +2 (não +1), quer mudar de "
     "contabilista +3 (sem contabilista +2), faturação ≥ 1.000 €/mês +2, dificuldade indicada +1. Qualificado com 4 ou mais."),
    (4, "Respostas", "As respostas tal como foram dadas."),
    (5, "+ Juntar ao CRM", "Cria o lead (faturação mensal convertida em banda anual; dor = dificuldade; origem = diagnóstico)."),
], ["A triagem é calculada no browser de quem responde — pode ser forjada, e mudar os pesos não recalcula as antigas (R-A5)."], altura_max=7 * cm)

K = "GESTÃO"
S += ecra(K, "Prospeção (CRM)", "Menu Prospeção (CRM) · /gestao/crm · administradora e comercial",
          "O funil da prospeção: os cartões arrastam-se entre as etapas.", "g-crm", [
    (1, "Sem contacto há 7+ dias", "Leads entre Mapeado e Proposta cujo último contacto (ou última edição) foi há 7 dias ou mais."),
    (2, "Etapas", "Mapeado, Em abordagem, Conectado, Reunião, Proposta, Fechado, Perdido (pede motivo), Futuro. O número é o de cartões visíveis."),
    (3, "★ Perfil", "Pontuação 0–100: faturação anual (4 a 40), temperatura (quente 25, morno 12), setor alvo (construção, imobiliário, engenharia, "
     "arquitetura, indústria: 20), dor preenchida (15). Verde a partir de 70; os cartões ordenam-se por ela."),
    (4, "⏱ há N dias", "Dias desde o último contacto registado (\"✓ Registar contacto\")."),
    (5, "+1 tentativa", "Conta tentativas na etapa Em abordagem."),
], ["Em Fechado, \"Criar contrato\" e \"Criar acesso\" não criam a ficha do cliente na Gestão (R-C1).",
    "Leads vindos do diagnóstico perdem a origem quando são editados (R-B11)."], altura_max=10 * cm)

S += ecra(K, "Financeiro", "Menu Financeiro · /gestao/financeiro · só administradora",
          "Os contratos (avenças) e o que se recebeu em cada mês.", "g-financeiro", [
    (1, "Previsto (mês)", "Soma dos contratos ativos devidos no mês. Devido: mensal sempre; trimestral de 3 em 3 meses a partir do início; "
     "anual de 12 em 12; único só no mês de início. Nunca antes do início."),
    (2, "Recebido (mês)", "Soma dos pagamentos registados nesse mês, dos contratos devidos."),
    (3, "Por receber", "Contratos devidos sem pagamento registado."),
    (4, "Contratos ativos", "Quantos contratos estão ativos, devidos ou não neste mês."),
    (5, "Recebimentos do mês", "\"Confirmar\" regista o pagamento (com o valor escrito, ou o contratado); \"Recebido ✓\" desfaz."),
    (6, "Contratos", "Cliente, conta da plataforma (opcional), serviço, valor, periodicidade, início, PDF do contrato. Desde 01/10, ao gravar, "
     "o contrato liga-se à ficha do cliente (pela conta ou pelo nome) — é daí que a página do cliente lê a avença."),
], ["O pagamento também pode ser registado em Notas internas → Controlo da avença (sempre com o valor total) — R-C5."], altura_max=12 * cm)

S += ecra(K, "Gestão de Acessos", "Menu Gestão de Acessos · /gestao/acessos · só administradora",
          "As contas da plataforma: clientes e equipa.", "g-acessos", [
    (1, "Plataforma", "Contabilidade, Contabilidade Lite, ESG ou Ambas — decide o menu do cliente."),
    (2, "Perfil", "Cliente, Administradora, Comercial ou Marketing."),
    (3, "Último acesso", "Sem acesso aparece \"pendente\"."),
    (4, "+ Novo Utilizador", "Cria a conta com palavra-passe temporária (obrigatório mudar no primeiro acesso). País e serviço vão para os dados da empresa."),
], ["Criar uma conta não cria a ficha do cliente na Gestão — liga-se depois em Dados do cliente (R-C1).",
    "Os rótulos \"Comercial (só CRM)\" e \"Marketing (só Marketing)\" estão desatualizados (R-A4)."], altura_max=7 * cm)

# ═════════════════════════════════════════════════════════════════════════════
# PARTE 2 — ESG
# ═════════════════════════════════════════════════════════════════════════════
S += [PageBreak(), P("CONSULTORIA ESG", kicker), P("Como a ESG calcula o progresso", h1)]
S.append(P("Cada empresa é um <b>caso</b>. A Lúcia preenche; o cliente pode ver em leitura. O progresso tem cinco fases, "
           "e cada fase está <b>por começar</b> (nada feito), <b>em curso</b> ou <b>pronta</b> (tudo feito)."))
S.append(tabela(["Fase", "O que conta como feito", "Total"], [
    ["1 · Materialidade", "Temas decididos: marcados \"não se aplica\", ou aplicáveis com nota de stakeholders e de empresa.", "16 temas"],
    ["2 · Diagnóstico", "Perguntas respondidas (\"não consigo responder\" também conta; num grupo basta um campo).", "28 perguntas"],
    ["3 · Indicadores", "Indicadores principais com valor: CO₂, eletricidade renovável, água, reciclagem, colaboradores, % de mulheres, "
     "horas de formação e maturidade de governança (esta só se houver respostas de governança).", "8"],
    ["4 · Projetos", "Temas materiais com pelo menos um projeto. Sem temas materiais, a fase fica \"à espera\".", "nº de temas materiais"],
    ["5 · Relatório", "Secções de texto do relatório preenchidas.", "4"],
], [3.4 * cm, 10.6 * cm, USAVEL - 14.0 * cm]))
S.append(Spacer(1, 6))
S.append(P("<b>Progresso geral</b> = média das cinco percentagens (uma fase à espera vale 0). <b>Próximo passo</b> = a primeira fase "
           "por começar ou em curso. <b>Tema material</b> = aplicável e com as duas notas iguais ou acima do limiar (3,5 por omissão)."))
S.append(P("<b>Maturidade de governança</b> = (respostas \"Sim\" + metade das \"Planeado\") nas perguntas 20 a 28 ÷ 9. <b>Payback</b> = "
           "investimento ÷ poupança anual (só com os dois valores)."))
S.append(atencao(["Todos os ecrãs usam o mesmo ano de referência: o mais recente com diagnóstico preenchido (sem nenhum, o ano corrente).",
                  "Se nenhum tema for material e o resto estiver pronto, o Percurso diz que está tudo fechado com 80% (R-B10)."]))

K = "CONSULTORIA ESG"
S += ecra(K, "Consultorias ESG", "Menu Consultorias ESG · /gestao/esg · só administradora",
          "Um caso por empresa. Abrir leva ao caso, num separador próprio, com o menu da ESG.", "e-lista", [
    (1, "Fases", "Cinco barras, uma por fase (verde quando pronta), no ano de referência de cada caso."),
    (2, "Próximo passo", "A fase seguinte e o progresso geral."),
    (3, "Conta", "O caso está ligado a uma conta de cliente."),
], altura_max=6 * cm)

S += ecra(K, "Percurso", "Caso → Percurso · /gestao/esg/:id/percurso",
          "A página de entrada do caso: em que fase está e o que vem a seguir. Na tira de cima, o estado do caso e a visibilidade para o cliente.", "e-percurso", [
    (1, "Progresso geral", "Média das cinco fases, no ano de referência do caso (o mais recente com diagnóstico; sem nenhum, o corrente)."),
    (2, "Próximo passo", "A primeira fase por começar ou em curso."),
    (3, "feitas/total", "Por fase, com a percentagem (regras na página anterior)."),
    (4, "Projetos", "\"a de b temas materiais com projeto\"."),
    (5, "Modo apresentação", "Abre a página para mostrar ao cliente (ver Apresentação)."),
    (6, "O cliente vê", "Liga ou desliga a área ESG do cliente (só com conta ligada)."),
], ["A etiqueta diz \"percurso e relatório\", mas o cliente vê as seis páginas, incluindo notas e valores financeiros por tema (R-B10).",
    "O contacto e a conta do caso não se podem editar depois de criado (R-D10)."])

S += ecra(K, "Materialidade", "Caso → Materialidade",
          "Dupla materialidade: cada tema pontuado de 1 a 5 do ponto de vista dos stakeholders e da empresa.", "e-materialidade", [
    (1, "Pontuados x/16", "Temas aplicáveis com as duas notas. (Os \"não se aplica\" não contam aqui, mas contam no Percurso — R-B10.)"),
    (2, "Limiar", "2,5 · 3 · 3,5 · 4. Grava logo. Com notas inteiras, só há dois comportamentos reais (≥3 ou ≥4)."),
    (3, "Matriz", "Eixo horizontal = empresa; vertical = stakeholders. O canto superior direito, acima do limiar nos dois, é material."),
    (4, "Temas materiais", "Os que passam o limiar, ordenados pela soma das notas, com a meta e o financeiro de cada um."),
    (5, "Payback", "Investimento ÷ poupança anual do tema."),
], ["As notas só gravam com \"Guardar\"; o limiar, as metas e o financeiro gravam logo (R-D10)."])

S += ecra(K, "Diagnóstico", "Caso → Diagnóstico ESG",
          "O questionário (28 perguntas, Creditreform Advanced) que alimenta todos os números da ESG.", "e-diagnostico", [
    (1, "Respondidas x/28", "Perguntas com resposta, incluindo \"não consigo responder\"."),
    (2, "Ano de referência", "Abre no ano mais recente gravado. \"+\" cria o ano seguinte copiando as respostas do ano aberto."),
    (3, "Ambiente · Social · Governança", "x/10 · x/7 · x/11 respondidas."),
    (4, "Não consigo responder", "Informação indisponível ou pergunta pouco clara — conta como respondida."),
], ["O novo ano nasce com as respostas do anterior; gravar sem rever deixa números velhos e o delta a zero (R-C6)."])

S += ecra(K, "KPIs e Monitorização", "Caso → KPIs & Monitorização · só leitura",
          "Os indicadores lidos do diagnóstico, comparados com o ano anterior com dados.", "e-kpis", [
    (1, "Temas materiais e metas", "Os temas materiais, com a meta e o prazo."),
    (2, "Emissões de CO₂", "A pergunta 5, total (escrito à mão — não é a soma dos scopes). Menos é melhor."),
    (3, "Colaboradores", "Pergunta 11 (FTE)."),
    (4, "Eletricidade renovável", "% da pergunta 2; por baixo, o consumo total em kWh."),
    (5, "Maturidade de governança", "(Sim + ½ Planeado) das perguntas 20–28 ÷ 9."),
    (6, "Preenchimento", "Perguntas respondidas por pilar."),
    (7, "Emissões por scope", "Fatias proporcionais aos scopes 1, 2 e 3; no centro, o total da pergunta 5."),
], ["Deltas = valor atual − valor do ano anterior mais próximo com dados, sem conferir unidades (R-B10).",
    "Aqui a maturidade aparece a 0% sem respostas de governança; no Relatório e na Apresentação fica escondida (R-B10).",
    "\"Rotatividade\" é o número de saídas, não uma taxa; o gap salarial tem o sinal ao contrário do habitual (R-B10)."])

S += ecra(K, "Projetos", "Caso → Projetos ESG",
          "As ações que nascem dos temas materiais, sempre com custo e benefício.", "e-projetos", [
    (1, "Investimento total", "Soma do investimento de todos os projetos, em qualquer estado."),
    (2, "Poupança/ano", "Soma da poupança anual de todos os projetos."),
    (3, "em curso · concluídos", "Contagem por estado."),
    (4, "Payback", "Investimento ÷ poupança anual do projeto."),
], ["Criado a partir da Materialidade, o projeto copia o investimento e a poupança do tema uma vez; depois os dois podem divergir (R-C6)."])

S += ecra(K, "Relatório de Sustentabilidade", "Caso → Relatórios ESG",
          "Quatro secções de texto e as tabelas geradas dos outros módulos; imprime em PDF só o que tem conteúdo.", "e-relatorio", [
    (1, "1. Dupla Materialidade", "Tabela dos temas materiais (notas, impacto financeiro, meta)."),
    (2, "2. Diagnóstico", "Respondidas por pilar e o ano comparado."),
    (3, "3. Projetos", "Nome, estado e progresso, investimento, poupança."),
    (4, "4. KPIs", "Oito indicadores, ano e ano anterior. \"Água (m³)\" mostra o valor seja qual for a unidade gravada."),
    (5, "Imprimir / PDF", "Gera o documento; o nome da empresa vem dos dados da empresa da conta ligada ou, sem conta, do caso."),
], altura_max=12 * cm)

S += ecra(K, "Modo apresentação", "Caso → Modo apresentação ↗ · /apresentacao/esg/:id",
          "Uma página limpa, sem menus, para mostrar ao cliente ou imprimir. Só leitura.", "e-apresentacao", [
    (1, "O percurso", "Progresso geral, as cinco fases e o próximo passo — do ano escolhido."),
    (2, "O que importa", "A matriz e os temas materiais com meta e payback do tema."),
    (3, "Os números", "CO₂, renovável, colaboradores, % de mulheres, governança — só os que têm valor, com a variação."),
    (4, "O plano", "Todos os projetos, com payback do projeto."),
    (5, "Ano de referência", "O mais recente com diagnóstico; o seletor aparece com mais de um ano."),
], ["Os textos escritos no Relatório não aparecem aqui (R-D8)."], altura_max=14.5 * cm)

# ═════════════════════════════════════════════════════════════════════════════
# PARTE 3 — CONTABILIDADE DO CLIENTE
# ═════════════════════════════════════════════════════════════════════════════
K = "PLATAFORMA DO CLIENTE · CONTABILIDADE"
S += ecra(K, "Início", "Menu Início · /contabilidade/inicio · a página de entrada do cliente",
          "Três perguntas: o que a Lúcia me disse, o que vence a seguir, o que tenho a pagar.", "c-inicio", [
    (1, "Mensagens da Lúcia", "As cinco últimas mensagens enviadas pela equipa (Gestão → Mensagens). \"Marcar como lido\" avisa a equipa."),
    (2, "Próxima obrigação fiscal", "A obrigação pendente mais antiga — uma em atraso aparece aqui primeiro, a vermelho."),
    (3, "Próximo pagamento", "O contrato ativo da conta (Financeiro): o primeiro mês devido sem pagamento registado, até 24 meses à frente."),
    (4, "Documentos deste mês", "Atalho para enviar documentos (Empresa)."),
    (5, "Menu do cliente", "Contabilidade e Gestão; na Alemanha também Reservas e EÜR."),
], ["O contrato é procurado pela conta; um contrato ligado só à ficha da Gestão não aparece (R-C8)."])

S += ecra(K, "Painel", "Menu Painel · /contabilidade/dashboard",
          "Como está o negócio: entradas, saídas, resultado, IVA, reserva e break-even. Anual ou por trimestre.", "c-painel", [
    (1, "Receita", "Soma das entradas do período, sem privados (bruto, com IVA)."),
    (2, "Custos Fixos", "Saídas de categorias fixas e sem categoria + as despesas recorrentes devidas <b>até ao mês corrente</b> e ainda não confirmadas. Os meses futuros ficam no gráfico e no aviso \"!\", não no resultado."),
    (3, "Custos Variáveis", "Saídas de categorias variáveis (material, marketing…)."),
    (4, "Resultado do ano", "Receita − (fixos + variáveis)."),
    (5, "IVA", "Liquidado (IVA das entradas) − dedutível (IVA das saídas) = a entregar ou a recuperar."),
    (6, "Reserva para IR", "Resultado (mín. 0) × % de reserva da Empresa (25% se não houver). O 3.º cartão é o \"Resultado após reserva\"."),
    (7, "Aviso Familienversicherung", "Só Alemanha: lucro médio mensal real do ano ÷ limite (Reservas); aparece a partir de 80%."),
    (8, "Fluxo de caixa por mês", "Entradas e saídas brutas por mês; por cima, o previsto das recorrentes."),
    (9, "Break-even", "Margem de contribuição = (receita − variáveis) ÷ receita; ponto de equilíbrio = fixos ÷ margem."),
    (10, "Receita por produto", "Entradas agrupadas pelo produto do catálogo; o peso é a parte da receita."),
], ["Ano: o corrente por omissão, com seletor dos anos com lançamentos.",
    "A reserva é calculada sobre o resultado bruto (com o IVA por pagar) — falta decidir com a Lúcia (R-B5)."], altura_max=10.8 * cm)

S += ecra(K, "Painel — clientes em Portugal", "Painel → Trimestral, só fora da Alemanha",
          "Na vista trimestral aparece a estimativa da Segurança Social.", "c-painel-pt", [
    (1, "Base Segurança Social", "Rendimento do trimestre = receita bruta; base de incidência = 70%; contribuição estimada = base × 21,4%."),
], ["Não aparece a sociedades (regime \"Sociedade\" na Empresa). Aplica 70% a toda a receita, incluindo venda de bens."], altura_max=12 * cm)

S += ecra(K, "Livro de Caixa", "Menu Livro de Caixa · /contabilidade/caixa",
          "Todos os movimentos da empresa. É a fonte de quase todos os números do cliente.", "c-caixa", [
    (1, "Saldo Atual", "Entradas − saídas da lista filtrada, <b>incluindo</b> os privados. Com um mês escolhido é o saldo desse mês."),
    (2, "Total Entradas", "Soma das entradas filtradas (com Privateinlage)."),
    (3, "Total Saídas", "Soma das saídas filtradas (com Privatentnahme)."),
    (4, "Saídas previstas", "Despesas recorrentes devidas e ainda não confirmadas (o mês escolhido, ou os 12 meses)."),
    (5, "Em Caixa", "Saldo dos movimentos com destino Caixa."),
    (6, "No Banco", "Saldo dos movimentos com destino Banco."),
], ["Valor sempre bruto; o IVA de cada linha = valor × taxa ÷ (100 + taxa).",
    "Filtra-se por ano (o corrente por omissão, ou todos) e por mês dentro do ano."])

S += ecra(K, "Conciliação", "Menu Conciliação · /contabilidade/conciliacao",
          "Importa o extrato bancário e cruza-o com o Livro de Caixa.", "c-conciliacao", [
    (1, "Escolher ficheiro", "CSV ou Excel; o formato é detetado. Linhas repetidas não entram duas vezes."),
    (2, "Extratos importados", "Período e linhas de cada extrato."),
    (3, "Por conciliar · Conciliados · Ignorados", "Movimentos do extrato por estado. Sugestão automática: mesmo sentido, mesmo valor (±0,01 €), "
     "até 7 dias; 60 pontos + data (25 mesmo dia, 15 até 2 dias, 5) + até 15 pela semelhança das palavras. ⚡ automática com 85 ou mais."),
    (4, "Não constam do extrato", "Lançamentos de banco sem par no extrato."),
    (5, "Criar lançamento", "Cria a linha no Livro de Caixa a partir do extrato."),
], ["\"Não constam do extrato\" conta lançamentos de todas as datas, mesmo fora do período importado (R-B11).",
    "\"Criar lançamento\" pede a taxa de IVA (por omissão a da empresa); a categoria escolhe-se depois no Livro de Caixa."], altura_max=9.5 * cm)

S += ecra(K, "Despesas Recorrentes", "Menu Despesas Recorrentes · /contabilidade/recorrentes",
          "Os custos fixos do mês: define-se o modelo e confirma-se o valor real em cada mês.", "c-recorrentes", [
    (1, "Confirmar este mês", "Os modelos devidos no mês, com a regra do Financeiro: mensal sempre; trimestral de 3 em 3 meses e anual de 12 em 12, a contar do início. Confirmar cria a saída no Livro de Caixa, com o IVA do modelo (ou o da empresa)."),
    (2, "Previsto (por confirmar)", "Soma dos devidos ainda não confirmados — é o que o Painel soma aos custos fixos."),
    (3, "Confirmado", "Soma do que já foi confirmado no mês."),
    (4, "Modelos", "Descrição, categoria, valor, periodicidade, dia, início e fim."),
], ["Está no menu, a seguir ao Livro de Caixa (também no Lite)."], altura_max=9.5 * cm)

S += ecra(K, "Calculadora de Preços — Evento", "Menu Calculadora de Preços · /contabilidade/precificacao · nada é gravado",
          "Quatro calculadoras: Evento/Catering, Serviço por hora, Produto/Revenda e Tratamento.", "c-precos", [
    (1, "Custo do menu", "Adultos × preço + crianças × preço × 50%."),
    (2, "Margem de lucro", "Aqui é um acréscimo sobre o custo: custos × (1 + margem)."),
    (3, "Reserva IR", "Somada ao preço: reserva = preço sem IVA × %. A % da Empresa aparece como sugestão."),
    (4, "Total de custos", "Menu + equipa (horas × €/h) + adicionais."),
    (5, "Preço sem IVA", "Custos × (1 + margem), arredondado à dezena se pedido (sem a reserva)."),
    (6, "Preço final com IVA", "Preço sem IVA + reserva + IVA sobre os dois."),
], ["No Produto a margem é sobre o preço de venda: custo ÷ (1 − margem). O mesmo número dá preços diferentes (R-B7).",
    "O IVA por omissão segue a língua do ecrã, não o país (R-B7).",
    "\"Preço sem IVA\" + IVA não dá o total quando há reserva (R-B7)."], altura_max=10.5 * cm)

S += ecra(K, "Calculadora de Preços — Tratamento", "Calculadora de Preços → Tratamento",
          "O preço de um tratamento a partir do tempo, dos materiais e dos custos fixos.", "c-precos-trat", [
    (1, "Valor da hora", "Preço por minuto × 60."),
    (2, "Custo indireto por hora", "Custos fixos mensais ÷ horas produtivas; o do tratamento = por hora × minutos ÷ 60."),
    (3, "Custo próprio / base mínima", "Valor do trabalho (preço/min × minutos) + materiais + custo indireto."),
    (4, "Preço recomendado", "Líquido = base × (1 + margem + reserva); final = líquido × (1 + IVA) em regime normal."),
    (5, "Aviso", "Compara o preço atual cobrado com a base mínima."),
], ["Sem dados da empresa, assume regime isento (as outras calculadoras assumem IVA) — R-B7."], altura_max=10.5 * cm)

S += ecra(K, "Planeamento Mensal", "Menu Planeamento Mensal · /contabilidade/planeamento",
          "Os tratamentos ou serviços planeados por mês: receita, custos, lucro e reserva. Vem da folha de cálculo da Célia.", "c-planeamento", [
    (1, "Custo indireto por hora", "Custos fixos mensais ÷ horas produtivas."),
    (2, "Reserva (%)", "A % da Empresa (só leitura; 25% se não houver)."),
    (3, "Receita", "Preço líquido × quantidade por mês."),
    (4, "Lucro (EÜR)", "Receita − material × quantidade − (duração ÷ 60) × custo indireto/hora × quantidade."),
    (5, "TOTAL", "Somas das linhas. O lucro total alimenta o cheque da Familienversicherung (Reservas e Conta na plataforma)."),
], ["O preço do catálogo é \"líquido\" aqui e bruto no Livro de Caixa (R-B7).",
    "Se as horas planeadas forem menos do que as produtivas, parte dos custos fixos não entra no lucro. É uma simulação: a Familienversicherung usa o lucro real.",
    "Clientes em Portugal também veem \"Lucro (EÜR)\"."], altura_max=9.5 * cm)

S += ecra(K, "Clientes · Catálogo", "Menu Clientes e Catálogo",
          "Clientes: os clientes do negócio do cliente. Catálogo: produtos e serviços para ligar aos lançamentos.", "c-clientes", [
    (1, "Serviço", "Opções ESG, Contabilidade, ESG + Contabilidade — são os serviços da Lúcia, não do cliente (R-D7)."),
    (2, "Total", "Número de clientes."),
    (3, "Países", "Número de países diferentes."),
], ["Esta lista não alimenta nenhum outro ecrã do cliente; foi também a lista antiga da Lúcia, agora congelada (R-D7).",
    "O Catálogo não tem números: o preço é usado no Livro de Caixa (× quantidade) e no Planeamento. Os dois já permitem editar (✏️)."],
   altura_max=6.5 * cm)

S += ecra(K, "Obrigações Fiscais", "Menu Obrigações Fiscais · /contabilidade/obrigacoes",
          "Os prazos do cliente. Inclui os que a equipa gere na Gestão, se a conta estiver ligada à ficha.", "c-obrigacoes", [
    (1, "N obrigações em atraso ou nos próximos 14 dias", "A mesma régua do menu e do sino. A lista mostra todas."),
    (2, "Calendário", "Já não há gerador do lado do cliente: o calendário é gerado pela equipa no portal (Gestão → Obrigações fiscais) e aparece aqui. <i>(No print, o botão antigo \"Gerar calendário\".)</i>"),
    (3, "Pendente / Entregue", "Só nas obrigações que o próprio cliente criou. As da equipa têm a etiqueta \"equipa\" e são só de leitura (migração 038)."),
], ["Para clientes sem ficha ligada na Gestão não há calendário automático — ligar a conta à ficha em Dados do cliente."], altura_max=9 * cm)

S += ecra(K, "Empresa", "Menu Empresa · /contabilidade/empresa",
          "Os dados que decidem as regras fiscais do cliente, e o envio de documentos por mês.", "c-empresa", [
    (1, "País", "PT ou DE: decide o menu (Reservas e EÜR), o IVA por omissão, o calendário e a Segurança Social no Painel."),
    (2, "Moeda", "Saiu do ecrã (não era usada; tudo em €). <i>No print ainda aparece.</i>"),
    (3, "Regime de IVA", "Normal ou isento: Livro de Caixa, Reservas, EÜR, Tratamento, calendário."),
    (4, "Reserva de IR (%)", "O único sítio onde se edita. Usada no Painel, Reservas, Planeamento e Calculadora (25% se vazia)."),
    (5, "Regime de Segurança Social", "Só o gerador de calendário PT o usa."),
    (6, "Início do ano fiscal", "Saiu do ecrã (não era usado). <i>No print ainda aparece.</i>"),
    (7, "Documentos", "Envia para a pasta do mês ({conta}/AAAA-MM). Depois de enviado, só a Lúcia remove. Aparece à equipa em Documentos → Enviados pelo cliente."),
], altura_max=11 * cm)

S += ecra(K, "Reservas e Impostos (Alemanha)", "Menu Reservas & Impostos · /contabilidade/rucklagen · só clientes na Alemanha",
          "Quanto do dinheiro na conta já é do Finanzamt.", "c-reservas", [
    (1, "Lucro até hoje", "Entradas − saídas do ano corrente, sem privados (bruto)."),
    (2, "Percentagem de reserva", "A da Empresa, só leitura, com ligação para a alterar lá. <i>(No print, os botões antigos −/+.)</i>"),
    (3, "Reserva de imposto recomendada", "Lucro (mín. 0) × %."),
    (4, "Valor previsto a pagar (USt)", "IVA recebido − Vorsteuer, acumulado do ano (sem descontar UStVA já pagas)."),
    (5, "Previdência", "Kranken-, Renten- e outras, por mês (escritas à mão)."),
    (6, "Familienversicherung", "Lucro mensal real (média do ano) face ao limite (565 € por omissão); o do Planeamento aparece por baixo, como simulação."),
    (7, "Total (atual)", "Reservado para impostos (do ano) + previdência (de um mês)."),
], ["O lucro é bruto, por isso já inclui o IVA por pagar; a reserva aplica a % sobre ele e o total volta a somar o IVA — parte fica reservada a mais (R-B5).",
    "\"Total\" soma um acumulado do ano com um valor mensal; o anel da previdência está fixo em 75% (R-B5)."], altura_max=13.5 * cm)

S += ecra(K, "Relatório EÜR (Alemanha)", "Menu Relatório EÜR · /contabilidade/eur · só clientes na Alemanha",
          "O apuramento fiscal alemão gerado do Livro de Caixa — preliminar, a validar com o Steuerberater.", "c-eur", [
    (1, "Total de receitas", "Receitas líquidas por taxa (Zeile 15 / 112 para 19%; reduzida; isentas) + IVA recebido."),
    (2, "Lucro/prejuízo tributável", "Receitas − despesas. Na prática igual ao \"Lucro até hoje\" de Reservas, para o mesmo ano."),
    (3, "Vereinnahmte Umsatzsteuer", "Soma do IVA das entradas."),
    (4, "Gezahlte Vorsteuerbeträge", "Soma do IVA das saídas (as despesas aparecem em líquido, por categoria)."),
], ["Equipamentos entram como despesa total, sem amortização (AfA); impostos pagos lançados em \"Impostos e Taxas\" reduzem o lucro — avisar o Steuerberater (R-B5)."],
   altura_max=11 * cm)

# ═════════════════════════════════════════════════════════════════════════════
# PARTE 4 — REVISÃO GERAL
# ═════════════════════════════════════════════════════════════════════════════
S += [PageBreak(), P("REVISÃO GERAL", kicker), P("O que encontrámos — e o que fazer", h1)]
S.append(P("A leitura completa do código, ecrã a ecrã, encontrou quatro tipos de problemas. Cada um tem uma referência "
           "(usada nas caixas <b>A ter em conta</b>), a prioridade e o esforço estimado: <b>P</b> pequeno (horas), "
           "<b>M</b> médio (um a dois dias), <b>G</b> grande (mexe no modelo de dados)."))
S.append(tabela(["Grupo", "O que é", "Itens"], [
    ["<b>A · Dados e segurança</b>", "Pode perder ou estragar dados, ou deixar alguém ver ou mudar o que não devia.", "6"],
    ["<b>B · Regras inconsistentes</b>", "O mesmo número calculado de formas diferentes em ecrãs diferentes, ou rótulos que prometem outra coisa.", "12"],
    ["<b>C · Fontes duplicadas</b>", "A mesma informação escrita em dois ou mais sítios, sem ligação — a raiz da maior parte da complexidade.", "8"],
    ["<b>D · Funcionalidades a retirar ou ligar</b>", "Ecrãs, campos e código sem uso, inalcançáveis ou desligados do resto.", "11"],
], [4.4 * cm, 10.6 * cm, USAVEL - 15.0 * cm]))
S.append(Spacer(1, 6))
S.append(P("<b>Já corrigido durante esta revisão (01/10):</b> o calendário das sociedades em Portugal falhava sempre (os três pagamentos por "
           "conta tinham o mesmo código); relatórios trimestrais novos não gravavam; apagar \"Horas incluídas\" dava erro; e os contratos "
           "novos do Financeiro não se ligavam à ficha do cliente, por isso a avença não aparecia na página do cliente."))

COR = {"Alta": "#a3271c", "Média": "#a26a12", "Baixa": "#4f6b5a"}


def achados(titulo, intro, itens):
    linhas = [[f"<b>{r}</b>", f"<b>{t}</b><br/>{d}", f"<font color='{COR[p]}'><b>{p}</b></font><br/>{e}", acao] for r, t, d, p, e, acao in itens]
    return [PageBreak(), P("REVISÃO GERAL", kicker), P(titulo, h1), P(intro),
            tabela(["Ref.", "O que acontece", "Prior. · esforço", "O que fazer"], linhas, [1.2 * cm, 8.1 * cm, 2.0 * cm, USAVEL - 11.3 * cm])]


S += achados("A · Dados e segurança", "Corrigir antes de qualquer simplificação: são os únicos que podem estragar dados reais.", [
    ("R-A1", "O cliente pode mudar e apagar as obrigações da equipa", "As obrigações geridas na Gestão ficam na conta do cliente, e a regra de acesso dá-lhe "
     "controlo total. Marcar \"Pendente\" repõe o estado da equipa em \"por preparar\" e apaga \"em revisão\", \"a aguardar documentos\"…; apagar leva o comprovativo e a checklist.",
     "Alta", "P", "Regra de acesso: o cliente só lê as obrigações criadas pela equipa (source = portal) e só mexe nas que ele próprio criou."),
    ("R-A2", "ESG: o cliente ainda pode escrever, e ler o que está escondido", "As regras antigas (do tempo em que o cliente preenchia) continuam ativas: pela API, um "
     "cliente ligado a um caso pode gravar e ler os dados mesmo com o caso escondido. E as chaves únicas ainda por conta impedem um segundo caso na mesma conta.",
     "Alta", "P", "Migração 038: retirar as políticas *_own das tabelas ESG e as chaves únicas por user_id."),
    ("R-A3", "Despesas sem IVA dedutível", "As saídas criadas a partir das Despesas Recorrentes e do extrato (Conciliação) gravam sem IVA. O IVA dedutível do Painel, a "
     "Vorsteuer e a Zahllast de Reservas e o EÜR ficam errados (renda, software e telecomunicações costumam ter IVA).",
     "Alta", "P", "Pedir a taxa de IVA no modelo recorrente e ao criar a partir do extrato (por omissão, a da empresa)."),
    ("R-A4", "Papéis de equipa com mais acesso do que dizem", "O papel Marketing vê o portal inteiro e pode ler e escrever clientes, obrigações, mensagens e toda a "
     "pasta de documentos; a página de Marketing diz o contrário. Os rótulos dos papéis em Acessos estão desatualizados.",
     "Média", "P", "Decidir os papéis (provavelmente: comercial = portal + CRM; marketing = só marketing) e ajustar menu e regras de acesso."),
    ("R-A5", "Triagem do diagnóstico calculada no browser", "Quem responde ao formulário público pode forjar \"qualificado\"; mudar os pesos não recalcula respostas antigas.",
     "Baixa", "P", "Calcular a triagem no servidor (função) a partir das respostas."),
    ("R-A6", "Consultoria perde edições", "A gravação automática só guarda a última alteração feita em 0,7 s; editar dois campos seguidos, mudar de bloco ou sair logo perde o "
     "anterior. Números com ponto de milhares (\"1.500\") são lidos mal e estragam totais e semáforos. A origem das estratégias TOWS aponta por posição e muda quando se apaga um item da SWOT.",
     "Alta", "P", "Juntar as alterações pendentes antes de gravar e gravar ao sair; ler números no formato PT/DE; guardar a origem TOWS por identificador."),
])

S += achados("B · Regras inconsistentes", "O mesmo conceito calculado de formas diferentes. Cada correção é pequena; o ganho é a Lúcia poder confiar que o mesmo nome dá o mesmo número.", [
    ("R-B1", "Ano fixo em 2026", "Painel, Livro de Caixa e Despesas Recorrentes têm 2026 escrito no código. Em janeiro de 2027 continuam a mostrar 2026, enquanto Reservas, "
     "EÜR e o aviso da Familienversicherung já olham para 2027.", "Alta", "P", "Ano corrente por omissão e seletor de ano. Tem de estar feito antes de janeiro."),
    ("R-B2", "Filtro de mês do Livro de Caixa ignora o ano", "\"Jan 2026\" junta os janeiros de todos os anos nos cartões e no CSV.", "Média", "P", "Filtrar por ano e mês."),
    ("R-B3", "Três réguas para \"obrigações em aberto\"", "Menu e sino: pendentes até 14 dias, incluindo vencidas. Página de Obrigações: todas. Início: só futuras (as vencidas nunca aparecem).",
     "Média", "P", "Uma só regra: em atraso + próximos 14 dias, em todo o lado; o Início mostra as em atraso primeiro."),
    ("R-B4", "Duas lógicas de periodicidade", "Despesas recorrentes trimestrais e anuais usam meses fixos (jan/abr/jul/out; janeiro); a avença conta a partir do mês de início.",
     "Média", "P", "Usar a regra do Financeiro (a partir do início) também nas recorrentes."),
    ("R-B5", "\"Resultado\" e \"lucro\" com significados diferentes", "O Painel junta o real e o previsto dos 12 meses; Reservas e EÜR só o real. O 3.º cartão da reserva tem o "
     "nome \"Resultado do ano\" com outro valor. A reserva é aplicada sobre valores brutos e volta a somar o IVA. O saldo do Livro de Caixa inclui privados; o da Conta na plataforma não. "
     "\"Total\" em Reservas soma o ano com um mês.", "Alta", "M", "Definir com a Lúcia: resultado real (até hoje) e previsão separados; reserva sobre o lucro líquido de IVA; nomes únicos."),
    ("R-B6", "Familienversicherung calculada de duas formas", "O Painel usa a média real; Reservas e a Conta na plataforma usam o Planeamento quando existe. O Planeamento não aloca "
     "os custos fixos das horas não planeadas.", "Média", "P", "Uma só regra (a real, com o Planeamento como simulação à parte)."),
    ("R-B7", "Calculadora de Preços com quatro matemáticas", "Margem como acréscimo sobre o custo (Evento, Serviço) e sobre o preço (Produto); reserva de IR somada ao preço; "
     "IVA por omissão pela língua; Tratamento assume isento sem dados. O preço do catálogo é bruto no Livro de Caixa e líquido no Planeamento.",
     "Média", "M", "Uma só definição de margem, IVA pela Empresa, sem \"reserva\" dentro do preço; decidir se o catálogo guarda líquido."),
    ("R-B8", "% de reserva com dois sítios, dois limites e três omissões", "Empresa (0–100) e Reservas (0–60, grava logo); sem valor, 25% no Painel, 20% no Planeamento e no Tratamento, 0% nas outras calculadoras.",
     "Baixa", "P", "Editar só na Empresa; uma omissão (por exemplo 25%)."),
    ("R-B9", "ESG: o ano muda de ecrã para ecrã", "Percurso e Conta na plataforma usam o ano corrente; Diagnóstico, KPIs, Relatório e Apresentação o mais recente com dados. O mesmo caso mostra progressos diferentes.",
     "Alta", "P", "O caso tem um ano de referência (escolhido uma vez) e todos os ecrãs o usam."),
    ("R-B10", "ESG: pequenas incoerências", "Maturidade 0% num ecrã e escondida noutros; \"Pontuados\" ≠ \"tratados\"; \"não se aplica\" só existe marcando e desmarcando; três conjuntos de "
     "indicadores de topo; CO₂ total vs scopes sem validação; unidades sem conversão; rotatividade sem taxa; sinal do gap salarial; nomes das fases ≠ menus; PT-BR misturado; "
     "\"tudo fechado\" a 80% sem temas materiais; o cliente vê mais do que a etiqueta diz.", "Média", "M", "Pacote de acertos ESG (lista detalhada no código-fonte deste guia)."),
    ("R-B11", "Portal: pequenas incoerências", "\"Valor a pagar\" e \"Créditos\" com regras diferentes; \"Atenção\" ignora obrigações em atraso; \"Próximos prazos\" ≠ filtro; \"Por fazer\" antes da entrada do cliente; "
     "\"Conta ativa\" sempre verdadeiro; pedir documentos no ano errado; campos que gravam a cada tecla; trocar o país não limpa o regime; prazo de pagamento = prazo da declaração; "
     "\"não constam do extrato\" sem limite de datas; origem do CRM perdida ao editar.", "Média", "M", "Pacote de acertos do portal."),
    ("R-B12", "Segurança Social em Portugal", "O gerador do cliente põe o T1 a 20 de janeiro (antes de o trimestre começar) — tudo desfasado um trimestre; o do portal usa o fim do mês seguinte. "
     "O Painel estima a contribuição para sociedades e sobre toda a receita.", "Alta", "P", "Confirmar o prazo legal com a Lúcia; corrigir no gerador que ficar (ver R-C3); usar o regime de SS no Painel."),
])

S += achados("C · Fontes duplicadas", "É aqui que está a simplificação de fundo: hoje a mesma coisa é escrita em vários sítios e cada ecrã lê um deles.", [
    ("R-C1", "O \"cliente\" existe em sete sítios", "Ficha da Gestão (<i>clientes</i>), lista antiga da Lúcia (<i>clients</i>), nome no contrato do Financeiro, consultoria, caso ESG, lead do CRM e "
     "resposta de diagnóstico — sem chave comum. Fechar no CRM, criar uma conta ou abrir um caso ESG nunca cria a ficha. Já há duplicados por nome.",
     "Alta", "G", "A ficha da Gestão é o cliente. Consultorias, casos ESG, contratos e leads passam a apontar para ela; fechar um lead ou criar uma conta cria a ficha. Ecrã para juntar duplicados."),
    ("R-C2", "País e regime em dois sítios", "Dados da Empresa (lado do cliente) e Dados do cliente (Gestão) foram copiados uma vez e não se sincronizam.",
     "Alta", "M", "Uma só fonte: a ficha da Gestão. A página Empresa do cliente mostra os dados em leitura (a equipa mantém-nos, decisão de 25/09)."),
    ("R-C3", "Dois geradores de calendário fiscal", "O do cliente (simples, códigos PT-IVA-…) e o do portal (completo, por forma jurídica e trabalhadores) escrevem na mesma tabela com regras diferentes "
     "(Segurança Social, IRS, Gewerbesteuer para Freiberufler) e podem duplicar prazos.", "Alta", "P", "Retirar o gerador do cliente; o calendário é gerado pela equipa no portal."),
    ("R-C4", "\"Que serviços tem\" em cinco sítios", "Ficha (serviços), dados da empresa (serviço), conta (plataforma), contrato (serviço em texto) e lista antiga (serviço). Podem divergir: um cliente com caso ESG e plataforma \"Contabilidade\" não vê nada.",
     "Média", "M", "Os serviços da ficha decidem a plataforma da conta (e os níveis de acesso por serviço, pedido de 18/09)."),
    ("R-C5", "Notas, mensagens e pagamentos em dois sítios", "Notas internas vs Consultoria e Histórico vs notas da consultoria; caixa de avisos antiga vs conversa do portal; pagamento registável no Financeiro e nas Notas internas (sempre pelo valor total).",
     "Média", "P", "Um sítio para cada coisa: Notas internas (equipa), Consultoria e Histórico (visível ao cliente — dizê-lo no ecrã), Financeiro para pagamentos."),
    ("R-C6", "ESG: investimento, poupança e meta escritos duas vezes", "No tema (Materialidade) e no projeto; o projeto copia uma vez e depois divergem; a Apresentação mostra os dois paybacks. O novo ano do diagnóstico copia as respostas.",
     "Média", "M", "O financeiro e a meta vivem no projeto; o tema mostra a soma dos projetos. O novo ano começa vazio (ou pede confirmação)."),
    ("R-C7", "Documentos em dois sítios", "O cliente envia para a pasta do mês (Empresa) e vê tudo na página Consultoria; a equipa regista em Documentos e tem de classificar à mão o que chega.",
     "Média", "M", "O envio do cliente cria logo o registo (tipo escolhido por ele); uma só página de documentos no portal do cliente."),
    ("R-C8", "A avença ligada por dois campos", "O Início do cliente procura o contrato pela conta; o portal pela ficha. Um contrato ligado só a um deles não aparece no outro.",
     "Média", "P", "Ler pela ficha nos dois lados (a ficha sabe a conta)."),
])

S += achados("D · Funcionalidades a retirar ou ligar", "O que se pode tirar sem perder nada — ou ligar para que faça sentido.", [
    ("R-D1", "Ficheiros sem uso", "Páginas sem rota: Dashboard antigo (com números fixos), Financeiro antigo, Tarefas da contabilidade, diagnóstico ESG público (935 linhas), Topbar. Restos de textos e funções sem uso.",
     "Baixa", "P", "Apagar."),
    ("R-D2", "Despesas Recorrentes sem menu", "Só se chega pelo \"!\" do Painel, que só aparece quando já há modelos.", "Alta", "P", "Pôr no menu (ou dentro do Livro de Caixa, como separador)."),
    ("R-D3", "Contabilidade Lite: menu que engana", "O Início (página de entrada) e a Conciliação aparecem no menu Lite mas devolvem ao Painel; o Lite nunca vê as mensagens da Lúcia.",
     "Média", "P", "Incluir o Início no Lite; tirar a Conciliação do menu Lite."),
    ("R-D4", "Vista do cliente do portal ainda desligada", "O portal sabe mostrar a área visível ao cliente, mas ninguém a vê ainda.", "Média", "G",
     "Decidir na fase do portal do cliente: ligar (e retirar Início, Obrigações e Consultoria antigos do cliente) ou apagar."),
    ("R-D5", "\"Mensagens por ler\" sempre zero", "O cliente não responde pela plataforma, por isso os contadores de não lidas não servem.", "Baixa", "M", "Ligar a resposta do cliente com o portal do cliente, ou retirar os contadores."),
    ("R-D6", "Marketing", "Página de espera.", "Baixa", "P", "Retirar até haver conteúdo."),
    ("R-D7", "Contabilidade → Clientes", "Para o cliente final não liga a nada e oferece os serviços da Lúcia; a lista antiga da Lúcia ficou congelada.", "Média", "P",
     "Confirmar com a Lúcia se algum cliente a usa; se não, retirar."),
    ("R-D8", "Campos e dados sem destino", "Moeda e Início do ano fiscal (Empresa); dados ESG recolhidos e nunca mostrados (fontes de energia, resíduos perigosos…); textos do relatório ESG fora da Apresentação.",
     "Baixa", "P", "Tirar os campos da Empresa; decidir o que a ESG mostra."),
    ("R-D9", "Ecrãs sem editar", "Catálogo e Clientes só criam e apagam; o botão de editar das Recorrentes não tem texto.", "Baixa", "P", "Acrescentar editar."),
    ("R-D10", "ESG: o que não se pode mudar", "O contacto e a conta de um caso não se editam depois de criado; as notas da materialidade perdem-se sem \"Guardar\".", "Média", "P", "Editar o caso na tira de cima; gravar sozinho."),
    ("R-D11", "Lembrete que não lembra", "O \"lembrete automático\" das tarefas é só a etiqueta 🔔; nada é enviado.", "Baixa", "M", "Enviar o resumo diário por e-mail à equipa, ou mudar o nome para \"destacar\"."),
])

S += [PageBreak(), P("REVISÃO GERAL", kicker), P("Estado da revisão", h1)]
S.append(P("<b>Fase 1 feita a 01/10</b> (com a migração 038): R-A1, R-A2, R-A3, R-A6 · R-B1, R-B2, R-B3, R-B4, R-B6, R-B8, R-B9, R-B12 · "
           "R-C3 · R-D1, R-D2, R-D3, R-D8, R-D9. Do R-B5 ficou feito: custos fixos só até ao mês corrente e o nome \"Resultado após reserva\"."))
S.append(P("<b>À espera de decisão da Lúcia:</b> papéis da equipa (R-A4); reserva sobre o resultado com ou sem IVA e o \"Total\" de Reservas (resto do R-B5); "
           "Calculadora de Preços (R-B7, sessão combinada a 01/10); retirar ou não Contabilidade → Clientes (R-D7). O Marketing (R-D6) já não sai: vai ter a prévia do Instagram (reunião de 01/10)."))
S.append(P("<b>Ainda em aberto, sem decisão pendente:</b> R-A5, R-B10, R-B11 (pacotes de acertos da ESG e do portal), a Fase 2 (R-C1, R-C2, R-C4 a R-C8) e a Fase 3."))
S += [PageBreak(), P("REVISÃO GERAL", kicker), P("Proposta de simplificação", h1)]
S.append(P("Em três fases, da mais urgente para a mais estrutural. As duas primeiras cabem antes do fecho do contrato (novembro)."))
S.append(P("Fase 1 · Acertos sem mudar o modelo (2 a 3 semanas)", h2))
for x in ["Dados e segurança: R-A1, R-A2, R-A3, R-A6 — e R-A4 depois de decidir os papéis.",
          "O que parte em janeiro: R-B1 (ano fixo) e R-B2.",
          "Uma regra por conceito: R-B3, R-B4, R-B5, R-B6, R-B8, R-B9, R-B12.",
          "Limpeza: R-D1, R-D2, R-D3, R-D6, R-D8, R-D9.",
          "Um só gerador fiscal: R-C3."]:
    S.append(B(x))
S.append(P("Fase 2 · Uma ficha de cliente (2 a 3 semanas)", h2))
for x in ["A ficha da Gestão passa a ser o cliente em toda a plataforma (R-C1): contratos, consultorias, casos ESG e leads apontam para ela; fechar um lead ou criar uma conta cria-a.",
          "O perfil fiscal vive só na ficha; a página Empresa do cliente mostra-o (R-C2). Os serviços da ficha decidem a plataforma (R-C4).",
          "Ecrã para juntar fichas duplicadas (a consulta de duplicados de 30/09 é o ponto de partida).",
          "Um sítio para notas, mensagens, pagamentos e documentos (R-C5, R-C7, R-C8)."]:
    S.append(B(x))
S.append(P("Fase 3 · Portal do cliente (depois da pausa)", h2))
for x in ["Ligar a vista do cliente do portal (R-D4) e retirar as páginas antigas que ela substitui (Início, Obrigações Fiscais e Consultoria do cliente).",
          "Mensagens nos dois sentidos (R-D5), relatórios trimestrais visíveis, níveis de acesso por serviço.",
          "Rever com a Lúcia a Calculadora de Preços (R-B7) e a ESG (R-B10, R-C6) com o que os clientes realmente usam."]:
    S.append(B(x))
S.append(Spacer(1, 6))
S.append(atencao(["Antes da Fase 2, convém confirmar com a Lúcia quantos clientes usam hoje cada página do lado do cliente (Livro de Caixa, Conciliação, "
                  "Planeamento, Calculadora, Clientes). Uma página que ninguém usa sai em vez de ser corrigida."]))

# ── Registo ──
S += [PageBreak(), P("HISTÓRICO", kicker), P("Registo de alterações", h1)]
S.append(tabela(["Data", "O que mudou na plataforma", "Neste guia"], [list(r) for r in REGISTO], [2.0 * cm, 11.4 * cm, USAVEL - 13.4 * cm]))
S.append(Spacer(1, 10))
S.append(P("Como manter este guia", h2))
for x in ["Mudou uma fórmula ou um ecrã? Atualizar a página correspondente neste ficheiro e acrescentar uma linha ao registo.",
          "Os prints tiram-se de uma cópia local da plataforma com dados de exemplo (nunca dados reais) e ficam em docs/guia-plataforma/prints.",
          "Gerar: python scripts/gera-guia-plataforma.py"]:
    S.append(B(x))

doc.build(S)
print("PDF:", SAIDA)
