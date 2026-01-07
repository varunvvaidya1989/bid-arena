# Auction System — Design & API

This document describes the auction engine behavior (derived from provided spreadsheet) and the HTTP + Socket.IO API.

Rules
- Starting team budget: 1000
- Roster size (max players per team): 9
- AuctionConfig fields: `minBid`, `increment`, `durationSeconds`, `buyNowPrice`, `antiSnipingSeconds`, `autoExtendSeconds`, etc.
- Buy-now awards the player immediately to the bidding team if bid >= `buyNowPrice`.
- Teams cannot bid if they lack budget or roster slots.

Persistence
- Auction state is persisted to DynamoDB table `AuctionTournaments` under PK `TOURNAMENT#<id>` and SK `STATE#<id>`.
- On server startup the engine restores any stored states (scan for `STATE#` entries).

API Endpoints
- `POST /api/tournaments` — create tournament with `name` and `auctionConfig`.
- `POST /api/tournaments/:tournamentId/register` — register a player: `{ userId, name, teamId? }`.
- `POST /api/tournaments/:tournamentId/start` — start auction (optional `{ playerId }`).
- `POST /api/tournaments/:tournamentId/bid` — place bid `{ teamId, amount }`.
- `POST /api/tournaments/:tournamentId/finalize` — finalize auction; persists assignments and marks tournament `CLOSED`.

Socket.IO events
- `auction:bid` — emitted on new highest bid: `{ tournamentId, bid }`.
- `auction:award` — emitted when a player is awarded immediately: `{ tournamentId, playerId, teamId, price }`.
- `auction:finalize` — emitted when auction is finalized.
- `auction:restore` — emitted during startup when a persisted auction state is restored.

Next steps
- Add unit tests for `auction.engine` behavior (buy-now, budget checks, roster limits).
- Optionally migrate scan-based restore to an indexed query for scalability.
