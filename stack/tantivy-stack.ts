import * as cdk from '@aws-cdk/core';
import {aws_efs, aws_lambda, aws_sns, aws_ssm, Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {IVpc, Vpc} from "aws-cdk-lib/aws-ec2";
import { PerformanceMode} from "aws-cdk-lib/aws-efs";
import {ITopic} from "aws-cdk-lib/aws-sns";
import {Architecture, Code, FileSystem, Runtime} from "aws-cdk-lib/aws-lambda";
import {SnsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

export class TantivyStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = this.createVPC();
        const storage = this.createEFSStorage(vpc);
        const storageAccessPoint = storage.addAccessPoint('RootPoint', {
            path: '/tantivy',
            createAcl: {
                ownerUid: '1001',
                ownerGid: '1001',
                permissions: '750'
            },
            posixUser: {
                gid: '1001',
                uid: '1001'
            }
        });

        const indexJobTopicArn = aws_ssm.StringParameter.fromStringParameterName(this, "IndexJobTopicArn", "/video-search/topic/index");
        const topic = aws_sns.Topic.fromTopicArn(this, "IndexJobTopic", indexJobTopicArn.stringValue)
        this.createTantivyIndexFunction(vpc, storageAccessPoint, topic);
        this.createTantivySearchFunction(vpc, storageAccessPoint);

    }

    private createTantivySearchFunction(vpc: IVpc, accessPoint: aws_efs.IAccessPoint): aws_lambda.Function {
        const fn =  new aws_lambda.Function(this, "TantivySearchFunction", {
            functionName: `${this.stackName}-TantivySearch`,
            runtime: Runtime.PROVIDED_AL2,
            architecture: Architecture.ARM_64,
            memorySize: 1024,
            code: Code.fromAsset('./.dist/tantivy-search/'),
            handler: "bootstrap",
            timeout: Duration.seconds(10),
            environment: {
                TANTIVY_MOUNT: '/mnt/tantivy'
            },
            vpc,
            filesystem: FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/tantivy'),
        });

        new aws_ssm.StringParameter(this, "TantivySearchFunctionName", {
            parameterName: '/video-search/function/tantivy-search',
            stringValue: fn.functionName
        })

        return fn;
    }

    private createTantivyIndexFunction(vpc: IVpc, accessPoint: aws_efs.IAccessPoint, topic: ITopic): aws_lambda.Function {
        const fn = new aws_lambda.Function(this, "TantivyIndexFunction", {
            functionName: `${this.stackName}-TantivyIndex`,
            runtime: Runtime.PROVIDED_AL2,
            architecture: Architecture.ARM_64,
            memorySize: 512,
            code: Code.fromAsset('./.dist/tantivy-index/'),
            handler: "bootstrap",
            timeout: Duration.seconds(10),
            environment: {
                TANTIVY_MOUNT: '/mnt/tantivy'
            },
            vpc,
            filesystem: FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/tantivy'),
        });

        fn.addEventSource(new SnsEventSource(topic));

        return fn;
    }

    private createVPC(): Vpc {
        return new Vpc(this, 'TantivyVPC');
    }

    private createEFSStorage(vpc: IVpc): aws_efs.FileSystem {
        return new aws_efs.FileSystem(this, 'TantivyStorage', {
            vpc,
            performanceMode: PerformanceMode.MAX_IO,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
    }

}