import {aws_dynamodb, aws_lambda, aws_s3, aws_ssm, Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Architecture, Code, Runtime} from "aws-cdk-lib/aws-lambda";
import {S3EventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.createTranscribeFunction();
    }

    private createTranscribeFunction(): aws_lambda.Function {
        const bucketName = aws_ssm.StringParameter.fromStringParameterName(this, "ContentBucketName", "/video-search/bucket-name/content");
        const dynamoTableName = aws_ssm.StringParameter.fromStringParameterName(this, "DynamoDBTableName", "/video-search/dynamodb-table-name/video");

        const fn = new aws_lambda.Function(this, "TranscribeFunction", {
            functionName: `${this.stackName}-Transcribe`,
            runtime: Runtime.PROVIDED_AL2,
            architecture: Architecture.ARM_64,
            code: Code.fromAsset('./.dist/transcribe/'),
            handler: "bootstrap",
            timeout: Duration.seconds(10),
            environment: {
                DYNAMODB_TABLE_NAME: dynamoTableName.stringValue,
            }
        });


        const bucket = aws_s3.Bucket.fromBucketName(this, "ContentBucket", bucketName.stringValue);
        fn.addEventSource(new S3EventSource(bucket as Bucket, {
            events: [aws_s3.EventType.OBJECT_CREATED],
            filters: [ { prefix: 'video/' } ]
        }));

        const table = aws_dynamodb.Table.fromTableName(this, "DynamoDBVideoTable", dynamoTableName.stringValue);
        fn.addToRolePolicy(new PolicyStatement({
            resources: [ `${bucket.bucketArn}/*` ],
            actions: [ '*' ],
        }));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ table.tableArn ],
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