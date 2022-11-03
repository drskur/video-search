import { Construct } from "constructs";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { HttpApi } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

export interface AppApiGatewayProps {
  readonly handler: IFunction;
}

export class AppApiGateway extends Construct {
  public readonly httpApi: HttpApi;
  constructor(scope: Construct, id: string, props: AppApiGatewayProps) {
    super(scope, id);

    const { handler } = props;

    this.httpApi = new HttpApi(this, "HttpApi", {
      defaultIntegration: new HttpLambdaIntegration("AppIntegration", handler),
    });
  }
}
