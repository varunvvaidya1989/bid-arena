import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { AuctionDynamoDbStack } from './auction-stack';
import { AuctionConfigStack } from './auction-config-stack';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfraQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const app = new cdk.App();

    new AuctionDynamoDbStack(app, "AuctionDynamoDbStack", {
      env: {
        region: "ap-south-1"
      }
    });

    new AuctionConfigStack(app, "AuctionConfigStack", {
      env: {
        region: "ap-south-1"
      }
    });
  }
}
