import {aws_dynamodb, aws_lambda, aws_s3, aws_s3_deployment, aws_sqs, aws_ssm, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Architecture, Code, IFunction, Runtime} from "aws-cdk-lib/aws-lambda";
import {HttpApi, } from "@aws-cdk/aws-apigatewayv2-alpha";
import {HttpLambdaIntegration} from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {Source} from "aws-cdk-lib/aws-s3-deployment";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import {Vpc} from "aws-cdk-lib/aws-ec2";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";
import {IQueue} from "aws-cdk-lib/aws-sqs";

export class DemoAppStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucketName = aws_ssm.StringParameter.fromStringParameterName(this, "ContentBucketName", "/video-search/bucket-name/content");
        const bucket = aws_s3.Bucket.fromBucketName(this, "ContentBucket", bucketName.stringValue);

        const contentDomainName = aws_ssm.StringParameter.fromStringParameterName(this, "ContentHostName", '/video-search/domain-name/content');

        const dynamoTableName = aws_ssm.StringParameter.fromStringParameterName(this, "DynamoDBTableName", "/video-search/dynamodb-table-name/video");
        const dynamodbTable = aws_dynamodb.Table.fromTableName(this, "DynamoDBVideoTable", dynamoTableName.stringValue);

        const queueArn = aws_ssm.StringParameter.fromStringParameterName(this, "SubtitleQueueArn", "/video-search/queue/subtitle");
        const sqs = aws_sqs.Queue.fromQueueArn(this, "SubtitleQueue", queueArn.stringValue);

        const demoFunction = this.createDemoAppFunction(bucket, contentDomainName.stringValue, dynamodbTable, sqs);
        this.createDemoApi(demoFunction);
    }

    private createDemoApi(func: IFunction) {
        new HttpApi(this, "DemoApi", {
            defaultIntegration: new HttpLambdaIntegration("DemoAppIntegration", func)
        });
    }

    private createDemoAppFunction(bucket: IBucket, contentHostName: string, dynamoDbTable: ITable, sqs: IQueue): aws_lambda.Function {

        const fn = new aws_lambda.Function(this, "DemoAppFunction", {
            functionName: `${this.stackName}-Demo`,
            runtime: Runtime.PROVIDED_AL2,
            architecture: Architecture.ARM_64,
            memorySize: 256,
            code: Code.fromAsset('./.dist/app/'),
            handler: "bootstrap",
            environment: {
                CONTENT_HOST: contentHostName,
                DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
                QUEUE_URL: sqs.queueUrl
            },
        });

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ dynamoDbTable.tableArn ],
            actions: [ '*' ]
        }));

        fn.addToRolePolicy(new PolicyStatement({
            resources: [ sqs.queueArn ],
            actions: [ '*' ]
        }))

        //
        // fn.addToRolePolicy(new PolicyStatement({
        //     resources: [ `${bucket.bucketArn}/*` ],
        //     actions: [ '*' ],
        // }));
        //
        // fn.addToRolePolicy(new PolicyStatement({
        //     resources: [ '*' ],
        //     actions: [ 'translate:*' ],
        //     effect: Effect.ALLOW
        // }));
        //
        // fn.addToRolePolicy(new PolicyStatement({
        //     effect: Effect.ALLOW,
        //     resources: [`arn:aws:kendra:${this.region}:${this.account}:index/${kendraIndex}`],
        //     actions: ["kendra:*"],
        // }))

        return fn;
    }
}