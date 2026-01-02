export type Role =
  | "ADMIN"
  | "AUCTION_OWNER"
  | "CAPTAIN"
  | "VIEWER";

export interface AuthUser {
  userId: string;
  role: Role;
  auctionId?: string;
  teamId?: string;
}
