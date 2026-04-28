# External Data Contract

The app intentionally has no active external tournament provider integration.

## Provider interface

Implement `ExternalDataProvider` in `src/lib/external-data/service.ts`:

- `listRecentTournaments(): Promise<ExternalTournamentSummary[]>`
- `importMetaFromTournament(tournamentId: string): Promise<ExternalMetaSnapshot>`

## API placeholders

- `GET /api/external-data/tournaments` returns `{ data: ExternalTournamentSummary[] }`
- `POST /api/external-data/import` accepts `{ tournamentId: string }`
  - Success: `{ data: ExternalMetaSnapshot }`
  - Failure: `{ error: { code: string; message: string } }`

## Error shape requirements

- Always return machine-readable `error.code` and user-readable `error.message`.
- Use `400` for malformed requests and `501` when a provider is not configured.
