import { Construct } from "constructs";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { RustLambdaFunction } from "./rust-lambda-function";
import { Architecture, Code, FileSystem } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { IAccessPoint } from "aws-cdk-lib/aws-efs";

export interface SearchSubtitleFunctionProps {
  readonly vpc: IVpc;
  readonly tantivyAccessPoint: IAccessPoint;
}

export class SearchSubtitleFunction extends Construct {
  public readonly rustFunction: RustLambdaFunction;
  constructor(
    scope: Construct,
    id: string,
    props: SearchSubtitleFunctionProps
  ) {
    super(scope, id);

    const { vpc, tantivyAccessPoint } = props;

    const mountPath = "/mnt/tantivy";

    this.rustFunction = new RustLambdaFunction(this, "Function", {
      vpc,
      code: Code.fromAsset("../lambda/.dist/search_subtitle/"),
      architecture: Architecture.ARM_64,
      environment: {
        TANTIVY_MOUNT: mountPath,
      },
      timeout: Duration.seconds(5),
      memorySize: 512,
      filesystem: FileSystem.fromEfsAccessPoint(tantivyAccessPoint, mountPath),
    });
  }
}
