import { Construct } from "constructs";
import { AccessPoint, FileSystem, PerformanceMode } from "aws-cdk-lib/aws-efs";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { RemovalPolicy } from "aws-cdk-lib";

export interface TantivyIndexStorageProps {
  readonly vpc: IVpc;
}

export class TantivyIndexStorage extends Construct {
  public readonly fileSystem: FileSystem;
  public readonly accessPoint: AccessPoint;

  constructor(scope: Construct, id: string, props: TantivyIndexStorageProps) {
    super(scope, id);

    const { vpc } = props;

    this.fileSystem = new FileSystem(this, "TantivyStorage", {
      vpc,
      performanceMode: PerformanceMode.MAX_IO,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.accessPoint = this.fileSystem.addAccessPoint("RootPoint", {
      path: "/tantivy",
      createAcl: {
        ownerUid: "1001",
        ownerGid: "1001",
        permissions: "750",
      },
      posixUser: {
        gid: "1001",
        uid: "1001",
      },
    });
  }
}
