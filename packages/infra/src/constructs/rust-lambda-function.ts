import {Construct} from "constructs";
import {Architecture, Code, Runtime,Function} from "aws-cdk-lib/aws-lambda";
import {Duration} from "aws-cdk-lib";

export interface RustLambdaFunctionProps {
    functionName?: string,
    code: Code,
    architecture: Architecture,
    timeout?: Duration,
    readonly environment?: {
        [key: string]: string;
    };
}

export class RustLambdaFunction extends Construct {
    public readonly func: Function;

    constructor(scope: Construct, id: string, props: RustLambdaFunctionProps) {
        super(scope, id);

        this.func = new Function(this, `${id}Function`, {
            runtime: Runtime.PROVIDED_AL2,
            handler: "bootstrap",
            ...props,
        });
    }
}