// Registo do service worker (public/sw.js).
//
// Só em produção: em desenvolvimento um service worker serve ficheiros em cache
// por cima do servidor do Vite e dá a impressão de que as alterações não pegam.
// E se um dia for preciso desligar isto, basta publicar um sw.js vazio — o
// browser substitui o antigo na visita seguinte.

export function registarSW() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Falhar a registar não pode partir a aplicação: sem service worker ela
      // funciona exatamente como funcionava antes, só não abre sem rede.
    })
  })
}
