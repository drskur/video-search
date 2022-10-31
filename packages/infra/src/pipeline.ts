import * as cdk from "aws-cdk-lib";
import { ApplicationStage } from "./application-stage";
import { PipelineStack } from "./pipeline-stack";

const app = new cdk.App();

const pipelineStack = new PipelineStack(app, "PipelineStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: process.env.CDK_DEFAULT_REGION!,
  },
});

const devStage = new ApplicationStage(app, "Dev", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!, // Replace with Dev account
    region: process.env.CDK_DEFAULT_REGION!, // Replace with Dev region
  },
});

pipelineStack.pipeline.addStage(devStage);

// Add additional stages here i.e. Prod

app.synth();
