-- ============================================================================
-- Migração 065 — Página do evento editável por edição (LUC-242)
--
-- Porquê: na reunião de 29/10 a Lúcia perguntou "como é que eu vou fazer para
-- mudar os palestrantes?" — o próximo Momentos é no fim de março/início de abril
-- e hoje public/momentos/index.html tem todo o conteúdo de 24/10 fixo no código.
--
-- O que muda:
--   1. eventos.pagina (jsonb) — o conteúdo da landing de cada edição: horas, tema,
--      local/morada, preço, link da Luma, o que inclui, palestrantes (foto, área,
--      texto, tópicos, Instagram, selo), programa, imagem de partilha.
--      Nulo = o evento não tem página.
--   2. eventos.pagina_atual (boolean) — a edição que lcoffice.pt/momentos/ mostra.
--      No máximo uma (índice único parcial). As outras ficam no endereço próprio
--      (lcoffice.pt/momentos/?e=<id>).
--   3. Bucket 'eventos-pagina' (PÚBLICO) para as fotos da página: só imagens
--      PNG/JPEG/WebP até 3 MB, pasta = id do evento. Público porque a landing e a
--      pré-visualização do WhatsApp precisam de endereço fixo. Só a administradora
--      envia, troca e apaga. Não confundir com o bucket 'eventos' (privado, fotos
--      de perfil dos participantes).
--   4. Carrega a edição de 24/10 (momentos-2026-10) com o conteúdo que a página
--      tem hoje e marca-a como atual (só se ainda não tiver página).
--
-- Segurança: a leitura pública da página passa por api/evento.js (service role),
-- que devolve só o conteúdo de `pagina` e os campos públicos do evento (nome,
-- data, local). Sem políticas novas para anónimos nas tabelas.
--
-- Só aditiva. Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1 e 2. Colunas ----------------------------------------------------------------
alter table public.eventos add column if not exists pagina jsonb;
alter table public.eventos add column if not exists pagina_atual boolean not null default false;
create unique index if not exists uq_eventos_pagina_atual on public.eventos (pagina_atual) where pagina_atual;

