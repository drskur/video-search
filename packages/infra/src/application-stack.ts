import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { MediaBucket } from "./constructs/media-bucket";
import { MediaVpc } from "./constructs/media-vpc";
import { MediaDynamodb } from "./constructs/media-dynamodb";
import { TranscribeFunction } from "./constructs/transcribe-function";

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { vpc } = new MediaVpc(this, "VPC");

    const mediaBucket = new MediaBucket(this, "Bucket");

    const mediaDynamodb = new MediaDynamodb(this, "MediaDB");

    new TranscribeFunction(this, "TranscribeFunction", {
      vpc,
      dynamoDbTable: mediaDynamodb.table,
      eventSourceBucket: mediaBucket.bucket,
    });
  }
}