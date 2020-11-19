#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";

import { Peer, Port, SecurityGroup, SubnetType, Vpc } from "@aws-cdk/aws-ec2";
import { Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { VPCStack } from "../lib/vpc-stack";
import { EcsClusterStack } from "../lib/ecs-cluster";
import { ALBStack } from "../lib/alb-stack";
import { FargateTaskStack } from "../lib/fargate-stack";
import { EcsPipelineStack } from "../lib/ecs-pipeline-stack";
import { applicationMetaData } from "../configurations/config";

const app = new cdk.App();

/**
 * Create VPC
 *
 *
 **/

const vpc = new VPCStack(app, applicationMetaData.VpcName, {
  maxAzs: applicationMetaData.maxAzs,
  cidr: applicationMetaData.cidr,
  vpcName: applicationMetaData.VpcName,
  env: {
    account: applicationMetaData.awsAccount,
    region: applicationMetaData.awsRegion
  }, 
  tags: {
    
  }, 
});

/**
 * Create Security Group
 *
 *
 **/

const egressSecurityGroup = new SecurityGroup(app, "egress-security-group", {
  vpc: vpc.vpc,
  allowAllOutbound: false,
  securityGroupName: "EgressSecurityGroup",
});
egressSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(applicationMetaData.allowPort));

/**
 * Create Cluster
 *
 *
 **/

/** Step 3. ECS Cluster */
const cluster = new EcsClusterStack(
  app,
  applicationMetaData.ecsClusterStackName,
  {
    vpc: vpc.vpc,
    clusterName: applicationMetaData.clusterName,
  }
);

/**
 * Create ALB
 *
 *
 **/
const alb = new ALBStack(app, "", {
  albPort: applicationMetaData.allowPort,
  vpc: vpc.vpc,
  securityGrp: egressSecurityGroup,
});

/**
 * Create Role-ECS Fargate
 *
 *
 **/
 
 const role = new Role(app, "", {
   assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com')});

/**
 * Create ECS Fargate
 *
 *
 **/

const fargate = new FargateTaskStack(app, "", {
  albPort: applicationMetaData.allowPort,
  memoryLimitMiB: applicationMetaData.memoryLimitMiB,
  cpu: applicationMetaData.cpu,
  codeLocaltion: applicationMetaData.codeLocaltion,
  taskRole: role,
  cluster: cluster.cluster,
  securityGrp: egressSecurityGroup,
})

/**
 * Create Role-ECS Pipeline
 *
 *
 **/

/**
 * Create Pipeline
 *
 *
 **/
