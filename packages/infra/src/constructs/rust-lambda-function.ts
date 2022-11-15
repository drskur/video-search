import { Construct } from "constructs";
import { Architecture, Code, Runtime, Function } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { FileSystem } from "aws-cdk-lib/aws-lambda";

export interface RustLambdaFunctionProps {
  functionName?: string;
  code: Code;
  architecture: Architecture;
  vpc?: IVpc;
  timeout?: Duration;
  readonly environment?: {
    [key: string]: string;
  };
  filesystem?: FileSystem;
  memorySize?: number;
}

export class RustLambdaFunction extends Construct {
  public readonly func: Function;

  constructor(scope: Construct, id: string, props: RustLambdaFunctionProps) {
    super(scope, id);

    this.func = new Function(this, `${id}Function`, {
      runtime: Runtime.PROVIDED_AL2,
      handler: "bootstrap",
      ...props,
    });
  }
}
