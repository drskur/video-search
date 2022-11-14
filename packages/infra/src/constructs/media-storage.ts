import { RemovalPolicy } from "aws-cdk-lib";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import {
  AllowedMethods,
  CachedMethods,
  Distribution,
  OriginAccessIdentity,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { CanonicalUserPrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

export class MediaStorage extends Construct {
  public readonly bucket: Bucket;
  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.bucket = new Bucket(this, "MediaBucket", {
      serverAccessLogsPrefix: "logs/",
      versioned: true,
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const oai = new OriginAccessIdentity(this, "OAI");
    this.bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [this.bucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    this.distribution = new Distribution(this, "MediaDistribution", {
      defaultBehavior: {
        origin: new S3Origin(this.bucket, {
          originAccessIdentity: oai,
        }),
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy:
          ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      },
    });
  }
}
