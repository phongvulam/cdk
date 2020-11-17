import * as cdk from '@aws-cdk/core';
import ec2   = require("@aws-cdk/aws-ec2");
import ecs   = require("@aws-cdk/aws-ecs");
import s3    = require('@aws-cdk/aws-s3');
import iam   = require('@aws-cdk/aws-iam');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');

// import cloudwatch   = require('@aws-cdk/aws-cloudwatch');
// import codebuild    = require('@aws-cdk/aws-codebuild');
// import codecommit   = require('@aws-cdk/aws-codecommit');
// import codepipeline = require('@aws-cdk/aws-codepipeline');
// import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');

export interface PipelineStackProps extends cdk.StackProps { 
  /** Import from entry-point if needed */
  readonly tags?: {
    [key: string]: string;
  };
}

/**
 * 
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
    
    /**  */
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

    /** 6.3. Port mapping*/
    appContainer.addPortMappings({
      hostPort: 3000,
      containerPort: 3000,
      protocol: ecs.Protocol.TCP
    });

    /** 
     * Create Fargate Service 
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
  }
}
