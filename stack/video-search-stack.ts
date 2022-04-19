import {aws_lambda, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Architecture, Runtime} from "aws-cdk-lib/aws-lambda";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";

export class VideoSearchStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.createLambdaFunction("KendraIndex")

  }

  private createLambdaFunction(baseName: string): aws_lambda.Function {
    const region = process.env.KENDRA_REGION;
    if (!region) {
      throw new Error("must be set KENDRA_REGION");
    }

    const videoIndexName = process.env.VIDEO_INDEX_NAME;
    if (!videoIndexName) {
      throw new Error("must be set VIDEO_INDEX_NAME");
    }

    const fn = new aws_lambda.Function(this, baseName, {
      functionName: `${this.stackName}-${baseName}`,
      architecture: Architecture.ARM_64,
      runtime: Runtime.PROVIDED_AL2,
      code: aws_lambda.Code.fromAsset('lambda/target/lambda/index/'),
      handler: "bootstrap",
      environment: {
        "KENDRA_REGION": region,
        "VIDEO_INDEX_NAME": videoIndexName,
      }
    });
    fn.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:kendra:${region}:${this.account}:index/*`],
      actions: ["kendra:*"],
    }))

    return fn;
  }
}
