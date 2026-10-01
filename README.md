# Tanulós Program

Gyerekeknek szóló, offline-first oktatási desktop app: **Tauri v2** + **React 19** + **Vite** + **Tailwind**.

## Fejlesztés

```bash
npm install
npm run dev          # csak frontend (Vite)
npm run tauri dev    # teljes desktop app (Rust toolchain kell)
```

## Build

```bash
npm run build        # Vite frontend
npm run tauri build  # natív bináris (Rust + Tauri prerequisites)
```

## Struktúra

- `src/modules/` — oktatási modulok (matek, nyelv, …)
- `src/core/` — Dexie DB, store, layout, audio
- `src/components/` — közös UI és effektek
- `.cursor/rules/educational-desktop-architecture.mdc` — projekt-szabály (alwaysApply)

## Web (Vercel)

A böngészős/PWA változat a Vite buildet használja (Tauri nem kell a hostoláshoz).

1. Töltsd fel a projektet GitHub-ra.
2. Vercel: **Import Project** → válaszd a repót.
3. Build: `npm run build`, output: `dist` (a gyökérben lévő `vercel.json` SPA rewrite-ot ad).

## Megjegyzés

Ha a Rust toolchain nincs telepítve, a frontend (`npm run build` / `npm run dev`) ettől függetlenül működik. Tauri desktop buildhez: https://tauri.app/start/prerequisites/
