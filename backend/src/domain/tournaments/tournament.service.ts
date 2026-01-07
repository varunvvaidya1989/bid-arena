import { randomUUID } from "crypto";
import { dynamo } from "../../db/dynamo";
import { Tournament } from "./tournament.types";
import { validateAuctionConfig } from "../auctions/auction.rules";

const TABLE = "AuctionTournaments";

export async function createTournament(input: {
  name: string;
  auctionConfig: any;
}) {
  const id = randomUUID();
  const now = new Date().toISOString();

  const auctionConfig = validateAuctionConfig(input.auctionConfig || {});

  const item: Tournament = {
    id,
    name: input.name,
    auctionConfig,
    status: "CREATED",
    createdAt: now
  };

  await dynamo.put({
    TableName: TABLE,
    Item: {
      PK: `TOURNAMENT#${id}`,
      SK: `META#${id}`,
      ...item
    }
  }).promise();

  return item;
}

export async function getTournament(tournamentId: string) {
  const result = await dynamo.get({
    TableName: TABLE,
    Key: {
      PK: `TOURNAMENT#${tournamentId}`,
      SK: `META#${tournamentId}`
    }
  }).promise();

  return result.Item as Tournament | undefined;
}

export async function listTournaments() {
  const result = await dynamo.scan({ TableName: TABLE }).promise();
  const items = (result.Items || []).filter((it: any) => it.SK && it.SK.startsWith("META#"));
  return items.map((it: any) => ({
    id: it.id,
    name: it.name,
    auctionConfig: it.auctionConfig,
    status: it.status,
    createdAt: it.createdAt
  } as Tournament));
}

export async function deleteTournament(tournamentId: string) {
  await dynamo.delete({
    TableName: TABLE,
    Key: {
      PK: `TOURNAMENT#${tournamentId}`,
      SK: `META#${tournamentId}`
    }
  }).promise();
}

export async function updateTournamentStatus(tournamentId: string, status: Tournament['status']) {
  // fetch current meta
  const meta = await getTournament(tournamentId);
  if (!meta) throw new Error('Tournament not found');
  meta.status = status;
  await dynamo.put({
    TableName: TABLE,
    Item: {
      PK: `TOURNAMENT#${tournamentId}`,
      SK: `META#${tournamentId}`,
      ...meta
    }
  }).promise();
}

export async function saveAssignment(tournamentId: string, playerId: string, teamId: string, price: number) {
  await dynamo.put({
    TableName: TABLE,
    Item: {
      PK: `TOURNAMENT#${tournamentId}`,
      SK: `ASSIGN#${playerId}`,
      playerId,
      teamId,
      price,
      assignedAt: new Date().toISOString()
    }
  }).promise();
}
