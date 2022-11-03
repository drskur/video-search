import { Construct } from "constructs";
import { RustLambdaFunction } from "./rust-lambda-function";
import { Architecture, Code } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { ITopic } from "aws-cdk-lib/aws-sns";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { IQueue } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export interface SubtitleFunctionProps {
  vpc: IVpc;
  dynamoDbTable: ITable;
  mediaSourceBucket: IBucket;
  subtitleResultTopic: ITopic;
  subtitleJobQueue: IQueue;
}

export class SubtitleFunction extends Construct {
  public readonly rustFunction: RustLambdaFunction;

  constructor(scope: Construct, id: string, props: SubtitleFunctionProps) {
    super(scope, id);

    const {
      vpc,
      dynamoDbTable,
      mediaSourceBucket,
      subtitleResultTopic,
      subtitleJobQueue,
    } = props;

    this.rustFunction = new RustLambdaFunction(this, "Function", {
      vpc,
      code: Code.fromAsset("../lambda/.dist/subtitle/"),
      architecture: Architecture.ARM_64,
      environment: {
        DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
        BUCKET_NAME: mediaSourceBucket.bucketName,
        TOPIC_ARN: subtitleResultTopic.topicArn,
      },
      timeout: Duration.seconds(15),
    });
    dynamoDbTable.grantReadWriteData(this.rustFunction.func);
    mediaSourceBucket.grantReadWrite(this.rustFunction.func);
    subtitleResultTopic.grantPublish(this.rustFunction.func);
    this.rustFunction.func.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["translate:*"],
        resources: ["*"],
      })
    );

    this.rustFunction.func.addEventSource(
      new SqsEventSource(subtitleJobQueue, {
        batchSize: 1,
      })
    );
  }
}
