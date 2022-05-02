import {
    aws_dynamodb,
    aws_events,
    aws_events_targets,
    aws_lambda,
    aws_s3, aws_sqs,
    Duration,
} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Architecture, Code, IFunction, Runtime} from "aws-cdk-lib/aws-lambda";
import {S3EventSource, SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {Bucket, IBucket} from "aws-cdk-lib/aws-s3";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {IQueue} from "aws-cdk-lib/aws-sqs";
import {ITopic, Topic} from "aws-cdk-lib/aws-sns";
import {VideoSearchStack, VideoSearchStackProps} from "./video-search-stack";

interface LambdaStackProps extends VideoSearchStackProps {}

export class LambdaStack extends VideoSearchStack {
    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        const dynamodbTable = aws_dynamodb.Table.fromTableName(this, "DynamoDBVideoTable", this.ssm.videoDynamoDBTableName);
        const bucket = aws_s3.Bucket.fromBucketName(this, "ContentBucket", this.ssm.contentBucketName);
        const subtitleQueue = aws_sqs.Queue.fromQueueArn(this, "SubtitleQueue", this.ssm.subtitleQueueArn);

        this.createTranscribeFunction(dynamodbTable, bucket);

        const rule = this.createTranscribeCompleteRule();
        const transcribeCompleteFunction = this.createTranscribeCompleteFunction(dynamodbTable, subtitleQueue);
        rule.addTarget(new aws_events_targets.LambdaFunction(transcribeCompleteFunction as IFunction));

        const topic = this.createIndexTopic(props.stageName);
        this.createSubtitleFunction(dynamodbTable, bucket, subtitleQueue, topic);
    }

    private createIndexTopic(stageName: string): Topic {
        const topic = new Topic(this, "IndexTopic", {
            topicName: `VideoSearchIndexJob-${stageName}`
        });

        this.ssm.subtitleIndexTopicArn = topic.topicArn;

        return topic;
    }

    private createSubtitleFunction(
        dynamoDbTable: ITable,
        bucket: IBucket,
        subtitleQueue: IQueue,
        topic: ITopic
    ): aws_lambda.Function {
        const fn = new aws_lambda.Function(this, "SubtitleFunction", {
            functionName: `${this.stackName}-Subtitle`,
            runtime: Runtime.PROVIDED_AL2,
            architecture: Architecture.ARM_64,
            code: Code.fromAsset('./.dist/subtitle/'),
            handler: "bootstrap",
            timeout: Duration.seconds(30),
            environment: {
                DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
                BUCKET_NAME: bucket.bucketName,
                TOPIC_ARN: topic.topicArn
            }
        });

        fn.addEventSource(new SqsEventSource(subtitleQueue, {
            batchSize: 1
        }));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ dynamoDbTable.tableArn ],
            actions: [ '*' ]
        }));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ bucket.arnForObjects('*') ],
            actions: [ '*' ],
        }));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ '*' ],
            actions: [ 'translate:*' ],
        }));

        topic.grantPublish(fn);

        return fn;
    }

    private createTranscribeCompleteRule(): aws_events.Rule{
        return new aws_events.Rule(this, "TranscribeRule", {
            eventPattern: {
                source: ['aws.transcribe'],
                detailType: ["Transcribe Job State Change"],
                detail: {
                    TranscriptionJobStatus: ['COMPLETED']
                }
            }
        });
    }

    private createTranscribeCompleteFunction(dynamoDbTable: ITable, queue: IQueue): aws_lambda.Function {

        const fn = new aws_lambda.Function(this, "TranscribeCompleteFunction", {
            functionName: `${this.stackName}-TranscribeComplete`,
            runtime: Runtime.PROVIDED_AL2,
            architecture: Architecture.ARM_64,
            code: Code.fromAsset('./.dist/transcribe-complete/'),
            handler: "bootstrap",
            timeout: Duration.seconds(10),
            environment: {
                DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
                QUEUE_URL: queue.queueUrl,
            }
        });

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ dynamoDbTable.tableArn ],
            actions: [ '*' ]
        }));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ queue.queueArn ],
            actions: [ '*' ],
        }));

        return fn;
    }

    private createTranscribeFunction(dynamoDbTable: ITable, bucket: IBucket): aws_lambda.Function {
        const fn = new aws_lambda.Function(this, "TranscribeFunction", {
            functionName: `${this.stackName}-Transcribe`,
            runtime: Runtime.PROVIDED_AL2,
            architecture: Architecture.ARM_64,
            code: Code.fromAsset('./.dist/transcribe/'),
            handler: "bootstrap",
            timeout: Duration.seconds(10),
            environment: {
                DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
            }
        });

        fn.addEventSource(new S3EventSource(bucket as Bucket, {
            events: [aws_s3.EventType.OBJECT_CREATED],
            filters: [ { prefix: 'video/' } ]
        }));


        fn.addToRolePolicy(new PolicyStatement({
            resources: [ bucket.arnForObjects('*') ],
            actions: [ '*' ],
        }));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ dynamoDbTable.tableArn ],
            actions: [ '*' ]
        }));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ '*' ],
            actions: [ 'transcribe:*' ],
            effect: Effect.ALLOW
        }));

        return fn;
    }
}