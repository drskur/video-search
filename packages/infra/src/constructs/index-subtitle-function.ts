import { Construct } from "constructs";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { RustLambdaFunction } from "./rust-lambda-function";
import { Architecture, Code, FileSystem } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { IAccessPoint } from "aws-cdk-lib/aws-efs";
import { ITopic } from "aws-cdk-lib/aws-sns";
import { SnsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface IndexSubtitleFunctionProps {
  readonly vpc: IVpc;
  readonly tantivyAccessPoint: IAccessPoint;
  readonly subtitleResultTopic: ITopic;
}

export class IndexSubtitleFunction extends Construct {
  public readonly rustFunction: RustLambdaFunction;
  constructor(scope: Construct, id: string, props: IndexSubtitleFunctionProps) {
    super(scope, id);

    const { vpc, tantivyAccessPoint, subtitleResultTopic } = props;

    const mountPath = "/mnt/tantivy";

    this.rustFunction = new RustLambdaFunction(this, "Function", {
      vpc,
      code: Code.fromAsset("../lambda/.dist/index_subtitle/"),
      architecture: Architecture.ARM_64,
      environment: {
        TANTIVY_MOUNT: mountPath,
      },
      timeout: Duration.seconds(300),
      memorySize: 512,
      filesystem: FileSystem.fromEfsAccessPoint(tantivyAccessPoint, mountPath),
    });

    this.rustFunction.func.addEventSource(
      new SnsEventSource(subtitleResultTopic)
    );
  }
}