-- 3. Fotos da página ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('eventos-pagina', 'eventos-pagina', true, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "eventos_pagina_admin" on storage.objects;
create policy "eventos_pagina_admin" on storage.objects for all
  using (bucket_id = 'eventos-pagina' and public.is_admin())
  with check (bucket_id = 'eventos-pagina' and public.is_admin());

-- 4. Edição de 24/10 com o conteúdo de hoje ---------------------------------------
-- Fotos de 24/10 continuam em /momentos/img/ (ficheiros do site); as novas vão
-- para o bucket e ficam com o endereço público completo.
update public.eventos set
  pagina_atual = not exists (select 1 from public.eventos e2 where e2.pagina_atual),
  pagina = $json${
    "hora_inicio": "15:00",
    "hora_fim": "19:30",
    "rececao": "Receção às 15h",
    "tema_1": "Ser Empreendedor:",
    "tema_2": "comportamentos que fazem um negócio crescer",
    "local_nome": "District Space",
    "local_cidade": "Lisboa",
    "morada": "Edifício Jean Monnet · Largo Jean Monnet 1, 1250-096 Lisboa",
    "mapa_lat": 38.72002,
    "mapa_lng": -9.14699,
    "preco": "40 €",
    "luma_url": "https://luma.com/coz36n2c",
    "inclui": [
      "Palestras e conversas com as seis presenças confirmadas",
      "Apresentações de negócios",
      "Networking e cocktail final"
    ],
    "programa_resumo": "Das 15h00 às 19h30: cinco palestras, apresentações de negócios e um cocktail para fechar a tarde.",
    "programa": [
      {"hora": "15h00–15h15", "tipo": "Receção", "titulo": "Receção dos participantes", "quem": ""},
      {"hora": "15h15–15h30", "tipo": "Abertura", "titulo": "Boas-vindas e abertura", "quem": "Lúcia Cilio"},
      {"hora": "15h30–15h55", "tipo": "Palestra", "titulo": "Finanças sistémicas: da raiz à liberdade", "quem": "Rita Évora"},
      {"hora": "16h00–16h25", "tipo": "Palestra", "titulo": "Comportamentos financeiros", "quem": "Florência Dias"},
      {"hora": "16h25–16h35", "tipo": "Negócios", "titulo": "Apresentação de negócios", "quem": ""},
      {"hora": "16h35–16h50", "tipo": "Pausa", "titulo": "Pausa · 15 minutos", "quem": ""},
      {"hora": "16h50–17h15", "tipo": "Palestra", "titulo": "Comunicação e posicionamento", "quem": "Sollange Binhã"},
      {"hora": "17h20–17h45", "tipo": "Palestra", "titulo": "Liderança", "quem": "Prof. Luís Sinate"},
      {"hora": "17h45–18h00", "tipo": "Negócios", "titulo": "Apresentação de negócios", "quem": ""},
      {"hora": "18h00–18h25", "tipo": "Palestra", "titulo": "Posicionamento e gestão emocional", "quem": "Drielly Jesus"},
      {"hora": "18h25–18h35", "tipo": "Encerramento", "titulo": "Encerramento e fotografia de grupo", "quem": ""},
      {"hora": "18h35–19h30", "tipo": "Networking", "titulo": "Cocktail e networking", "quem": ""}
    ],
    "oradores_titulo": "Seis presenças. Experiências diferentes.",
    "palestrantes": [
      {"nome": "Lúcia Cilio", "curto": "Lúcia Cilio", "area": "Oradora · Consultora", "foto": "/momentos/img/lucia.jpg", "selo": "",
       "texto": "Experiência internacional em finanças pessoais, contabilidade e sustentabilidade.",
       "topicos": ["Mais de 10 anos de experiência internacional", "Contabilista certificada em Portugal", "MBA, Porto Business School"],
       "instagram": "luciacilio.office"},
      {"nome": "Rita Évora dos Santos", "curto": "Rita Évora", "area": "Finanças sistémicas", "foto": "/momentos/img/rita.jpg", "selo": "",
       "texto": "Traz uma nova perspetiva sobre o dinheiro: a relação entre comportamento, escolhas e decisões financeiras mais conscientes.",
       "topicos": ["Empresária há mais de 10 anos", "Licenciatura em Estatística e Gestão de Informação", "Uma perspetiva sistémica sobre o dinheiro"],
       "instagram": "rita_evorasantos"},
      {"nome": "Florência Dias", "curto": "Florência", "area": "Comportamento financeiro", "foto": "/momentos/img/florencia.jpg", "selo": "",
       "texto": "Apaixonada pela educação financeira, ajuda pessoas e famílias a desenvolver uma relação mais consciente e saudável com o dinheiro.",
       "topicos": ["Criadora do Money Brunch", "Comportamento, mentalidade e educação financeira", "Licenciatura em Gestão de Empresas; formação em psicologia financeira"],
       "instagram": "florencia.diass"},
      {"nome": "Sollange Binhã", "curto": "Sollange", "area": "Comunicação", "foto": "/momentos/img/sollange.jpg", "selo": "",
       "texto": "Atua na comunicação e no desenvolvimento pessoal: ajuda pessoas a comunicar com mais confiança e a fortalecer o seu posicionamento.",
       "topicos": ["Comunicação autêntica", "Desenvolvimento pessoal e carreira", "Posicionamento no mercado"],
       "instagram": "sousollangebinha"},
      {"nome": "Drielly Jesus", "curto": "Drielly Jesus", "area": "Mentoria", "foto": "/momentos/img/drielly.jpg", "selo": "",
       "texto": "Mentora: ajuda mulheres a posicionarem-se na vida e nos negócios e a sustentarem os resultados que desejam.",
       "topicos": ["Mentora de mulheres empreendedoras", "Posicionamento na vida e nos negócios", "Resultados que se sustentam"],
       "instagram": "driellyjesusmentora"},
      {"nome": "Prof. Luís Sinate", "curto": "Luís Sinate", "area": "Liderança", "foto": "/momentos/img/luis.jpg", "selo": "Convidado especial",
       "texto": "Professor, formador e mentor. Comentador no Bem-vindos (RTP) e fundador do Afroseminarium. Uma trajetória dedicada a formar equipas e a desenvolver talentos.",
       "topicos": ["Mais de 25 anos em educação, comunicação e desenvolvimento de pessoas", "Mestre em Sociologia das Organizações", "Gestão, recursos humanos e liderança"],
       "instagram": "luissinate"}
    ],
    "og_imagem": "/momentos/og.jpg"
  }$json$::jsonb
where id = 'momentos-2026-10' and pagina is null;
