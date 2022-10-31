import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { MediaBucket } from "./constructs/media-bucket";
import { MediaVpc } from "./constructs/media-vpc";
import { RustLambdaFunction } from "./constructs/rust-lambda-function";
import { Architecture, Code } from "aws-cdk-lib/aws-lambda";

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new MediaVpc(this, "VPC");

    new MediaBucket(this, "Bucket");

    new RustLambdaFunction(this, "S3PutObjectTrigger", {
      code: Code.fromAsset("../lambda/.dist/s3-put-object-trigger/"),
      architecture: Architecture.ARM_64,
    });
  }
}
