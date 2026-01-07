# bid-arena
A concise description

BidArena is a real-time, config-driven player auction system. It provides a lightweight backend for running auctions, player services, and tournament logic, plus infrastructure-as-code for deploying to AWS.

**Quick Links**
- **Code:** [backend](backend)
- **Infrastructure (CDK):** [infra](infra)
- **AWS helpers / scripts:** [aws](aws)
- **Data / formulas:** [files/formulas.json](files/formulas.json)

**Project Structure**
- **backend**: Node/TypeScript backend server (API + WebSocket auction engine). See [backend/src](backend/src) and API entry [backend/src/server.ts](backend/src/server.ts#L1).
- **infra**: AWS CDK stacks for deploying the auction service. See [infra/lib](infra/lib).
- **aws**: helper scripts and deployment utilities.
- **files**: static configuration such as auction formulas.

**Backend: run & develop**
- Install dependencies: `cd backend && npm install`
# bid-arena

BidArena is a real-time, config-driven player auction system. It provides a backend for running auctions, player services, and tournament logic, plus infrastructure-as-code for deploying to AWS.

**Quick Links**
- **Code:** [backend](backend)
- **Infrastructure (CDK):** [infra](infra)
- **AWS helpers / scripts:** [aws](aws)
- **Data / formulas:** [files/formulas.json](files/formulas.json)

**Project Structure**
- **backend**: Node + TypeScript backend server (REST API + WebSocket auction engine). See [backend/src](backend/src).
- **infra**: AWS CDK stacks for deploying the auction service. See [infra/lib](infra/lib).
- **aws**: helper scripts and deployment utilities.
- **files**: static configuration such as auction formulas.

**Getting started (backend)**
- Install dependencies:

```bash
cd backend
npm install
```

- Development server (auto-reload):

```bash
npm run dev
```

- Build (TypeScript) and run production:

```bash
npm run build
npm run start
```

- Tests:

```bash
npm test
```

The backend reads environment variables (see [backend/.env.local](backend/.env.local)). Use that file for local overrides.

**Architecture Overview**
- **Entry point:** `backend/src/server.ts` creates the HTTP server and wires the Express app and WebSocket server ([backend/src/server.ts](backend/src/server.ts#L1)).
- **App composition:** `backend/src/app.ts` builds middleware and routes; `backend/src/rootRoutes.ts` mounts top-level routes ([backend/src/rootRoutes.ts](backend/src/rootRoutes.ts#L1)).
- **Domain layers:** Business logic is organized under `backend/src/domain` by concern (auctions, tournaments, players). Engines and services implement rules and state transitions.
- **DB layer:** `backend/src/db/dynamo.ts` encapsulates DynamoDB access for persistence.
- **Static config:** `files/formulas.json` and other static resources drive rules and calculations.

**Startup Flow (request lifecycle)**
- On start, the server loads env variables, initializes the Express app, and attaches the WebSocket server to the same HTTP server.
- HTTP requests are handled by Express routes (auth, users, tournaments, etc.).
- Socket connections are accepted by the WebSocket server and authenticated (if token provided) using shared auth helpers.

**HTTP APIs & Routes (high level)**
- **Auth / Login:** `backend/src/auth/login.routes.ts` and middleware `backend/src/auth/auth.middleware.ts` manage login and protect routes. Cognito helpers in `backend/src/auth/cognito.ts` abstract token verification ([backend/src/auth/auth.middleware.ts](backend/src/auth/auth.middleware.ts#L1)).
- **Users:** `backend/src/users/user.routes.ts` exposes user-related endpoints.
- **Tournaments & Auctions:** `backend/src/domain/tournaments/tournament.routes.ts` and tournament service implement tournament lifecycle and composition of auctions ([backend/src/domain/tournaments/tournament.routes.ts](backend/src/domain/tournaments/tournament.routes.ts#L1)).
- **Docs:** See `backend/docs/AUCTION.md` for auction-specific rules and flows.

**WebSocket / Real-time design**
- **Socket entry:** `backend/src/socket.ts` manages client connections and message routing ([backend/src/socket.ts](backend/src/socket.ts#L1)).
- **Connection:** Client opens a socket to the server; the server optionally validates a token via the same auth helpers used by HTTP.
- **Rooms/subscriptions:** Clients are grouped by auction/tournament channels (rooms). When a client joins an auction, they are subscribed to that auction's updates.
- **Client -> Server messages:** Typical actions include `join_auction`, `place_bid`, `leave_auction`, `subscribe_tournament`. Handlers forward these to domain services/engines.
- **Server -> Client events:** Engine emits events such as `auction_state`, `highest_bid`, `bid_rejected`, `auction_result`, and `countdown`. Socket layer broadcasts to subscribed clients.
- **Engine integration:** `backend/src/domain/auctions/auction.engine.ts` enforces auction rules (`auction.rules.ts`), updates state (in-memory and/or persisted), and emits domain events that the socket layer relays.

Example socket message shapes (illustrative):

```json
// Place bid (client -> server)
{
	"type": "place_bid",
	"auctionId": "auction-123",
	"userId": "user-abc",
	"amount": 150
}

// Highest bid update (server -> clients)
{
	"type": "highest_bid",
	"auctionId": "auction-123",
	"bid": { "userId": "user-abc", "amount": 150, "time": 1670000000 }
}
```

**Auth & Security**
- Uses JWT/Cognito helpers for login and token verification. Auth is enforced by middleware for HTTP and during socket handshake for real-time connections.
- Enforce role checks (Admin/Captain) at the route or service layer before state-changing operations.
- Use HTTPS and secure token storage in production.

**Persistence & State management**
- **Ephemeral:** Auction engine may keep fast-changing state in memory for responsiveness (current highest bid, timers).
- **Persistent:** Important entities (players, historical auction results, tournament metadata) are stored via `db/dynamo.ts` in DynamoDB.
- For reliability, important state transitions should be persisted or checkpointed so a restarted instance can recover.

**Scaling & Reliability**
- Single-node: sockets and engine run in-process (simple, low-latency).
- Multi-node: introduce a pub/sub (Redis, SNS, or a socket adapter) so socket instances receive engine events and engines coordinate state.
- Persist timers and critical transitions, or use an external scheduler if auctions must survive restarts.

**Infrastructure & Deployment**
- CDK stacks live under `infra`. They define AWS resources such as DynamoDB tables and any supporting services.
- Typical deploy flow (from `infra`):

```bash
cd infra
npm install
# follow infra/README for cdk synth/deploy steps
```

**Developer tips**
- Local env: copy or inspect [backend/.env.local](backend/.env.local) for required variables.
- Run tests: `cd backend && npm test`.
- Inspect core logic: auction engine (`backend/src/domain/auctions/auction.engine.ts`) and socket handler (`backend/src/socket.ts`).

**Next steps I can help with**
- Run `backend` tests and report results.
- Extract socket event shapes into a short spec or OpenAPI-style doc.
- Add a real-time sequence diagram for auction flows.

If you want any of the above, tell me which one to do next.

**Sequence diagram**

High-level client ↔ server auction flow is available in: [docs/sequence-diagram.md](docs/sequence-diagram.md)


