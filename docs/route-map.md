# Route Map

This document maps the previous single-page tab flow to Next.js App Router routes.

## Legacy view mapping

- Legacy `analyzer` tab from `src/App.tsx` -> `app/analyzer/page.tsx`
- Legacy `simulator` tab from `src/App.tsx` -> `app/simulator/page.tsx`
- Legacy app shell/title/nav from `src/App.tsx` -> `app/layout.tsx` + `components/layout/top-nav.tsx`

## Shared state boundaries

- Uploaded matchup CSV data, play rates, and analyzer results become a shared client store in `components/providers/matchup-provider.tsx`.
- Simulator reads matchup/play-rate state from the shared provider instead of tab prop drilling.

## SSR/Client boundaries

- `app/analyzer/page.tsx` and `app/simulator/page.tsx` render server route shells, then mount client components.
- Browser-only logic (`localStorage`, web workers, charts) stays in client components under `components/features/*`.

## External data boundary

- Future API imports are isolated behind `lib/external-data/service.ts` and are not wired to any provider yet.
