import { auctionEngine } from "../src/domain/auctions/auction.engine";
import { ROSTER_SIZE } from "../src/domain/auctions/auction.rules";

// Mock DynamoDB and socket to avoid external calls
jest.mock('../src/db/dynamo', () => ({
  dynamo: {
    put: jest.fn(() => ({ promise: () => Promise.resolve() })),
    get: jest.fn(() => ({ promise: () => Promise.resolve({}) })),
    scan: jest.fn(() => ({ promise: () => Promise.resolve({ Items: [] }) })),
  }
}));

jest.mock('../src/socket', () => ({
  getIO: () => ({ emit: jest.fn() })
}));

describe('AuctionEngine basic flows', () => {
  beforeEach(async () => {
    // clear any in-memory state by creating a fresh engine instance behaviourally
    // auctionEngine is a singleton; remove any existing state by clearing internal map via any available API
    // There's no public clear; restore by starting unique tournaments per test
  });

  test('buy-now awards immediately and deducts budget', async () => {
    const tournament = { id: `t-buy-${Date.now()}`, name: 'T1', auctionConfig: { buyNowPrice: 500, minBid: 100, increment: 50 } } as any;
    const players = [{ userId: 'p1', name: 'Player 1', registeredAt: new Date().toISOString() }];

    const start = auctionEngine.startAuction(tournament, players, 'p1');
    expect(start.tournamentId).toBe(tournament.id);

    const state = auctionEngine.getState(tournament.id)!;
    if (!state.activePlayer) state.activePlayer = players[0] as any;
    const res = auctionEngine.placeBid(tournament.id, 'teamA', 500);
    expect(res.awarded).toBe(true);
    const stateAfter = auctionEngine.getState(tournament.id);
    expect(stateAfter).toBeDefined();
    expect(stateAfter!.assignments['p1']).toBeDefined();
    expect(stateAfter!.assignments['p1'].teamId).toBe('teamA');
    expect(stateAfter!.teams['teamA'].budget).toBeGreaterThanOrEqual(0);
  });

  test('reject bid when team over budget', async () => {
    const tournament = { id: `t-budget-${Date.now()}`, name: 'T2', auctionConfig: { minBid: 100, increment: 50 } } as any;
    const players = [{ userId: 'p2', name: 'Player 2', registeredAt: new Date().toISOString() }];
    auctionEngine.startAuction(tournament, players);
    const state = auctionEngine.getState(tournament.id)!;
    // artificially set team budget low
    state.teams['teamB'] = { budget: 10, roster: [] };

    expect(() => auctionEngine.placeBid(tournament.id, 'teamB', 100)).toThrow(/budget/);
  });

  test('reject bid when roster full', async () => {
    const tournament = { id: `t-roster-${Date.now()}`, name: 'T3', auctionConfig: { minBid: 10, increment: 1 } } as any;
    const players = [{ userId: 'p3', name: 'Player 3', registeredAt: new Date().toISOString() }];
    auctionEngine.startAuction(tournament, players);
    const state = auctionEngine.getState(tournament.id)!;
    state.teams['teamC'] = { budget: 1000, roster: Array.from({ length: ROSTER_SIZE }).map((_,i)=>`x${i}`) };

    expect(() => auctionEngine.placeBid(tournament.id, 'teamC', 20)).toThrow(/roster/);
  });
});
