import { Construct } from "constructs";
import { RustLambdaFunction } from "./rust-lambda-function";
import { Architecture, Code, IFunction } from "aws-cdk-lib/aws-lambda";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import { Duration } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";

export interface TranscribeFunctionProps {
  eventSourceBucket: Bucket;
  dynamoDbTable: Table;
  vpc: IVpc;
  imageFrameFunction: IFunction;
}

export class TranscribeFunction extends Construct {
  public readonly rustFunction: RustLambdaFunction;

  constructor(scope: Construct, id: string, props: TranscribeFunctionProps) {
    super(scope, id);

    const { vpc, eventSourceBucket, dynamoDbTable, imageFrameFunction } = props;

    this.rustFunction = new RustLambdaFunction(this, "Function", {
      vpc,
      code: Code.fromAsset("../lambda/.dist/transcribe/"),
      architecture: Architecture.ARM_64,
      environment: {
        DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
        IMAGE_FRAME_FUNCTION_NAME: imageFrameFunction.functionName,
      },
      timeout: Duration.seconds(15),
    });
    imageFrameFunction.grantInvoke(this.rustFunction.func);
    dynamoDbTable.grantWriteData(this.rustFunction.func);
    eventSourceBucket.grantReadWrite(this.rustFunction.func);
    this.rustFunction.func.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["transcribe:*"],
        resources: ["*"],
      })
    );

    this.rustFunction.func.addEventSource(
      new S3EventSource(eventSourceBucket, {
        events: [EventType.OBJECT_CREATED],
        filters: [{ prefix: "video/" }],
      })
    );
  }
}
