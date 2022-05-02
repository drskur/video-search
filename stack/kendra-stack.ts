import {aws_dynamodb, aws_lambda, aws_sns, Duration} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Effect, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {CfnIndex} from "aws-cdk-lib/aws-kendra";
import {ITopic} from "aws-cdk-lib/aws-sns";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {Architecture, Code, Runtime} from "aws-cdk-lib/aws-lambda";
import {SnsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {VideoSearchStack, VideoSearchStackProps} from "./video-search-stack";

interface KendraStackProps extends VideoSearchStackProps {}

export class KendraStack extends VideoSearchStack {

    constructor(scope: Construct, id: string, props: KendraStackProps) {
        super(scope, id, props);

        const dynamodbTable = aws_dynamodb.Table.fromTableName(this, "DynamoDBVideoTable", this.ssm.videoDynamoDBTableName);

        const role = this.createKendraIndexRole("KendraVideoIndexRole");
        const kendra = this.createCfnIndex("VideoSearchIndex", `VideoSearchIndex-${props.stageName}`, role);

        const topic = aws_sns.Topic.fromTopicArn(this, "IndexJobTopic", this.ssm.subtitleIndexTopicArn)
        this.createKendraIndexFunction(dynamodbTable, kendra, topic);
    }

    private createKendraIndexFunction(
        dynamoDbTable: ITable,
        kendra: CfnIndex,
        topic: ITopic,
    ): aws_lambda.Function {
        const fn = new aws_lambda.Function(this, "KendraIndexFunction", {
            functionName: `${this.stackName}-KendraIndex`,
            runtime: Runtime.PROVIDED_AL2,
            architecture: Architecture.ARM_64,
            code: Code.fromAsset('./.dist/kendra-index/'),
            handler: "bootstrap",
            timeout: Duration.seconds(10),
            environment: {
                DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
                KENDRA_INDEX: kendra.attrId,
            }
        });

        fn.addEventSource(new SnsEventSource(topic));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ dynamoDbTable.tableArn ],
            actions: [ '*' ]
        }));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ kendra.attrArn ],
            actions: [ "kendra:*" ],
        }));

        return fn;
    }

    private createCfnIndex(id: string, indexName: string, role: Role): CfnIndex {
        const index = new CfnIndex(this, id, {
            name: indexName,
            edition: "DEVELOPER_EDITION",
            description: "video caption index",
            roleArn: role.roleArn,
        });

        index.documentMetadataConfigurations = [
            {
                name: 'video_id',
                type: 'STRING_VALUE',
                search: {
                    displayable: false,
                    facetable: false,
                    searchable: false,
                    sortable: true,
                },
            },
            {
                name: 'video_key',
                type: 'STRING_VALUE',
                search: {
                    displayable: true,
                    facetable: false,
                    searchable: false,
                    sortable: false,
                },
            },
            {
                name: 'thumbnail_key',
                type: 'STRING_VALUE',
                search: {
                    displayable: true,
                    facetable: false,
                    searchable: false,
                    sortable: true,
                },
            }
        ];

        this.ssm.kendraIndexId = index.attrId;

        return index;
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