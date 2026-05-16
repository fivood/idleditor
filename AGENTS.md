# AGENTS.md

## Commands
- Install with `npm install`; this repo uses `package-lock.json` and has no pnpm/yarn workspace.
- `npm run dev` starts both Vite and `server/index.js`; use `npm run dev:vite` or `npm run dev:server` when only one side is needed.
- `npm run build` is the main verification: it runs `tsc -b` before `vite build`.
- `npm run lint` runs ESLint over the repo; `dist/` is the only global ignore.
- Vitest is configured in `vite.config.ts` but there is no `npm test` script. Use `npx vitest run` or `npx vitest run path/to/file.test.tsx` for focused tests.

## Architecture
- App entry is `src/main.tsx` -> `src/App.tsx` -> `src/components/layout/Shell.tsx`.
- Global state lives in `src/store/gameStore.ts` (Zustand + Immer). Game simulation is `src/core/gameLoop.ts`, split into ordered phases in `src/core/tick/*`.
- `Shell` owns initialization, the 1-second game loop, autosave, and offline progress hooks.
- IndexedDB persistence is in `src/db/*`; maps/sets are serialized explicitly, so update save/load paths when adding persisted state.
- Import alias `@/*` maps to `src/*` in both Vite and TS config.

## API And Env
- Frontend calls `/api/*`. In local Vite dev these proxy to `http://localhost:3001`, but `server/index.js` only implements `/api/generate-cover`; other LLM/cloud-save endpoints are Cloudflare Pages Functions in `functions/api/*`.
- Deployed Functions expect `LLM_API_KEY`, optional `LLM_BASE_URL`/`LLM_MODEL`, `OPENAI_API_KEY` for cover generation, and a `SAVE_KV` binding for cloud save/rate limiting.
- `.env.example` only documents the local Express cover server (`OPENAI_API_KEY`, `SERVER_PORT`); generator scripts also look for provider-specific keys such as `DEEPSEEK_API_KEY`, `KIMI_API_KEY`, and `GEMINI_API_KEY`.

## Generated Data
- Runtime content is loaded from `public/covers/manifest.json`, `public/synopses/pool.json`, and optionally `public/authors/names.json`; missing files fall back to placeholders/templates.
- `scripts/gen-cover-manifest.mjs` rewrites `public/covers/manifest.json` and `public/covers/README.md` from its embedded title lists.
- LLM-backed generator scripts are not npm scripts and may mutate tracked `public/` assets incrementally; run them intentionally, not as routine verification.

## Repo Gotchas
- **Immer Map/Set support must be enabled.** The store uses `Map`/`Set` for manuscripts, authors, and departments. Without `enableMapSet()` from `immer`, mutations like `draft.manuscripts.set(...)` inside a Zustand `set()` producer silently fail with `[Immer] minified error nr: 0` — manuscripts are lost, solicitation appears to do nothing.
- Treat values returned by `get().manuscripts.get(...)`, `get().authors.get(...)`, etc. as read-only. Immer auto-freezes store objects; update them inside `set(draft => { ... })` instead of mutating the object then replacing the Map.
- Never call `get().addToast()` or `get().setState()` inside a Zustand `set(draft => ...)` producer. This nests state updates and can lose log entries. Write to `draft.toasts` directly in the same draft.
- Root files such as `temp_old_gameStore.ts`, `temp_utf8_gameStore.ts`, and `missing_actions.ts` are scratch/repair artifacts and are outside `tsconfig.app.json` (`include: ["src"]`). Do not update them when changing real app behavior.
- TypeScript has `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `verbatimModuleSyntax`; avoid TS features that need runtime emit and keep type-only imports explicit.
- Tailwind v4 is wired through `@tailwindcss/vite`; there is no Tailwind config file to edit by default.
- User-facing copy is primarily Chinese and is part of the game tone; preserve the existing voice when changing UI or generated content.
