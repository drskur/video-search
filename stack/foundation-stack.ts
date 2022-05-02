import {aws_dynamodb, aws_sqs} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {BillingMode} from "aws-cdk-lib/aws-dynamodb";
import {VideoSearchStack, VideoSearchStackProps} from "./video-search-stack";
import {
    AllowedMethods, CachedMethods,
    Distribution,
    OriginAccessIdentity,
    OriginRequestPolicy,
    ResponseHeadersPolicy
} from "aws-cdk-lib/aws-cloudfront";
import {CanonicalUserPrincipal, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";

interface FoundationStackProps extends VideoSearchStackProps {
    contentBucketUniqueName: string,
}

export class FoundationStack extends VideoSearchStack {

    constructor(scope: Construct, id: string, props: FoundationStackProps) {
        super(scope, id, props);

        const bucket = this.createVideoSearchBucket(props.contentBucketUniqueName);
        this.ssm.contentBucketName = bucket.bucketName;


        const db = this.createDynamoDB(`${this.stackName}-video`);
        this.ssm.videoDynamoDBTableName = db.tableName;

        const queue = this.createSubtitleQueue();
        this.ssm.subtitleQueueArn = queue.queueArn;

        const distribution = this.createCloudFrontDistribution(bucket);
        this.ssm.contentDomainName = distribution.distributionDomainName;
    }

    private createCloudFrontDistribution(bucket: Bucket): Distribution {
        const oai = new OriginAccessIdentity(this, "OAI");
        bucket.addToResourcePolicy(new PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [ bucket.arnForObjects('*') ],
            principals: [new CanonicalUserPrincipal(
                oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
            )]
        }));

        return new Distribution(this, "VideoDistribution", {
            defaultBehavior: {
                origin: new S3Origin(bucket, {
                    originAccessIdentity: oai
                }),
                originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
                responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS
            },
        });
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
            billingMode: BillingMode.PAY_PER_REQUEST
        });
    }

    private createSubtitleQueue(): aws_sqs.Queue {

        const dlq = new aws_sqs.Queue(this, "SubtitleDLQ", {
            queueName: `${this.stackName}-subtitle-dlq`
        })

        return new aws_sqs.Queue(this, "SubtitleQueue", {
            queueName: `${this.stackName}-subtitle`,
            deadLetterQueue: {
                queue: dlq,
                maxReceiveCount: 3
            }
        })
    }

}