import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Effect, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {CfnIndex} from "aws-cdk-lib/aws-kendra";

export class KendraStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const role = this.createKendraIndexRole("KendraVideoIndexRole");
        this.createCfnIndex("VideoIndex", role);
    }

    private createCfnIndex(id: string, role: Role): CfnIndex {
        return  new CfnIndex(this, id, {
            name: "VideoIndex",
            edition: "DEVELOPER_EDITION",
            description: "video caption index",
            roleArn: role.roleArn,
        });
    }

    private createKendraIndexRole(id: string): Role {
        const role = new Role(this, id, {
            assumedBy: new ServicePrincipal("kendra.amazonaws.com"),
        });
        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: ["*"],
            actions: ["cloudwatch:PutMetricData"],
            conditions: {
                "StringEquals": {
                    "cloudwatch:namespace": "Kendra"
                }
            }
        }));
        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: ["*"],
            actions: ["logs:DescribeLogGroups"]
        }));
        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/kendra/*`],
            actions: ["logs:CreateLogGroup"]
        }));
        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/kendra/*:log-stream:*`],
            actions: [
                "logs:DescribeLogStreams",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
            ]
        }))

        return role;
    }
}