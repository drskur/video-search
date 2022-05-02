#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv'
import {DevopsStack} from "../stack/devops-stack";

dotenv.config();

const app = new cdk.App();

new DevopsStack(app, 'VideoSearchDevopsStack');