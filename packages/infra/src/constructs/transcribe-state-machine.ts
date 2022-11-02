import {Construct} from "constructs";
import {IntegrationPattern, JsonPath, StateMachine} from "aws-cdk-lib/aws-stepfunctions";
import {RustLambdaFunction} from "./rust-lambda-function";
import {Architecture, Code} from "aws-cdk-lib/aws-lambda";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";

export class TranscribeStateMachine extends Construct {
    public readonly stateMachine: StateMachine;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const triggerFunction = new RustLambdaFunction(this, "S3PutObjectTrigger", {
            code: Code.fromAsset("../lambda/.dist/s3-put-object-trigger/"),
            architecture: Architecture.ARM_64,
        });

        const triggerTask = new LambdaInvoke(this, "S3PutObjectTriggerTask", {
            lambdaFunction: triggerFunction.func,
            integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
            resultPath: JsonPath.stringAt('$'),
            outputPath: JsonPath.stringAt('$.Payload'),
        })

        const definition = triggerTask

        this.stateMachine = new StateMachine(this, `${id}StateMachine`, {
            definition,
        });
    }
}