import { Stack, StackProps } from "aws-cdk-lib";
import {BuildSpec, ComputeType, LinuxBuildImage} from "aws-cdk-lib/aws-codebuild";
import { PDKPipeline } from "aws-prototyping-sdk/pipeline";
import { Construct } from "constructs";

export class PipelineStack extends Stack {
  readonly pipeline: PDKPipeline;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pipeline = new PDKPipeline(this, "ApplicationPipeline", {
      primarySynthDirectory: "packages/infra/cdk.out",
      defaultBranchName: "main",
      repositoryName: this.node.tryGetContext("repositoryName") || "monorepo",
      publishAssetsInParallel: false,
      crossAccountKeys: true,
      sonarCodeScannerConfig: this.node.tryGetContext("sonarqubeScannerConfig"),
      synthCodeBuildDefaults: {
        buildEnvironment: {
          buildImage: LinuxBuildImage.STANDARD_6_0,
          computeType: ComputeType.X2_LARGE,
        },
        partialBuildSpec: BuildSpec.fromObject({
          version: "0.2",
          phases: {
            install: {
              "commands": [
                "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
                ". $HOME/.cargo/env",
                "pip3 install cargo-lambda",
              ]
            }
          }
        })
      },
      synth: {}
    });

  }
}
