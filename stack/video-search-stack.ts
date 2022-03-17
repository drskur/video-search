import {aws_lambda, Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Architecture, Runtime} from "aws-cdk-lib/aws-lambda";

export class VideoSearchStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.createLambdaFunction("KendraIndex")

  }

  private createLambdaFunction(baseName: string): aws_lambda.Function {
    return new aws_lambda.Function(this, baseName, {
      functionName: `${this.stackName}-${baseName}`,
      architecture: Architecture.ARM_64,
      runtime: Runtime.PROVIDED_AL2,
      code: aws_lambda.Code.fromAsset('lambda/target/lambda/index/'),
      handler: "bootstrap",
    });
  }
}
