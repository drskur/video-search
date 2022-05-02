import {Stage, StageProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {LambdaStack} from "./lambda-stack";
import {KendraStack} from "./kendra-stack";
import {DemoAppStack} from "./demo-app-stack";
import {TantivyStack} from "./tantivy-stack";

export class VideoSearchDefaultStage extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        new LambdaStack(this, "VideoSearchLambdaStack");

        new KendraStack(this, 'VideoSearchKendraStack');

        new DemoAppStack(this, 'VideoSearchDemoAppStack');

        new TantivyStack(this, 'VideoSearchTantivyStack');

    }

}