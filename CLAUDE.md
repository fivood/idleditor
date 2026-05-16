# CLAUDE.md

## Commands
- Install with `npm install`; this repo uses `package-lock.json` and has no pnpm/yarn workspace.
- `npm run dev` starts both Vite and `server/index.js`; use `npm run dev:vite` or `npm run dev:server` when only one side is needed.
- `npm run build` is the main verification: it runs `tsc -b` before `vite build`.
- `npm run lint` runs ESLint over the repo; `dist/` is the only global ignore.
- Vitest is configured in `vite.config.ts` but there is no `npm test` script. Use `npx vitest run` or `npx vitest run path/to/file.test.tsx` for focused tests.

## Architecture
- App entry is `src/main.tsx` -> `src/App.tsx` -> `src/components/layout/Shell.tsx`.
- Global state lives in `src/store/gameStore.ts` (Zustand + Immer). `Shell` owns initialization, the 1-second game loop, autosave, and offline progress hooks.
- Game simulation is in `src/engine/`. `runTick(world)` clones the input world, runs ordered phases, and returns `{ world, result }`.
- Tick phases live in `src/engine/tick/*`. They mutate only the cloned `world` they receive, push UI side effects into `result`, and return `{ world, result }`.
- `src/core/gameLoop.ts` owns world initialization and compatibility exports. Avoid adding new mechanics there; add them as engine phases instead.
- IndexedDB persistence is in `src/db/*`; maps/sets are serialized explicitly, so update save/load paths when adding persisted state.
- Import alias `@/*` maps to `src/*` in both Vite and TS config.

## Engine API
- Add a new mechanic by copying `src/engine/tick/_template.ts`, implementing the phase, then registering it in `TICK_PHASES` in `src/engine/index.ts`.
- Keep phases deterministic and testable. Do not read from Zustand, Dexie, React state, `localStorage`, or browser APIs inside a phase.
- Use `runTick(world, { rng })` in tests when randomness matters. Existing random helpers use `Math.random`; `runTick` temporarily routes it through the provided RNG during a tick.
- The store applies returned engine worlds through `applyWorldToDraft()` instead of replacing Maps directly. If a tick appears to lose manuscripts/authors/departments, inspect that adapter first.
- Factories used by the engine should expose pure wrappers such as `createManuscriptWithWorld()`. Keep legacy mutating helpers only for compatibility with old call sites.

## API And Env
- Frontend calls `/api/*`. In local Vite dev these proxy to `http://localhost:3001`, but `server/index.js` only implements `/api/generate-cover`; other LLM/cloud-save endpoints are Cloudflare Pages Functions in `functions/api/*`.
- Deployed Functions expect `LLM_API_KEY`, optional `LLM_BASE_URL`/`LLM_MODEL`, `OPENAI_API_KEY` for cover generation, and a `SAVE_KV` binding for cloud save/rate limiting.
- `.env.example` only documents the local Express cover server (`OPENAI_API_KEY`, `SERVER_PORT`); generator scripts also look for provider-specific keys such as `DEEPSEEK_API_KEY`, `KIMI_API_KEY`, and `GEMINI_API_KEY`.

## Generated Data
- Runtime content is loaded from `public/covers/manifest.json`, `public/synopses/pool.json`, and optionally `public/authors/names.json`; missing files fall back to placeholders/templates.
- `scripts/gen-cover-manifest.mjs` rewrites `public/covers/manifest.json` and `public/covers/README.md` from its embedded title lists.
- LLM-backed generator scripts are not npm scripts and may mutate tracked `public/` assets incrementally; run them intentionally, not as routine verification.

## Repo Gotchas
- **Immer Map/Set support must be enabled.** The store uses `Map`/`Set` for manuscripts, authors, and departments. Without `enableMapSet()` from `immer`, mutations like `draft.manuscripts.set(...)` inside a Zustand `set()` producer silently fail with `[Immer] minified error nr: 0`.
- Treat values returned by `get().manuscripts.get(...)`, `get().authors.get(...)`, etc. as read-only. Immer auto-freezes store objects; update them inside `set(draft => { ... })` instead of mutating the object then replacing the Map.
- Never call `get().addToast()` or `get().setState()` inside a Zustand `set(draft => ...)` producer. This nests state updates and can lose log entries. Write to `draft.toasts` directly in the same draft.
- Root files such as `temp_old_gameStore.ts`, `temp_utf8_gameStore.ts`, and `missing_actions.ts` are scratch/repair artifacts and are outside `tsconfig.app.json` (`include: ["src"]`). Do not update them when changing real app behavior.
- TypeScript has `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `verbatimModuleSyntax`; avoid TS features that need runtime emit and keep type-only imports explicit.
- Tailwind v4 is wired through `@tailwindcss/vite`; there is no Tailwind config file to edit by default.
- User-facing copy is primarily Chinese and is part of the game tone; preserve the existing voice when changing UI or generated content.
