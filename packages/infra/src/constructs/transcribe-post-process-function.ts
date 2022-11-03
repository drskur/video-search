import { Construct } from "constructs";
import { RustLambdaFunction } from "./rust-lambda-function";
import { Architecture, Code } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { IQueue } from "aws-cdk-lib/aws-sqs";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

export interface TranscribePostProcessFunctionProps {
  readonly vpc: IVpc;
  readonly dynamoDbTable: ITable;
  readonly subtitleJobQueue: IQueue;
}

export class TranscribePostProcessFunction extends Construct {
  public readonly rustFunction: RustLambdaFunction;
  public readonly transcribeJobCompletedRule: Rule;

  constructor(
    scope: Construct,
    id: string,
    props: TranscribePostProcessFunctionProps
  ) {
    super(scope, id);

    const { vpc, dynamoDbTable, subtitleJobQueue } = props;

    this.rustFunction = new RustLambdaFunction(this, "Function", {
      vpc,
      code: Code.fromAsset("../lambda/.dist/transcribe_post_process/"),
      architecture: Architecture.ARM_64,
      environment: {
        DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
        QUEUE_URL: subtitleJobQueue.queueUrl,
      },
      timeout: Duration.seconds(15),
    });
    dynamoDbTable.grantReadWriteData(this.rustFunction.func);
    subtitleJobQueue.grantSendMessages(this.rustFunction.func);

    this.transcribeJobCompletedRule = new Rule(
      this,
      "TranscribeJobCompletedRule",
      {
        eventPattern: {
          source: ["aws.transcribe"],
          detailType: ["Transcribe Job State Change"],
          detail: {
            TranscriptionJobStatus: ["COMPLETED"],
          },
        },
      }
    );
    this.transcribeJobCompletedRule.addTarget(
      new LambdaFunction(this.rustFunction.func)
    );
  }
}
