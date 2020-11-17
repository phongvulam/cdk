import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as kms from '@aws-cdk/aws-kms';
import * as dotenv from 'dotenv';
import { envVars } from './config';

import {$log} from "@tsed/logger";
$log.level = "debug";
$log.name = "VPC";

import {Peer, Port, SecurityGroup, SubnetType, Vpc, InstanceClass, InstanceType, InstanceSize} from '@aws-cdk/aws-ec2';
import { CfnDBCluster, CfnDBSubnetGroup, DatabaseInstanceEngine,DatabaseInstance } from '@aws-cdk/aws-rds';
import { userInfo } from 'os';
import { log } from 'console';
import { env } from 'process';
export class VpcStack extends cdk.Stack {
	readonly oracleRDSInstance: DatabaseInstance;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);
		
		$log.info('account id: ' + props?.env?.account);
		$log.info('account refion: ' + props?.env?.region);
		const checkvpc = ec2.Vpc.fromLookup(this, 'checkvpc', {
			vpcName: 'vpc-stack/'+envVars.VPC_NAME_DEVELOPMENT,
		});
		$log.info('checkvpc: ' + checkvpc.vpcId);

		const vpc = getOrCreateVpc(this);
		const securityGroup = new ec2.SecurityGroup(this, 'MyCDKSecurityGroup', {
			vpc,
			securityGroupName: "Instance-SG",
			description: 'Allow http access to ec2 instances from anywhere',
			allowAllOutbound: true 
		  });

		  securityGroup.addIngressRule(
			ec2.Peer.anyIpv4(), 
			ec2.Port.tcp(80), 
			'allow ingress http traffic'                                                                                                                                                     
		  )

		  securityGroup.addIngressRule(
			ec2.Peer.anyIpv4(), 
			ec2.Port.tcp(22), 
			'allow ingress ssh traffic'                                                                                                                                                     
		  )

		  const linux = new ec2.AmazonLinuxImage({
			generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
			edition: ec2.AmazonLinuxEdition.STANDARD,
			virtualization: ec2.AmazonLinuxVirt.HVM,
			storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
		  });

		  // tags?
		  const instance =  new ec2.Instance(this, 'MyCDKInstance', {
			vpc,
			machineImage: linux,
			instanceName: 'CDKInstance',
			instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.LARGE),
			securityGroup: securityGroup,
		  })
		  instance.addUserData("lam");
		  instance.instance.addPropertyOverride('KeyName', 'ee-default-keypair');
		
		// You can only create an Amazon Aurora DB cluster in a Virtual Private Cloud (VPC) that spans two Availability Zones. Creating VPC is simple but you have to be careful not to create NAT gateways to prevent unnecessary costs. We do not need internet access from our VPC so we will set subnet type to be ISOLATED.
	// 	const vpc = new Vpc(this, envVars.VPC_NAME, {
	// 		cidr: envVars.VPC_CIDR,
	// 		maxAzs: 2,
	// 		//configuration will create 3 groups in 2 AZs = 6 subnets.
	// 		subnetConfiguration: [
	// 			{
	// 			// Using isolated subnet instead of a private subnet to saves cost of a NAT-Gateway inside our VPC.
	// 			cidrMask: envVars.VPC_ISOLATED_CIDRMASK,
	// 			name: 'isolated',
	// 			subnetType: SubnetType.ISOLATED, //No resources will be created for this subnet, but the IP range will be kept available for future creation of this subnet
	// 			},
	// 			{
	// 				cidrMask: envVars.VPC_PUBLIC_CIDRMASK,
	// 				name: 'public',
	// 				subnetType: ec2.SubnetType.PUBLIC,
	// 			},
	// 			{
	// 				cidrMask: envVars.VPC_PRIVATE_CIDRMASK,
	// 				name: 'private',
	// 				subnetType: ec2.SubnetType.PRIVATE,
	// 			},
	// 		],
	// 		natGateways: 1
	// 	//natGetways=0 | remove config private subnet => NO NAT Gateways to reduce COST
	// 	});

	// 	// CloudFormation will create subnetIds for us. We will have to pass this information to Oracle.
	// 	const subnetIds: string[] = [];
	// 	vpc.isolatedSubnets.forEach((subnet, index) => {
	// 		subnetIds.push(subnet.subnetId);
	// 	});
	
	// 	//We can then easily output subnetIds and default security group after stack is successfully created.
	// 	new cdk.CfnOutput(this, 'VpcSubnetIds', {
	// 		value: JSON.stringify(subnetIds)
	// 	});
		
	// 	new cdk.CfnOutput(this, 'VpcDefaultSecurityGroup', {
	// 		value: vpc.vpcDefaultSecurityGroup
	// 	});
	// //---------------------------------------------------
		
		 // Set open cursors with parameter group
		//  const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
		// 	engine: rds.DatabaseInstanceEngine.oracleSe2({ version: rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1 }),
		// 	parameters: {
		// 	  open_cursors: '2500',
		// 	},
		// });

		// const optionGroup = new rds.OptionGroup(this, 'OptionGroup', {
		// 	engine: rds.DatabaseInstanceEngine.oracleSe2({ version: rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1 }),
		// 	configurations: [
		// 	  {
		// 		name: 'LOCATOR',
		// 	  },
		// 	  {
		// 		name: 'OEM',
		// 		port: 1158,
		// 		vpc,
		// 	  },
		// 	],
		// });
		// // Allow connections to OEM
		// optionGroup.optionConnections.OEM.connections.allowDefaultPortFromAnyIpv4();
		
		// const custom_engine_version = rds.OracleEngineVersion.of("19.0.0.0.ru-2020-04.rur-2020-04.r1", "19")
		// this.oracleRDSInstance = new rds.DatabaseInstance(this, 
		// 	envVars.RDS_INSTANCE_NAME, 
		// 	{
		// 		// engine: DatabaseInstanceEngine .oracleSe2({version: rds.OracleEngineVersion.VER_12_1_0_2_V2},),
		// 		engine: DatabaseInstanceEngine.oracleSe({version: rds.OracleLegacyEngineVersion.VER_11_2_0_4_V1},),
		// 		licenseModel: rds.LicenseModel.LICENSE_INCLUDED || rds.LicenseModel.BRING_YOUR_OWN_LICENSE || rds.LicenseModel.GENERAL_PUBLIC_LICENSE,
		// 		instanceType: ec2.InstanceType.of(ec2.InstanceClass.M4, ec2.InstanceSize.LARGE),
		// 		vpc: vpc,
		// 		vpcPlacement: {subnetType: SubnetType.PUBLIC},
		// 		storageEncrypted: true,
		// 		multiAz: true,	
		// 		autoMinorVersionUpgrade: false,
		// 		allocatedStorage: 200,
		// 		storageType: rds.StorageType.GP2,
		// 		backupRetention: cdk.Duration.days(7),
		// 		monitoringInterval: cdk.Duration.seconds(60),
		// 		enablePerformanceInsights: true,
		// 		deletionProtection: false,
		// 		credentials : {username:envVars.RDS_CREDENTIAL_USERNAME, password: cdk.SecretValue.plainText(envVars.RDS_CREDENTIAL_PAWSSWORD),},
		// 		databaseName: envVars.RDS_DATABASE_NAME,
		// 		port: 1521,
		// 		iamAuthentication:false,
		// 		// domain: 'billservice.database',
		// 		instanceIdentifier: envVars.RDS_DATABASE_NAME||'db',
		// 		cloudwatchLogsExports: [
		// 			'trace',
		// 			'audit',
		// 			'alert',
		// 			'listener',
		// 		],
		// 		// optionGroup,
		// 		// parameterGroup,
		// 	}
		// );

		// const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
		// 	vpc,
		// 	securityGroupName: "Oracle-SG",
		// 	description: 'Allow http access to rds from anywhere',
		// 	allowAllOutbound: true,
		//   });
		// this.oracleRDSInstance.connections.addSecurityGroup(rdsSecurityGroup);
		// this.oracleRDSInstance.connections.allowDefaultPortFromAnyIpv4('1521');


		// new cdk.CfnOutput(this, "DBConnection",{
		// 	value:this.oracleRDSInstance.instanceEndpoint.hostname+':'+this.oracleRDSInstance.instanceEndpoint.port,
		// });


	// // construct arn from available information
	// const { region, account } = process.env;
	// const oracleArn = 'arn:aws:rds:${region}:${account}:cluster:${oracle.dbClusterIdentifier}';

	// new cdk.CfnOutput(this, 'OracleClusterArn', {
	// 	value: oracleArn
	// }); 
	  
	//   //wait for subnet group to be created
	//   oracle.addDependsOn(dbSubnetGroup);
	}
}

