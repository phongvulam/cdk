#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkTypescriptStack } from '../lib/cdk-typescript-stack';
import { VpcStack } from '../lib/vpc-stack';
import { RDSStack } from '../lib/rds-stack';
require('dotenv').config();

//rm -rf cdk.out/*.* cdk.context.json

const app = new cdk.App();
new CdkTypescriptStack(app, 'eb-stack', {env: {
    account: process.env.AWS_ACCOUNT_ID, 
    region: process.env.AWS_REGION,
}});

new RDSStack(app, 'rds-stack', {env: {
    account: process.env.AWS_ACCOUNT_ID, 
    region: process.env.AWS_REGION,
}});

new VpcStack(app, 'vpc-stack', {env: { 
    account: process.env.AWS_ACCOUNT_ID, 
    region: process.env.AWS_REGION,
}});
