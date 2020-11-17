#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcsPipelineStack } from '../lib/ecs-pipeline-stack';

const app = new cdk.App();

new EcsPipelineStack(app, 'EcsPipelineStack');
