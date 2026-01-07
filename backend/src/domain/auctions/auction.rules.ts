export interface AuctionConfig {
  // Minimum starting bid (inclusive)
  minBid: number;
  // Bid increment step that each new bid must exceed current highest by
  increment: number;
  // Optional reserve price — auction won't sell below this
  reservePrice?: number | null;
  // Maximum number of bids a single player can place (per auction)
  maxBidsPerPlayer?: number | null;
  // Duration of auction in seconds
  durationSeconds?: number;
  // Anti-sniping window: if a bid is placed within this many seconds of end, extend
  antiSnipingSeconds?: number;
  // How many seconds to extend when anti-sniping triggers
  autoExtendSeconds?: number;
  // Optional buy-now price which closes the auction immediately when met
  buyNowPrice?: number | null;
  // Optional allowed team IDs — if provided, only players from these teams may bid
  allowedTeams?: string[] | null;
  // Miscellaneous extra settings
  [key: string]: any;
}

export function validateAuctionConfig(input: any): AuctionConfig {
  if (!input || typeof input !== "object") throw new Error("auctionConfig must be an object");

  const cfg: AuctionConfig = {
    minBid: typeof input.minBid === "number" && input.minBid >= 0 ? input.minBid : 0,
    increment: typeof input.increment === "number" && input.increment > 0 ? input.increment : 1,
    reservePrice: typeof input.reservePrice === "number" ? input.reservePrice : null,
    maxBidsPerPlayer: typeof input.maxBidsPerPlayer === "number" && input.maxBidsPerPlayer > 0 ? input.maxBidsPerPlayer : null,
    durationSeconds: typeof input.durationSeconds === "number" && input.durationSeconds > 0 ? input.durationSeconds : 300,
    antiSnipingSeconds: typeof input.antiSnipingSeconds === "number" && input.antiSnipingSeconds >= 0 ? input.antiSnipingSeconds : 0,
    autoExtendSeconds: typeof input.autoExtendSeconds === "number" && input.autoExtendSeconds >= 0 ? input.autoExtendSeconds : 0,
    buyNowPrice: typeof input.buyNowPrice === "number" && input.buyNowPrice > 0 ? input.buyNowPrice : null,
    allowedTeams: Array.isArray(input.allowedTeams) ? input.allowedTeams.filter(Boolean) : null,
  };

  if (typeof cfg.reservePrice === 'number' && cfg.reservePrice < cfg.minBid) {
    throw new Error("reservePrice cannot be less than minBid");
  }

  if (typeof cfg.buyNowPrice === 'number' && cfg.buyNowPrice < cfg.minBid) {
    throw new Error("buyNowPrice cannot be less than minBid");
  }

  if (typeof cfg.antiSnipingSeconds === 'number' && cfg.antiSnipingSeconds > 0 && (typeof cfg.autoExtendSeconds !== 'number' || cfg.autoExtendSeconds <= 0)) {
    // sensible default: extend by anti-sniping window
    cfg.autoExtendSeconds = cfg.antiSnipingSeconds;
  }

  return cfg;
}

export function normalizeAuctionConfig(input: any) {
  return validateAuctionConfig(input);
}

export const STARTING_BUDGET = 1000;
export const ROSTER_SIZE = 9;

export function teamSlotsLeft(currentCount: number) {
  return Math.max(0, ROSTER_SIZE - currentCount);
}

