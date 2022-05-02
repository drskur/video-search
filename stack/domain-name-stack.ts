import {aws_apigateway, aws_route53, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {DomainName} from "aws-cdk-lib/aws-apigateway";
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import {ARecord, HostedZone, IHostedZone} from "aws-cdk-lib/aws-route53";

export class DomainNameStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const certArn = process.env.CERTIFICATE_ARN || '';
        const zoneId = process.env.HOSTED_ZONE_ID || '';

        const domain = this.createApiGatewayDomainName("VideoSearchDomain", "video-search.drskur.xyz", certArn);
        const zone = this.findHostedZone(zoneId, 'drskur.xyz');
        this.createRoute53Record('VideoApiRecord', zone, 'video-search', domain.domainNameAliasDomainName);
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