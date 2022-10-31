import { Stack, StackProps } from "aws-cdk-lib";
import { ComputeType, LinuxArmBuildImage } from "aws-cdk-lib/aws-codebuild";
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
      synth: {},
      sonarCodeScannerConfig: this.node.tryGetContext("sonarqubeScannerConfig"),
      synthCodeBuildDefaults: {
        buildEnvironment: {
          buildImage: LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_2_0,
          computeType: ComputeType.LARGE,
        },
      },
    });
  }
}
