import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { MediaBucket } from "./constructs/media-bucket";
import { MediaVpc } from "./constructs/media-vpc";
import { MediaDynamodb } from "./constructs/media-dynamodb";
import { TranscribeFunction } from "./constructs/transcribe-function";
import { TranscribePostProcessFunction } from "./constructs/transcribe-post-process-function";
import { SubtitleJobQueue } from "./constructs/subtitle-job-queue";
import { SubtitleFunction } from "./constructs/subtitle-function";
import { Topic } from "aws-cdk-lib/aws-sns";
import { IndexSubtitleFunction } from "./constructs/index-subtitle-function";
import { TantivyIndexStorage } from "./constructs/tantivy-index-storage";
import { SearchSubtitleFunction } from "./constructs/search-subtitle-function";

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

    const subtitleJobQueue = new SubtitleJobQueue(this, "SubtitleJobQueue");

    new TranscribePostProcessFunction(this, "TranscribePostProcessFunction", {
      vpc,
      dynamoDbTable: mediaDynamodb.table,
      subtitleJobQueue: subtitleJobQueue.queue,
    });

    const subtitleResultTopic = new Topic(this, "SubtitleResultTopic");

    new SubtitleFunction(this, "SubtitleFunction", {
      vpc,
      dynamoDbTable: mediaDynamodb.table,
      subtitleJobQueue: subtitleJobQueue.queue,
      mediaSourceBucket: mediaBucket.bucket,
      subtitleResultTopic,
    });

    const tantivyIndexStorage = new TantivyIndexStorage(
      this,
      "TantivyIndexStorage",
      {
        vpc,
      }
    );

    new IndexSubtitleFunction(this, "IndexSubtitleFunction", {
      vpc,
      tantivyAccessPoint: tantivyIndexStorage.accessPoint,
      subtitleResultTopic,
    });

    new SearchSubtitleFunction(this, "SearchSubtitleFunction", {
      vpc,
      tantivyAccessPoint: tantivyIndexStorage.accessPoint,
    });
  }
}
