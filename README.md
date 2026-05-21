# LC Office Consulting — Plataforma Contábil

Plataforma de gestão contábil bilingue (PT/DE) para Lúcia Cílio · Office Consulting.

## Módulos (v1)

- **Livro de Caixa** — Registo de entradas/saídas com separação Caixa/Banco, saldo corrente, exportação CSV.
- **Calculadora de Preços** — Eventos/Catering, serviços por hora e produtos (modelo MB Standard), com IVA PT 23% / DE 19%.
- **Clientes** — Listagem com filtro por país (PT/DE).
- **Obrigações Fiscais** — Calendário de prazos fiscais PT e DE com countdown.

## Stack

- React 19 + Vite
- React Router DOM
- Tailwind CSS

## Desenvolvimento

```bash
npm install
npm run dev      # → http://localhost:5174
npm run build    # produção
```

## Deploy (Vercel)

Pronto para Vercel. O `vercel.json` configura o rewrite para SPA routing
(necessário para deep links como `/contabilidade/caixa` funcionarem em refresh).

Comando de build: `npm run build` · Output: `dist/`