/**
 * Step 1. use an existing VPC or create a new one for our EKS Cluster
 * 
 * Note: only 1 NAT Gateway --> Cost Optimization trade-off
 */ 
export function getOrCreateVpc(stack: cdk.Stack): ec2.IVpc {
	
	/** Use an existing VPC or create a new one */
	const vpc = stack.node.tryGetContext('use_default_vpc') === '1' ?
		ec2.Vpc.fromLookup(stack, envVars.VPC_NAME_DEVELOPMENT, { isDefault: true }) :
			stack.node.tryGetContext('use_vpc_id') ?
		ec2.Vpc.fromLookup(stack, 
			envVars.VPC_NAME_DEVELOPMENT, 
		  	{ vpcId: stack.node.tryGetContext('use_vpc_id') }) :
			new ec2.Vpc(stack, envVars.VPC_NAME_DEVELOPMENT, 
			  	{
					cidr: envVars.VPC_CIDR,
					maxAzs: 2,
					natGateways: 1,
					subnetConfiguration: [
						{
					// Using isolated subnet instead of a private subnet to saves cost of a NAT-Gateway inside our VPC.
						cidrMask: envVars.VPC_ISOLATED_CIDRMASK,
						name: 'isolated',
						subnetType: SubnetType.ISOLATED, //No resources will be created for this subnet, but the IP range will be kept available for future creation of this subnet
						},
						{
							cidrMask: envVars.VPC_PUBLIC_CIDRMASK,
							name: 'public',
							subnetType: ec2.SubnetType.PUBLIC,
						},
						{
							cidrMask: envVars.VPC_PRIVATE_CIDRMASK,
							name: 'private',
							subnetType: ec2.SubnetType.PRIVATE,
						}, 
					],
					enableDnsHostnames:true,
					enableDnsSupport:true,
				}
			);  
	return vpc
}

