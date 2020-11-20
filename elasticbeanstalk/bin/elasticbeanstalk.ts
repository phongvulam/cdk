#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { VpcStack } from '../lib/vpc-stack';
import {RDSStack} from '../lib/rds-stack';
import {EBStack} from '../lib/eb-stack';
const app = new cdk.App();

new VpcStack(app, 'vpc-stack');

new RDSStack(app, 'rds-stack', {env: {
    account: process.env.AWS_ACCOUNT_ID, 
    region: process.env.AWS_REGION,
}});

new EBStack(app, 'eb-stack', {env: {
    account: process.env.AWS_ACCOUNT_ID, 
    region: process.env.AWS_REGION,
}});
