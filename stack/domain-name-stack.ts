import {aws_apigateway, aws_route53, aws_route53_targets, aws_s3, aws_ssm, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {DomainName} from "aws-cdk-lib/aws-apigateway";
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import {ARecord, HostedZone, IHostedZone} from "aws-cdk-lib/aws-route53";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {Distribution, OriginAccessIdentity} from "aws-cdk-lib/aws-cloudfront";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {CanonicalUserPrincipal, PolicyStatement} from "aws-cdk-lib/aws-iam";

export class DomainNameStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const certArn = process.env.CERTIFICATE_ARN || '';
        const zoneId = process.env.HOSTED_ZONE_ID || '';

        const domain = this.createApiGatewayDomainName("VideoSearchDomain", "video-search.drskur.xyz", certArn);
        const zone = this.findHostedZone(zoneId, 'drskur.xyz');
        this.createRoute53Record('VideoApiRecord', zone, 'video-search', domain.domainNameAliasDomainName);

        const bucketName = aws_ssm.StringParameter.fromStringParameterName(this, "ContentBucketName", "/video-search/bucket-name/content");
        const bucket = aws_s3.Bucket.fromBucketName(this, "ContentBucket", bucketName.stringValue);

        const oai = new OriginAccessIdentity(this, "OAI");
        bucket.addToResourcePolicy(new PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [ bucket.arnForObjects('*') ],
            principals: [new CanonicalUserPrincipal(
                oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
            )]
        }));

        const distribution = this.createCloudFrontDistribution(bucket, oai);
        new aws_ssm.StringParameter(this, "ContentDistro", {
            parameterName: '/video-search/domain-name/content',
            stringValue: distribution.distributionDomainName
        });


    }

    private createCloudFrontDistribution(bucket: IBucket, oai: OriginAccessIdentity): Distribution {
        return new Distribution(this, "VideoDistribution", {
            defaultBehavior: {
                origin: new S3Origin(bucket, {
                    originAccessIdentity: oai
                })
            },
        });
    }

    private createApiGatewayDomainName(id: string, domainName: string, certArn: string): DomainName {
        return new aws_apigateway.DomainName(this, id, {
            domainName: domainName,
            certificate: Certificate.fromCertificateArn(this, `certificate-${id}`, certArn)
        });
    }

    private findHostedZone(hostedZoneId: string, zoneName: string): IHostedZone {
        return HostedZone.fromHostedZoneAttributes(this, `HostedZone-${hostedZoneId}`, {
            hostedZoneId,
            zoneName
        });
    }

    private createRoute53Record(id: string, zone: IHostedZone, recordName: string, domainName: string): ARecord {
        return new aws_route53.CnameRecord(this, id, {
            zone,
            recordName,
            domainName
        });
    }
}