import { Construct } from "constructs";
import { RustLambdaFunction } from "./rust-lambda-function";
import { Architecture, Code, IFunction } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { IQueue } from "aws-cdk-lib/aws-sqs";

export interface AppFunctionProps {
  readonly vpc: IVpc;
  readonly dynamoDbTable: ITable;
  readonly subtitleJobQueue: IQueue;
  readonly searchSubtitleFunction: IFunction;
}

export class AppFunction extends Construct {
  public readonly rustFunction: RustLambdaFunction;
  constructor(scope: Construct, id: string, props: AppFunctionProps) {
    super(scope, id);

    const { vpc, dynamoDbTable, subtitleJobQueue, searchSubtitleFunction } =
      props;

    this.rustFunction = new RustLambdaFunction(this, "Function", {
      vpc,
      code: Code.fromAsset("../app/.dist/app/"),
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(5),
    });
    dynamoDbTable.grantReadWriteData(this.rustFunction.func);
    subtitleJobQueue.grantSendMessages(this.rustFunction.func);
    searchSubtitleFunction.grantInvoke(this.rustFunction.func);
  }
}