export function managementVpc(stack: cdk.Stack): ec2.IVpc {
	
	/** Use an existing VPC or create a new one */
	const vpc = stack.node.tryGetContext('use_default_vpc') === '1' ?
		ec2.Vpc.fromLookup(stack, envVars.VPC_NAME_PRODUCTION, { isDefault: true }) :
			stack.node.tryGetContext('use_vpc_id') ?
		ec2.Vpc.fromLookup(stack, 
			envVars.VPC_NAME_PRODUCTION, 
		  	{ vpcId: stack.node.tryGetContext('use_vpc_id') }) :
			new ec2.Vpc(stack, envVars.VPC_NAME_PRODUCTION, 
			  	{
					cidr: envVars.VPC_CIDR,
					maxAzs: 2,
					natGateways: 1,
					subnetConfiguration: [
						{
					// Using isolated subnet instead of a private subnet to saves cost of a NAT-Gateway inside our VPC.
						cidrMask: envVars.VPC_ISOLATED_CIDRMASK,
						name: 'isolated',
						subnetType: SubnetType.ISOLATED, //No resources will be created for this subnet, but the IP range will be kept available for future creation of this subnet
						},
						{
							cidrMask: envVars.VPC_PUBLIC_CIDRMASK,
							name: 'public',
							subnetType: ec2.SubnetType.PUBLIC,
						},
						{
							cidrMask: envVars.VPC_PRIVATE_CIDRMASK,
							name: 'private',
							subnetType: ec2.SubnetType.PRIVATE,
						}, 
					],
					enableDnsHostnames:true,
					enableDnsSupport:true,
				}
			);  
	return vpc
}