export interface AuctionConfig {
  minBid: number;
  increment: number;
  reservePrice?: number | null;
  maxBidsPerPlayer?: number | null;
  durationSeconds?: number | null;
  antiSnipingSeconds?: number | null;
  autoExtendSeconds?: number | null;
  buyNowPrice?: number | null;
  allowedTeams?: string[] | null;
  [key: string]: any;
}

export interface Tournament {
  id: string;
  name: string;
  auctionConfig: AuctionConfig;
  status: "CREATED" | "OPEN" | "RUNNING" | "CLOSED";
  createdAt: string;
}

export interface PlayerRegistration {
  userId: string;
  name: string;
  teamId?: string | null;
  registeredAt: string;
}
