// V2 — a mesma plataforma (mesmo código, mesmos dados) com a identidade visual nova,
// servida em /v2 para a Lúcia e a Letícia validarem antes de substituir a atual.
// Tudo o que muda entre as duas versões decide-se por esta constante.
export const V2 = typeof window !== 'undefined' && /^\/v2(\/|$)/.test(window.location.pathname)

// Prefixo das ligações escritas à mão (<a href>), para não saltarem da V2 para a V1.
export const BASE = V2 ? '/v2' : ''
