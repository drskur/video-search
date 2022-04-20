import {aws_cloudfront, aws_dynamodb, aws_sqs, aws_ssm, CfnOutput, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";

export class FoundationStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucket = this.createVideoSearchBucket('drskur');
        new aws_ssm.StringParameter(this, "ContentBucketName", {
            parameterName: '/video-search/bucket-name/content',
            stringValue: bucket.bucketName
        });

        const db = this.createDynamoDB('video-search-video');
        new aws_ssm.StringParameter(this, "DynamoDB-Video-Param", {
            parameterName: '/video-search/dynamodb-table-name/video',
            stringValue: db.tableName
        });

        const queue = this.createSQS();
        new aws_ssm.StringParameter(this, "SQS-Video-Param", {
            parameterName: '/video-search/queue/subtitle',
            stringValue: queue.queueArn
        })
    }

    private createVideoSearchBucket(uniqueName: string): Bucket {
        return new Bucket(this, `${this.stackName}-${uniqueName}`, {
            bucketName: `video-search-${uniqueName}`
        });
    }

    private createDynamoDB(tableName: string): aws_dynamodb.Table {
        return new aws_dynamodb.Table(this, "DynamoDB-Video", {
            tableName,
            partitionKey: {
                name: 'id',
                type: aws_dynamodb.AttributeType.STRING,
            },
            readCapacity: 2,
            writeCapacity: 2,
        });
    }

    private createSQS(): aws_sqs.Queue {

        const dlq = new aws_sqs.Queue(this, "SubtitleDLQ", {
            queueName: 'video-search-subtitle-dlq'
        })

        return new aws_sqs.Queue(this, "SubtitleQueue", {
            queueName: 'video-search-subtitle',
            deadLetterQueue: {
                queue: dlq,
                maxReceiveCount: 3
            }
        })
    }

}