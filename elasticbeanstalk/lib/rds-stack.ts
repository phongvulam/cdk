import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import {getGetVpc} from './vpc-stack';
import { envVars } from './config';

import {$log} from "@tsed/logger";
$log.level = "debug";
$log.name = "VPC";
import { DatabaseInstanceEngine,DatabaseInstance } from '@aws-cdk/aws-rds';

export class RDSStack extends cdk.Stack {
	readonly oracleRDSInstance: DatabaseInstance;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const vpc = getGetVpc(this);
		
		// const custom_engine_version = rds.OracleEngineVersion.of("19.0.0.0.ru-2020-04.rur-2020-04.r1", "19")
		this.oracleRDSInstance = new rds.DatabaseInstance(this, 
			envVars.RDS_INSTANCE_NAME, 
			{
				// engine: DatabaseInstanceEngine .oracleSe2({version: rds.OracleEngineVersion.VER_12_1_0_2_V2},),
				engine: DatabaseInstanceEngine.oracleSe({version: rds.OracleLegacyEngineVersion.VER_11_2_0_4_V1},),
				licenseModel: rds.LicenseModel.BRING_YOUR_OWN_LICENSE || rds.LicenseModel.LICENSE_INCLUDED || rds.LicenseModel.GENERAL_PUBLIC_LICENSE,
				instanceType: ec2.InstanceType.of(ec2.InstanceClass.M4, ec2.InstanceSize.LARGE),
				vpc: vpc,
				vpcPlacement: {subnetType: ec2.SubnetType.PUBLIC},
				storageEncrypted: true,
				multiAz: true,	
				autoMinorVersionUpgrade: false,
				allocatedStorage: 200,
				storageType: rds.StorageType.GP2,
				backupRetention: cdk.Duration.days(7),
				monitoringInterval: cdk.Duration.seconds(60),
				enablePerformanceInsights: true,
				deletionProtection: false,
				credentials : {username:envVars.RDS_CREDENTIAL_USERNAME, password: cdk.SecretValue.plainText(envVars.RDS_CREDENTIAL_PAWSSWORD),},
				databaseName: envVars.RDS_DATABASE_NAME,
				port: 1521,
				iamAuthentication:false,
				// domain: 'billservice.database',
				instanceIdentifier: envVars.RDS_DATABASE_NAME||'db',
				cloudwatchLogsExports: [
					'trace',
					'audit',
					'alert',
					'listener',
				],
				// optionGroup,
				// parameterGroup,
			}
		);

		const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
			vpc,
			securityGroupName: "Oracle-SG",
			description: 'Allow http access to rds from anywhere',
			allowAllOutbound: true,
		  });
		this.oracleRDSInstance.connections.addSecurityGroup(rdsSecurityGroup);
		this.oracleRDSInstance.connections.allowDefaultPortFromAnyIpv4('1521');


		new cdk.CfnOutput(this, "DBConnection",{
			value:this.oracleRDSInstance.instanceEndpoint.hostname+':'+this.oracleRDSInstance.instanceEndpoint.port,
		});


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