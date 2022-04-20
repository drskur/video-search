import {aws_lambda, aws_s3, aws_s3_deployment, aws_ssm, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Architecture, Code, IFunction, Runtime} from "aws-cdk-lib/aws-lambda";
import {HttpApi, } from "@aws-cdk/aws-apigatewayv2-alpha";
import {HttpLambdaIntegration} from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {Source} from "aws-cdk-lib/aws-s3-deployment";

export class DemoAppStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucketName = aws_ssm.StringParameter.fromStringParameterName(this, "ContentBucketName", "/video-search/bucket-name/content");
        const bucket = aws_s3.Bucket.fromBucketName(this, "ContentBucket", bucketName.stringValue);

        const demoFunction = this.createDemoAppFunction(bucket);
        this.createDemoApi(demoFunction);
    }

    private createDemoApi(func: IFunction) {
        new HttpApi(this, "DemoApi", {
            defaultIntegration: new HttpLambdaIntegration("DemoAppIntegration", func)
        });
    }

    private createDemoAppFunction(bucket: IBucket): aws_lambda.Function {
        const fn = new aws_lambda.Function(this, "DemoAppFunction", {
            functionName: `${this.stackName}-Demo`,
            runtime: Runtime.NODEJS_14_X,
            architecture: Architecture.ARM_64,
            memorySize: 512,
            code: Code.fromAsset('./.dist/app/'),
            handler: "index.handler",
            environment: {
            }
        });

        new aws_s3_deployment.BucketDeployment(this, "DemoAppFunction-Assets", {
            sources: [Source.asset("./.dist/app/.output/public/")],
            destinationBucket: bucket,
            destinationKeyPrefix: 'demo',
        });

        //
        // fn.addToRolePolicy(new PolicyStatement({
        //     resources: [ dynamoDbTable.tableArn ],
        //     actions: [ '*' ]
        // }));
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