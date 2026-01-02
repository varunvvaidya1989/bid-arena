import { cognito } from "../auth/cognito";
import { dynamo } from "../db/dynamo";

const TABLE = "AuctionUsers";

/**
 * CREATE USER
 */
export async function createUser(input: {
  email: string;
  name: string;
  role: string;
  auctionId: string;
  teamId?: string;
}) {
  // 1. Create user in Cognito
  const result = await cognito.adminCreateUser({
    UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    Username: input.email,
    UserAttributes: [
      { Name: "email", Value: input.email },
      { Name: "email_verified", Value: "true" },
      { Name: "custom:role", Value: input.role },
      { Name: "custom:auctionId", Value: input.auctionId },
      { Name: "custom:teamId", Value: input.teamId || "" }
    ]
  }).promise();

  const userId = result.User!.Username!;

  // 2. Store auction mapping in DynamoDB
  await dynamo.put({
    TableName: TABLE,
    Item: {
      PK: `AUCTION#${input.auctionId}`,
      SK: `USER#${userId}`,
      email: input.email,
      name: input.name,
      role: input.role,
      teamId: input.teamId || null,
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    }
  }).promise();

  return { userId };
}

/**
 * DELETE USER
 */
export async function deleteUser(
  userId: string,
  auctionId: string
) {
  // 1. Disable user in Cognito
  await cognito.adminDisableUser({
    UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    Username: userId
  }).promise();

  // 2. Remove mapping from DynamoDB
  await dynamo.delete({
    TableName: TABLE,
    Key: {
      PK: `AUCTION#${auctionId}`,
      SK: `USER#${userId}`
    }
  }).promise();
}

/**
 * LIST USERS FOR AN AUCTION
 */
export async function listUsers(auctionId: string) {
  const result = await dynamo.query({
    TableName: TABLE,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `AUCTION#${auctionId}`
    }
  }).promise();

  return (result.Items || []).map(item => ({
    userId: item.SK.replace("USER#", ""),
    name: item.name,
    email: item.email,
    role: item.role,
    teamId: item.teamId,
    status: item.status
  }));
}
