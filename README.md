# Pokemon Matchups (Next.js)

This project uses Next.js App Router with:

- HeroUI for component styling
- Supabase for auth/data foundation
- Google OAuth (via Supabase Auth)
- Client-side worker simulation and charting for tournament runs

## Setup

1. Install dependencies:
   - `npm install`
2. Copy envs from `.env.example` into `.env.local` and fill values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Run the app:
   - `npm run dev`

## Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks

## Supabase

Database migrations live in `supabase/migrations`.
