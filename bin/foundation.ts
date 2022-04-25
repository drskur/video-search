#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {KendraStack} from "../stack/kendra-stack";
import * as dotenv from 'dotenv'
import {DomainNameStack} from "../stack/domain-name-stack";
import {DevopsStack} from "../stack/devops-stack";
import {FoundationStack} from "../stack/foundation-stack";
import {LambdaStack} from "../stack/lambda-stack";
import {DemoAppStack} from "../stack/demo-app-stack";

dotenv.config();

const app = new cdk.App();


new DomainNameStack(app, 'VideoSearchDomainNameStack');

new DevopsStack(app, 'VideoSearchDevopsStack');

new FoundationStack(app, "VideoSearchFoundationStack");

new LambdaStack(app, "VideoSearchLambdaStack");

new KendraStack(app, 'VideoSearchKendraStack');

new DemoAppStack(app, 'VideoSearchDemoAppStack');

// new VideoSearchStack(app, 'VideoSearchStack');

