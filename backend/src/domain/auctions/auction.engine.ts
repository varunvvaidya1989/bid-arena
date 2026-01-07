import { Tournament, PlayerRegistration } from "../tournaments/tournament.types";
import { STARTING_BUDGET, ROSTER_SIZE } from "./auction.rules";
import { dynamo } from "../../db/dynamo";
import { getIO } from "../../socket";

type Bid = { teamId: string; amount: number; ts: string };

type AuctionState = {
  tournament: Tournament;
  players: PlayerRegistration[];
  bids: Bid[];
  highest?: Bid | null;
  endsAt?: number;
  activePlayer?: PlayerRegistration | null;
  teams: Record<string, { budget: number; roster: string[] }>;
  assignments: Record<string, { teamId: string; price: number }>; // playerId -> assignment
};

export class AuctionEngine {
  private state = new Map<string, AuctionState>();

  // restore active auction states from DynamoDB
  async init() {
    try {
      const res = await dynamo.scan({ TableName: 'AuctionTournaments',
        FilterExpression: 'begins_with(#sk, :s)',
        ExpressionAttributeNames: { '#sk': 'SK' },
        ExpressionAttributeValues: { ':s': 'STATE#' }
      }).promise();

      const items = res.Items || [];
      for (const it of items as any[]) {
        const tid = it.tournamentId;
        if (!tid) continue;
        // restore into memory
        await this.restoreState(tid);
        try { getIO().emit('auction:restore', { tournamentId: tid }); } catch(e) {}
      }
    } catch (err) {
      console.error('auction engine init error', err);
    }
  }

  startAuction(tournament: Tournament, players: PlayerRegistration[], activePlayerId?: string) {
    const now = Date.now();
    const duration = (tournament.auctionConfig?.durationSeconds || 300) * 1000;
    const endsAt = now + duration;

    const teams: Record<string, { budget: number; roster: string[] }> = {};
    // teams will be created lazily when they bid, but pre-seed from any known teamIds on players
    for (const p of players) {
      if (p.teamId && !teams[p.teamId]) teams[p.teamId] = { budget: STARTING_BUDGET, roster: [] };
    }

    const active = activePlayerId ? players.find(p => p.userId === activePlayerId) || null : players.length ? players[0] : null;

    const s: AuctionState = {
      tournament,
      players,
      bids: [],
      highest: null,
      endsAt,
      activePlayer: active,
      teams,
      assignments: {}
    };

    this.state.set(tournament.id, s);
    // persist state
    this.persistState(tournament.id, s).catch(err => console.error('persist start error', err));
    return { tournamentId: tournament.id, endsAt, activePlayer: active?.userId || null };
  }

  private ensureTeam(s: AuctionState, teamId: string) {
    if (!s.teams[teamId]) s.teams[teamId] = { budget: STARTING_BUDGET, roster: [] };
    return s.teams[teamId];
  }

  placeBid(tournamentId: string, teamId: string, amount: number) {
    const s = this.state.get(tournamentId);
    if (!s) throw new Error("Auction not running");
    if (!s.activePlayer) throw new Error("No active player being auctioned");
    const now = Date.now();
    if (s.endsAt && now > s.endsAt) throw new Error("Auction ended");

    const min = s.tournament.auctionConfig?.minBid ?? 0;
    const inc = s.tournament.auctionConfig?.increment ?? 1;
    const current = s.highest?.amount ?? 0;
    const required = current > 0 ? current + inc : min;
    if (amount < required) throw new Error(`Bid must be >= ${required}`);

    const team = this.ensureTeam(s, teamId);
    if (team.roster.length >= ROSTER_SIZE) throw new Error("Team has no roster slots left");
    if (team.budget < amount) throw new Error("Team does not have enough budget for this bid");

    const bid: Bid = { teamId, amount, ts: new Date().toISOString() };
    s.bids.push(bid);
    s.highest = bid;

    // buy-now
    const buyNow = s.tournament.auctionConfig?.buyNowPrice ?? null;
    if (buyNow !== null && amount >= buyNow) {
      // award immediately
      const awardedPlayerId = s.activePlayer!.userId;
      this.awardPlayer(s, awardedPlayerId, teamId, amount);
      // persist and notify
      this.persistState(tournamentId, s).catch(err => console.error('persist award error', err));
      try { getIO().emit('auction:award', { tournamentId, playerId: awardedPlayerId, teamId, price: amount }); } catch(e) {}
      return { bid, awarded: true, playerId: awardedPlayerId };
    }

    // persist and notify new high bid
    this.persistState(tournamentId, s).catch(err => console.error('persist bid error', err));
    try { getIO().emit('auction:bid', { tournamentId, bid }); } catch(e) {}

    return { bid, awarded: false };
  }

  private awardPlayer(s: AuctionState, playerUserId: string, teamId: string, price: number) {
    const team = this.ensureTeam(s, teamId);
    team.budget -= price;
    team.roster.push(playerUserId);
    s.assignments[playerUserId] = { teamId, price };

    // remove player from available list
    s.players = s.players.filter(p => p.userId !== playerUserId);
    s.activePlayer = s.players.length ? s.players[0] : null;
    s.bids = [];
    s.highest = null;
  }

  async persistState(tournamentId: string, s: AuctionState) {
    const item = {
      PK: `TOURNAMENT#${tournamentId}`,
      SK: `STATE#${tournamentId}`,
      tournamentId,
      teams: s.teams,
      assignments: s.assignments,
      players: s.players,
      highest: s.highest,
      endsAt: s.endsAt,
      activePlayerId: s.activePlayer?.userId || null,
      updatedAt: new Date().toISOString()
    };
    await dynamo.put({ TableName: 'AuctionTournaments', Item: item }).promise();
  }

  async restoreState(tournamentId: string) {
    const result = await dynamo.get({ TableName: 'AuctionTournaments', Key: { PK: `TOURNAMENT#${tournamentId}`, SK: `STATE#${tournamentId}` } }).promise();
    if (!result.Item) return null;
    const it: any = result.Item;
    const s: AuctionState = {
      tournament: it.tournamentId ? ({ id: it.tournamentId } as any) : ({} as any),
      players: it.players || [],
      bids: [],
      highest: it.highest || null,
      endsAt: it.endsAt,
      activePlayer: (it.activePlayerId ? { userId: it.activePlayerId } : null) as any,
      teams: it.teams || {},
      assignments: it.assignments || {}
    };
    this.state.set(tournamentId, s);
    return s;
  }

  getState(tournamentId: string) {
    return this.state.get(tournamentId);
  }
}

export const auctionEngine = new AuctionEngine();
