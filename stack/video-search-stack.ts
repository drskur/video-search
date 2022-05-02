import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {VideoSearchSsm} from "./video-search-ssm";

export interface VideoSearchStackProps extends StackProps {
    stageName: string
}

export class VideoSearchStack extends Stack {

    protected ssm: VideoSearchSsm;

    constructor(scope: Construct, id: string, props: VideoSearchStackProps) {
        super(scope, id, props);

        this.ssm = new VideoSearchSsm(this, props.stageName);
    }
}