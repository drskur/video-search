import { Construct } from "constructs";
import {
  Architecture,
  Code,
  LayerVersion,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { RustLambdaFunction } from "./rust-lambda-function";
import { Duration } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { IBucket } from "aws-cdk-lib/aws-s3";

export interface ImageFrameFunctionProps {
  vpc: IVpc;
  bucket: IBucket;
}

export class ImageFrameFunction extends Construct {
  public readonly ffmpegLayer: LayerVersion;
  public readonly rustFunction: RustLambdaFunction;

  constructor(scope: Construct, id: string, props: ImageFrameFunctionProps) {
    super(scope, id);

    const { vpc, bucket } = props;

    this.ffmpegLayer = new LayerVersion(this, "FfmpegLayer", {
      compatibleRuntimes: [Runtime.PROVIDED_AL2],
      code: Code.fromAsset("./layers/ffmpeg/"),
      description: "arm64 Static FFMpeg binary layer",
    });

    this.rustFunction = new RustLambdaFunction(this, "Function", {
      vpc,
      code: Code.fromAsset("../lambda/.dist/image_frame/"),
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(60),
      layers: [this.ffmpegLayer],
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
    bucket.grantReadWrite(this.rustFunction.func);
  }
}
