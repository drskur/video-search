import {Stage, StageProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {LambdaStack} from "../stack/lambda-stack";
import {KendraStack} from "../stack/kendra-stack";
import {DemoAppStack} from "../stack/demo-app-stack";
import {TantivyStack} from "../stack/tantivy-stack";
import {FoundationStack} from "../stack/foundation-stack";

interface VideoSearchStageProps extends StageProps {
    bucketUniqueName: string
}

export class VideoSearchStage extends Stage {
    constructor(scope: Construct, id: string, props: VideoSearchStageProps) {
        super(scope, id, props);

        const stageName = id.toLowerCase();

        new FoundationStack(this, "VideoSearchFoundationStack", {
            stageName,
            contentBucketUniqueName: `${stageName}-${props.bucketUniqueName}`
        });

        new LambdaStack(this, "VideoSearchLambdaStack", {
            stageName
        });

        new KendraStack(this, 'VideoSearchKendraStack', {
            stageName
        });

        new TantivyStack(this, 'VideoSearchTantivyStack', {
            stageName
        });

        new DemoAppStack(this, 'VideoSearchDemoAppStack', {
            stageName
        });

    }

}