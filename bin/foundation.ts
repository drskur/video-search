#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VideoSearchStack } from '../stack/video-search-stack';
import {KendraStack} from "../stack/kendra";
import * as dotenv from 'dotenv'

dotenv.config();

const app = new cdk.App();
new VideoSearchStack(app, 'VideoSearchStack', {
    env: {
        region: 'ap-northeast-1'
    }
});

new KendraStack(app, 'VideoSearchKendraStack', {
    env: {
        region: 'ap-southeast-1'
    }
});