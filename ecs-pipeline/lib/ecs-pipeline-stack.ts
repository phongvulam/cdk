import * as cdk from '@aws-cdk/core';
import ec2   = require("@aws-cdk/aws-ec2");
import ecs   = require("@aws-cdk/aws-ecs");
import s3    = require('@aws-cdk/aws-s3');
import iam   = require('@aws-cdk/aws-iam');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');

import cloudwatch   = require('@aws-cdk/aws-cloudwatch');
import codebuild    = require('@aws-cdk/aws-codebuild');
import codecommit   = require('@aws-cdk/aws-codecommit');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');

export interface PipelineStackProps extends cdk.StackProps { 
  /** Import from entry-point if needed */
  readonly tags?: {
    [key: string]: string;
  };
}

/**
 * @todo 1. VPC: attach the existing VPC
 * 1.1. Create a NEW VPC: simplified VPC (hosting Frontend Application in the Public Subnet), 3-Tier VPC, ...
 * 1.2. Attach the existing VPC
 */
export class EcsPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    /** 1. VPC: attach the existing VPC */
    // const vpc = ec2.Vpc.fromLookup(this, "ECS-VPC", {
    //   vpcId: 'YOUR_VPC_ID', // TODO: Insert your VPC-ID here
    // });

    const vpc = new ec2.Vpc(this, 'DefaultVpc', { maxAzs: 2});
    
    /** @todo 1: 
     * Option 1: create NEW VPC
     * Option 2: reuse the existing VPC (VPC-ID or VPC-Name)
     */
  //   const vpc = new ec2.Vpc(this, 'Production-VPC', {
  //     cidr: '10.50.0.0/18',          
  //     maxAzs: 2,    
  //     natGateways: 1,
  //     subnetConfiguration: [
  //       { 
  //         cidrMask: 24,
  //         subnetType: ec2.SubnetType.PUBLIC,    
  //         name: 'Public-DMZ',
  //       },
  //       {
  //         cidrMask: 24,
  //         name: 'Private-Application',
  //         subnetType: ec2.SubnetType.PRIVATE,
  //       },
  //       {
  //         cidrMask: 24,
  //         name: 'Isolated-Database',
  //         subnetType: ec2.SubnetType.ISOLATED,    
  //       }
  //     ],
  //     gatewayEndpoints: {
  //       S3: {
  //         service: ec2.GatewayVpcEndpointAwsService.S3,
  //       }
  //     }
  // });

    /** 2. Create Cluster */
    const cluster = new ecs.Cluster(this, "ECS-Cluster", {
      vpc: vpc
    });

    /** 3. Attach or create Security Group */
    const securityGrp = ec2.SecurityGroup.fromSecurityGroupId(this, 'security-group', 'YOUR_SECURITY_GRP_ID', { // TODO: Insert security group ID
      mutable: false
    });

    /** 4. Application Load Balancer with Target Group 
     * 4.1. Create Application Load Balancer
     * 4.2. Add Listeners to ELB
     */
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ECS-LoadBalancer', {
      vpc: vpc,
      internetFacing: true,
      ipAddressType: elbv2.IpAddressType.IPV4,
      securityGroup: securityGrp,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC,
      })
    });
  
    /** Add listeners to ELB */
    const targetGrp = new elbv2.ApplicationTargetGroup(this, 'ECS-Targets', {
        vpc: vpc,
        protocol: elbv2.ApplicationProtocol.HTTP, // TODO: Change to HTTPS for production
        port: 3000, // TODO: Change to 443 for production
        targetType: elbv2.TargetType.IP
    }) 

    const loadBalancerListener = alb.addListener('Listener80', {protocol: elbv2.ApplicationProtocol.HTTP, port: 80, open: true, defaultTargetGroups: [targetGrp] });
    
    /** CloudFormation Output >> DNS URL for ELB */
    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: alb.loadBalancerDnsName });

    /**
     * 5. ECS-Task Role & Policy
     */
    const taskRole = new iam.Role(this, 'taskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Adds managed policies to ecs role for ecr image pulls and execution',
    });

    const ecsPolicy: iam.Policy = new iam.Policy(this, 'ecsPolicy', {
      policyName: `ecs-iam-inPol`,
      statements: [
          new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["ecr:GetAuthorizationToken",
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage",
                        "logs:CreateLogStream",
                        "logs:CreateLogGroup",
                        "logs:PutLogEvents"
                      ],
              resources: ['*'],
        }),
      ],
    });

    taskRole.attachInlinePolicy(ecsPolicy);
    taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'));
    taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));

    /**
     * 6. ECS Task
     * @todo configurables `memoryLimitMiB` & `cpu`
     */
    
    /** 6.1. Create ECS Task definition */
    const taskDef = new ecs.FargateTaskDefinition(this, "Task-Definition", {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskRole
    });

    /** 6.2. Add Container Docker-Image */
    const appContainer = new ecs.ContainerDefinition(this, 'AppContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      taskDefinition: taskDef
    });

    /** 6.3. Port mapping
     * @todo configurables `hostPort` & `containerPort`
     * @todo `protocol` NLB vs. ALB ?
     */
    appContainer.addPortMappings({
      hostPort: 3000,
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    /** 
     * 7. Create Fargate Service 
     * @todo configurable `desiredCount`, `maxHealthyPercent`, `minHealthyPercent`
     */    
    const service = new ecs.FargateService(this, "Fargate-Service", {
      cluster: cluster,
      taskDefinition: taskDef,
      desiredCount: 2,
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
      securityGroup: securityGrp,
      assignPublicIp: true
    });

    /**
     * 8.1. CodeBuild Roles & Policies
     */
    /** Create custom IAM role for CodeBuild */
    const cb_role = new iam.Role(this, 'cb-role', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Adds managed policies to CodeBuild role for pipeline execution',
    });

    /** Attach managed policies only... */
    cb_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    cb_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    cb_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess'));
    cb_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
    cb_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipelineFullAccess'));

    /**
     * 8.2. CodePipeline Roles & Policies
     */
    /** CodePipeline Role */
    const pipeline_role = new iam.Role(this, 'pipeline-role', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'CodePipeline Role',
    });

    /** Attach managed policies to CodePipeline */
    pipeline_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeCommitFullAccess'));
    pipeline_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    pipeline_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'));
    pipeline_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'));

    /** S3 Bucket for artifact outputs */
    const pipelineOutputs = new s3.Bucket(this, 'pipeline-build-outputs', {
      bucketName: `pipeline-artifact-outputs`,
      encryption: s3.BucketEncryption.UNENCRYPTED,
      versioned: true
    })

    /**
     * 9. CodePipeline
     */

    // Pipeline Source Stage
    const code_repo = codecommit.Repository.fromRepositoryName(this, 'ImportedRepo',
      'react-boilerplate');

    // Pipeline Build Stage
    const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuild', {
      role: cb_role,
      buildSpec: codebuild.BuildSpec.fromSourceFilename('./buildspec.yml'), // Name of your buildspec file here
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true,
      },
    });

    // We could add the CodeBuild for S3 upload and github enterprise pull here...
    const sourceOutput = new codepipeline.Artifact();
    const cdkBuildOutput = new codepipeline.Artifact();

    loadBalancerListener.addTargetGroups(`${targetGrp}`, {
      targetGroups: [ targetGrp ],
      priority: 2,
      pathPattern: '/'
   });

   targetGrp.addTarget(service);

    // Pipeline ECS Deploy Stage
    new codepipeline.Pipeline(this, 'Pipeline', {
      role: pipeline_role,
      restartExecutionOnUpdate: true,
      artifactBucket: pipelineOutputs,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit_Source',
              repository: code_repo,
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CDK_Build',
              project: cdkBuild,
              input: sourceOutput,
              outputs: [cdkBuildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'ecs_deploy',
              service: service,
              input: cdkBuildOutput
            
            }),
          ],
        },
      ],
    });

    /**
     * 10. CloudWatch Dashboard
     */
    // Setup CloudWatch Dashboard
    const totalBuildFailMetric = new cloudwatch.Metric({
      namespace: 'AWS/CodeBuild',
      metricName: 'FailedBuilds',
      dimensions: { ProjectName: `${cdkBuild.projectName}` },
      statistic: 'Sum',
      period: Duration.days(7)
    });

    const totalBuildDurationMetric = new cloudwatch.Metric({
      namespace: 'AWS/CodeBuild',
      metricName: 'Duration',
      dimensions: { ProjectName: `${cdkBuild.projectName}` },
      statistic: 'Average',
      period: Duration.days(7)
    });

    const totalPostBuildDurationMetric = new cloudwatch.Metric({
      namespace: 'AWS/CodeBuild',
      metricName: 'PostBuildDuration',
      dimensions: { ProjectName: `${cdkBuild.projectName}` },
      statistic: 'Average',
      period: Duration.days(7)
    });

    const totalBuildsMetric = new cloudwatch.Metric({
      namespace: 'AWS/CodeBuild',
      metricName: 'Builds',
      dimensions: { ProjectName: `${cdkBuild.projectName}` },
      statistic: 'Sum',
      period: Duration.days(7)
    });

    const ecsMemoryMetric = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'MemeoryUtilization',
      dimensions: { ProjectName: `${service.serviceName}` },
      statistic: 'Average',
      period: Duration.minutes(5)
    });

    const ecsCPUMetric = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'CPUUtilization',
      dimensions: { ProjectName: `${service.serviceName}` },
      statistic: 'Average',
      period: Duration.minutes(5)
    });

    const applicationELBMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'LoadBalancer',
      dimensions: { ProjectName: `${service.serviceName}` },
      statistic: 'Sum',
      period: Duration.minutes(1)
    });

    const applicationTargetMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'TargetGroup',
      dimensions: { ProjectName: `${alb.loadBalancerName}` },
      statistic: 'Sum',
      period: Duration.minutes(15)
    });

    const buildFailAlarm = new cloudwatch.Metric({
      namespace: 'AWS/CodeBuild',
      metricName: 'FailedBuilds',
      dimensions: { ProjectName: `${targetGrp.targetGroupName}` },
      statistic: 'Sum',
      period: Duration.minutes(5)
    });

    new cloudwatch.Alarm(this, "Alarm", {
      metric: buildFailAlarm,
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1
    });

    const dashboard = new cloudwatch.Dashboard(this, 'CodePipeline-Dashboard', {
      dashboardName: 'ecs-pipeline-dashboard',
      start: '-9H',
      end: '2020-03-25T06:00:00.000Z',
      periodOverride: cloudwatch.PeriodOverride.INHERIT
    });
    dashboard.addWidgets(new cloudwatch.SingleValueWidget({
      region: 'ap-southeast-1',
      metrics: [totalBuildsMetric, totalBuildDurationMetric, totalPostBuildDurationMetric, totalBuildFailMetric],
      title: 'CodeBuild Metrics Past 7 Days',
      height: 5,
      width: 14
    }));
    dashboard.addWidgets(new cloudwatch.GraphWidget({
      region: 'ap-southeast-1',
      left: [ecsMemoryMetric, ecsCPUMetric],
      title: 'ECS CPU-Memeory Utilization Past 7 Days',
      stacked: true,
      height: 10,
      width: 14
    }));
    dashboard.addWidgets(new cloudwatch.GraphWidget({
      region: 'ap-southeast-1',
      left: [applicationELBMetric, applicationTargetMetric],
      title: 'Load Balancer Connection Requests Past 7 Days',
      stacked: false,
      height: 10,
      width: 14
    }));

  }
}
