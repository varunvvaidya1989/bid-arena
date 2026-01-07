# Auction Engine — Suggestions & Next Steps

This document captures findings and recommended next steps for the auction engine implementation.

## Summary of current implementation
- Auction start/stop basic flow (`startAuction`) with `endsAt` set from config.
- Bid placement with `minBid` and `increment` rules implemented (`placeBid`).
- Buy-now immediate award when bid >= `buyNowPrice`.
- Team budget and roster slot checks are enforced.
- Persistence to DynamoDB (`persistState`, `restoreState`) and in-memory state map exist.
- Socket event emits are present via `getIO().emit(...)` for `auction:bid`, `auction:award`, and `auction:restore`.

## Missing or incomplete features
- Anti-sniping / auto-extend: config supported but `endsAt` extension not implemented.
- Automatic auction finalization: no `finalizeAuction()` or timer/worker to close auctions at `endsAt`.
- Reserve price: config exists but not enforced at finalize/award time.
- `maxBidsPerPlayer`: not tracked or enforced.
- `allowedTeams`: config ignored by engine.
- Periodic countdown / timer events: not implemented (engine has no scheduler to emit countdowns).
- Multi-instance coordination: no pub/sub or adapter for cross-instance event distribution.

## Recommended next steps (prioritized)
1. Implement `finalizeAuction(tournamentId)` to close auctions, enforce `reservePrice`, persist final assignments, and emit `auction:finalize`.
2. Add anti-sniping logic: when a bid occurs within `antiSnipingSeconds` of `endsAt`, extend `endsAt` by `autoExtendSeconds` and persist.
3. Implement per-player bid counting and enforce `maxBidsPerPlayer`.
4. Enforce `allowedTeams` during `placeBid`.
5. Add a scheduler or background worker to check `endsAt` and call `finalizeAuction` (can be in-process for single node or external for robust scheduling).
6. Emit periodic countdown events (e.g., every second or configurable interval) from the engine to keep clients in sync.
7. Improve test coverage: add unit tests for buy-now, reserve, anti-sniping extension, finalize logic, budget/roster limits, and per-player bid limits.
8. For scaling, add a pub/sub adapter (Redis/SNS) so socket servers and engine instances share events and state notifications.

## Quick fixes to unblock tests and CI
- Add `socket.io` to `backend/package.json` dependencies or mock the socket module in unit tests so `src/socket.ts` does not cause test failures.

## Notes
- Persistence currently uses a table named `AuctionTournaments` with PK `TOURNAMENT#<id>` and SK `STATE#<id>`; consider using a GSI or query pattern for scalable state discovery.
- Ensure critical state transitions (award/finalize) are persisted before emitting final events to avoid loss on restart.

If you want, I can implement one of the recommended items now (pick one), add unit tests, or modify `package.json` to fix the test failure.
