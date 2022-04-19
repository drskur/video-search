import {
    aws_dynamodb,
    aws_events,
    aws_events_targets,
    aws_lambda,
    aws_s3, aws_sqs,
    aws_ssm,
    Duration,
    Stack,
    StackProps
} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Architecture, Code, IFunction, Runtime} from "aws-cdk-lib/aws-lambda";
import {S3EventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {Bucket, IBucket} from "aws-cdk-lib/aws-s3";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {IQueue} from "aws-cdk-lib/aws-sqs";

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const dynamoTableName = aws_ssm.StringParameter.fromStringParameterName(this, "DynamoDBTableName", "/video-search/dynamodb-table-name/video");
        const dynamodbTable = aws_dynamodb.Table.fromTableName(this, "DynamoDBVideoTable", dynamoTableName.stringValue);

        const bucketName = aws_ssm.StringParameter.fromStringParameterName(this, "ContentBucketName", "/video-search/bucket-name/content");
        const bucket = aws_s3.Bucket.fromBucketName(this, "ContentBucket", bucketName.stringValue);

        const queueArn = aws_ssm.StringParameter.fromStringParameterName(this, "SubtitleQueueArn", "/video-search/queue/subtitle");
        const sqs = aws_sqs.Queue.fromQueueArn(this, "SubtitleQueue", queueArn.stringValue);

        this.createTranscribeFunction(dynamodbTable, bucket);

        const rule = this.createTranscribeCompleteRule();
        const transcribeCompleteFunction = this.createTranscribeCompleteFunction(dynamodbTable, sqs);
        rule.addTarget(new aws_events_targets.LambdaFunction(transcribeCompleteFunction as IFunction));
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
                QUEUE_ARN: queue.queueArn,
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
            resources: [ `${bucket.bucketArn}/*` ],
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