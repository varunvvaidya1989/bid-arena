import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION
});
export const cognito = new AWS.CognitoIdentityServiceProvider(); 