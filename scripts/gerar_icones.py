# -*- coding: utf-8 -*-
"""Gera os ícones da aplicação a partir de public/logo.png.

O logótimo completo é um lettering largo ("Office Consulting") que fica
ilegível a 48px. O ícone usa só o monograma dourado, centrado sobre o verde
da marca — é o que se lê num ecrã inicial.

Correr a partir da raiz do projeto:  python scripts/gerar_icones.py
"""
from PIL import Image
import os

VERDE = (13, 59, 32, 255)       # #0d3b20 — o mesmo do theme_color/background_color
ORIGEM = 'public/logo.png'
DESTINO = 'public/icons'

# O monograma vive na metade de cima do ficheiro; a caixa é apurada pelo alfa
# para não depender de coordenadas escritas à mão.
base = Image.open(ORIGEM).convert('RGBA')
caixa = base.crop((0, 0, base.width, 500)).getbbox()
mono = base.crop(caixa)


def icone(lado, ocupacao, fundo=VERDE):
    """Monograma centrado num quadrado, a ocupar `ocupacao` do lado."""
    tela = Image.new('RGBA', (lado, lado), fundo)
    alvo = int(lado * ocupacao)
    escala = alvo / max(mono.width, mono.height)
    m = mono.resize((max(1, round(mono.width * escala)), max(1, round(mono.height * escala))), Image.LANCZOS)
    tela.paste(m, ((lado - m.width) // 2, (lado - m.height) // 2), m)
    return tela


os.makedirs(DESTINO, exist_ok=True)
ficheiros = [
    # (nome, lado, ocupação)
    # "any": o ícone é desenhado inteiro, por isso o monograma pode respirar menos.
    ('icon-192.png', 192, 0.62),
    ('icon-512.png', 512, 0.62),
    # "maskable": o Android recorta até 20% de cada lado. O conteúdo tem de caber
    # na zona segura central, senão o monograma sai cortado em ecrãs redondos.
    ('icon-maskable-512.png', 512, 0.46),
    # iOS não respeita transparência e arredonda ele próprio os cantos.
    ('apple-touch-icon.png', 180, 0.62),
    ('favicon-32.png', 32, 0.70),
]
for nome, lado, ocupacao in ficheiros:
    caminho = os.path.join(DESTINO, nome)
    icone(lado, ocupacao).save(caminho, optimize=True)
    print('%-26s %dx%d' % (nome, lado, lado))
