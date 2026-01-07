import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class AuctionDynamoDbStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * AuctionUsers Table
     */
    const auctionUsersTable = new dynamodb.Table(
      this,
      "AuctionUsersTable",
      {
        tableName: "AuctionUsers",

        partitionKey: {
          name: "PK",
          type: dynamodb.AttributeType.STRING
        },

        sortKey: {
          name: "SK",
          type: dynamodb.AttributeType.STRING
        },

        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

        removalPolicy: RemovalPolicy.DESTROY // ❗ dev only
      }
    );

    /**
     * GSI: Query users by userId (future-proof)
     */
    auctionUsersTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING
      }
    });

    /**
     * AuctionTournaments Table - stores tournament meta, players, assignments and state
     */
    const auctionTournamentsTable = new dynamodb.Table(this, "AuctionTournamentsTable", {
      tableName: "AuctionTournaments",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // GSI to query by SK values if needed (e.g., find all STATE# entries)
    auctionTournamentsTable.addGlobalSecondaryIndex({
      indexName: 'GSI_SK',
      partitionKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'PK', type: dynamodb.AttributeType.STRING }
    });
  }
}
