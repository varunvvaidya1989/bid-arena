import { dynamo } from "../../db/dynamo";
import { PlayerRegistration } from "../tournaments/tournament.types";
import * as tournamentService from "../tournaments/tournament.service";

const TABLE = "AuctionTournaments";

export async function registerPlayer(tournamentId: string, input: { userId: string; name: string; teamId?: string | null }) {
  const t = await tournamentService.getTournament(tournamentId);
  if (!t) throw new Error("Tournament not found");

  const now = new Date().toISOString();
  const item: PlayerRegistration = {
    userId: input.userId,
    name: input.name,
    teamId: input.teamId || null,
    registeredAt: now
  };

  await dynamo.put({
    TableName: TABLE,
    Item: {
      PK: `TOURNAMENT#${tournamentId}`,
      SK: `PLAYER#${input.userId}`,
      ...item
    }
  }).promise();

  return item;
}

export async function listPlayers(tournamentId: string) {
  const result = await dynamo.query({
    TableName: TABLE,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `TOURNAMENT#${tournamentId}`
    }
  }).promise();

  return (result.Items || []).filter((it: any) => it.SK && it.SK.startsWith("PLAYER#")).map((it: any) => ({
    userId: it.userId,
    name: it.name,
    teamId: it.teamId,
    registeredAt: it.registeredAt
  }));
}
