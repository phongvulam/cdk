#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcsPipelineStack } from '../lib/ecs-pipeline-stack';

const app = new cdk.App();

/**
 * This sets the account to your default AWS account. Change here to use a different AWS account.
 * Best practice to use AWS Secrets Manager
 */
new EcsPipelineStack(app, 'EcsPipelineStack', { env: {
    account: process.env.AWS_ACCOUNT, 
    region: process.env.AWS_REGION
  }});
