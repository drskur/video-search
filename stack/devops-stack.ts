import {aws_codecommit, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";

export class DevopsStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.createCodeCommitRepo('VideoSearchRepo', 'VideoSearchRepo');
    }

    private createCodeCommitRepo(id: string, repositoryName: string) {
        return new aws_codecommit.Repository(this, id, {
            repositoryName
        });
    }

}