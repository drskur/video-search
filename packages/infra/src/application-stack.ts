import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { MediaBucket } from "./constructs/media-bucket";
import { MediaVpc } from "./constructs/media-vpc";
import {TranscribeStateMachine} from "./constructs/transcribe-state-machine";

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new MediaVpc(this, "VPC");

    new MediaBucket(this, "Bucket");

    new TranscribeStateMachine(this, "Transcribe");

  }
}
