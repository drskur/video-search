import { RemovalPolicy } from "aws-cdk-lib";
import {
  FlowLogDestination,
  FlowLogTrafficType,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class MediaVpc extends Construct {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const cloudWatchLogs = new LogGroup(this, "VpcLogGroup", {
      logGroupName: "/aws/vpc/flowlogs/media",
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.vpc = new Vpc(this, "MediaVpc", {
      vpcName: "media",
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "application",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
      flowLogs: {
        cloudwatch: {
          destination: FlowLogDestination.toCloudWatchLogs(cloudWatchLogs),
          trafficType: FlowLogTrafficType.ALL,
        },
      },
    });
  }
}
