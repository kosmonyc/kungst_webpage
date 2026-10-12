# Kungst webpage

The UI for the [kungst backend](../backend): sign up, create projects, author
structures, classify texts, label examples and evaluate.

React 18 + TypeScript + Vite, with plain CSS. There is no router or UI library; the
design tokens are at the top of `src/styles.css`.

```powershell
npm install
npm run dev        # http://localhost:5173, talks to http://localhost:8000
npm run build      # type-check + production bundle in dist/
```

Point it at another backend with `VITE_API_URL` (see `.env.example`). The backend's
`KUNGST_CORS_ORIGINS` must include this page's origin. The default already allows
`http://localhost:5173`.

## Layout

| path | |
|---|---|
| `src/api.ts` | fetch client and response types (mirrors `backend/app/schemas.py`); JWT kept in `localStorage` |
| `src/App.tsx` | top bar and view switching: auth → projects → project |
| `src/views/Auth.tsx` | log in / sign up |
| `src/views/Projects.tsx` | project list and creation |
| `src/views/Project.tsx` | project header and tabs |
| `src/views/tabs/*` | Classify, Structure (JSON editor + versions), Examples (form or JSONL import), Evaluate |
| `src/components/` | prediction card, small UI helpers |

## Palette

| token | hex | used for |
|---|---|---|
| `--navy-950` | `#040F1A` | page background, top bar |
| `--navy-800` | `#0B2C4D` | inputs, chips, secondary buttons |
| `--navy-600` | `#134980` | strong lines, hovered secondary buttons, dim bars |
| `--blue-500` | `#1B67B3` | blue buttons, version chips |
| `--blue-400` | `#2284E6` | accent: probability bars, focus rings, active tab |

The primary call-to-action is a white pill on navy, as on Uber's dark surfaces.
