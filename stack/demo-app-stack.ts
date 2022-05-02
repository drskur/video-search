import {
    aws_dynamodb,
    aws_lambda,
    aws_sqs,
} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Architecture, Code, IFunction, Runtime} from "aws-cdk-lib/aws-lambda";
import {HttpApi, } from "@aws-cdk/aws-apigatewayv2-alpha";
import {HttpLambdaIntegration} from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";
import {IQueue} from "aws-cdk-lib/aws-sqs";
import {VideoSearchStack, VideoSearchStackProps} from "./video-search-stack";

interface DemoAppStackProps extends VideoSearchStackProps {}

export class DemoAppStack extends VideoSearchStack {
    constructor(scope: Construct, id: string, props: DemoAppStackProps) {
        super(scope, id, props);

        const dynamodbTable = aws_dynamodb.Table.fromTableName(this, "DynamoDBVideoTable", this.ssm.videoDynamoDBTableName);
        const sqs = aws_sqs.Queue.fromQueueArn(this, "SubtitleQueue", this.ssm.subtitleQueueArn);
        const tantivySearchFunction = aws_lambda.Function.fromFunctionName(this, "TantivySearchFunction", this.ssm.tantivySearchFunctionName);

        const demoFunction = this.createDemoAppFunction(dynamodbTable, sqs, tantivySearchFunction);
        this.createDemoApi(demoFunction);
    }

    private createDemoApi(func: IFunction) {
        new HttpApi(this, "DemoApi", {
            defaultIntegration: new HttpLambdaIntegration("DemoAppIntegration", func)
        });
    }

    private createDemoAppFunction(
        dynamoDbTable: ITable,
        sqs: IQueue,
        tantivySearchFunction: IFunction): aws_lambda.Function {

        const kendraIndexId = this.ssm.kendraIndexId;

        const fn = new aws_lambda.Function(this, "DemoAppFunction", {
            functionName: `${this.stackName}-Demo`,
            runtime: Runtime.PROVIDED_AL2,
            architecture: Architecture.ARM_64,
            memorySize: 256,
            code: Code.fromAsset('./.dist/app/'),
            handler: "bootstrap",
            environment: {
                CONTENT_HOST: this.ssm.contentDomainName,
                DYNAMODB_TABLE_NAME: dynamoDbTable.tableName,
                QUEUE_URL: sqs.queueUrl,
                KENDRA_INDEX: kendraIndexId,
                TANTIVY_SEARCH_FUNCTION_NAME: tantivySearchFunction.functionName
            },
        });

        dynamoDbTable.grantReadWriteData(fn);
        sqs.grantSendMessages(fn);

        fn.addToRolePolicy(new PolicyStatement({
            resources: [`arn:aws:kendra:${this.region}:${this.account}:index/${kendraIndexId}`],
            actions: [ "kendra:*" ],
        }))

        tantivySearchFunction.grantInvoke(fn);

        return fn;
    }
}