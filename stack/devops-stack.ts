import {aws_codecommit, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {CodePipeline, CodePipelineSource, ShellStep} from "aws-cdk-lib/pipelines";
import {ComputeType, LinuxArmBuildImage} from "aws-cdk-lib/aws-codebuild";
import {VideoSearchStage} from "../stage/video-search-stage";

export class DevopsStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const repo = this.createCodeCommitRepo('VideoSearchRepo', 'VideoSearchRepo');
        this.createCodePipeline(repo);
    }

    private createCodePipeline(codeCommit: aws_codecommit.Repository): CodePipeline {
        const pipeline = new CodePipeline(this, 'VideoSearchPipeline', {
            synthCodeBuildDefaults: {
                buildEnvironment: {
                    buildImage: LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_2_0,
                    computeType: ComputeType.LARGE,
                }
            },
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.codeCommit(codeCommit, 'main'),
                commands: [
                    'npm ci',
                    'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y',
                    'source $HOME/.cargo/env',
                    'npm run build',
                    'npx cdk synth'
                ]
            })
        });

        pipeline.addStage(new VideoSearchStage(this, 'Default', {
            bucketUniqueName: 'drskur'
        }));

        return pipeline;
    }

    private createCodeCommitRepo(id: string, repositoryName: string): aws_codecommit.Repository {
        return new aws_codecommit.Repository(this, id, {
            repositoryName
        });
    }

}