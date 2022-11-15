import { Construct } from "constructs";
import { RustLambdaFunction } from "./rust-lambda-function";
import { Architecture, Code, IFunction } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { IQueue } from "aws-cdk-lib/aws-sqs";
import { IDistribution } from "aws-cdk-lib/aws-cloudfront";

export interface AppFunctionProps {
  readonly vpc: IVpc;
  readonly dynamoDbTable: ITable;
  readonly subtitleJobQueue: IQueue;
  readonly searchSubtitleFunction: IFunction;
  readonly distribution: IDistribution;
}

export class AppFunction extends Construct {
  public readonly rustFunction: RustLambdaFunction;
  constructor(scope: Construct, id: string, props: AppFunctionProps) {
    super(scope, id);

    const {
      vpc,
      dynamoDbTable,
      subtitleJobQueue,
      searchSubtitleFunction,
      distribution,
    } = props;

    this.rustFunction = new RustLambdaFunction(this, "Function", {
      vpc,
      code: Code.fromAsset("../app/.dist/app/"),
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(5),
      environment: {
        CONTENT_HOST: distribution.distributionDomainName,
        DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
        TANTIVY_SEARCH_FUNCTION_NAME: searchSubtitleFunction.functionName,
        SUBTITLE_QUEUE_URL: subtitleJobQueue.queueUrl,
      },
    });
    dynamoDbTable.grantReadWriteData(this.rustFunction.func);
    subtitleJobQueue.grantSendMessages(this.rustFunction.func);
    searchSubtitleFunction.grantInvoke(this.rustFunction.func);
  }
}
