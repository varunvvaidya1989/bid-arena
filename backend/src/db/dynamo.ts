import AWS from "aws-sdk";

AWS.config.update({ region: "ap-south-1" });

export const dynamo = new AWS.DynamoDB.DocumentClient();
