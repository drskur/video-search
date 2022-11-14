import { Construct } from "constructs";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { RemovalPolicy } from "aws-cdk-lib";
import { IdentityPool } from "@aws-cdk/aws-cognito-identitypool-alpha";

export interface AppCognitoProps {
  readonly clientUrls: string[];
}

export class AppCognito extends Construct {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly identityPool: IdentityPool;

  constructor(scope: Construct, id: string, props: AppCognitoProps) {
    super(scope, id);

    const { clientUrls } = props;

    this.userPool = new UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireSymbols: true,
        requireUppercase: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.userPoolClient = this.userPool.addClient("UserPoolClient", {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      oAuth: {
        callbackUrls: clientUrls,
        logoutUrls: clientUrls,
      },
    });

    this.identityPool = new IdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false,
    });
  }
}
