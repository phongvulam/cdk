import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { envVars } from './config';

export class VpcStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    getCreateVpc(this);
  }
}

export function getCreateVpc(stack: cdk.Stack): ec2.Vpc {
	
	/** Use an existing VPC or create a new one */
	const vpc =  new ec2.Vpc(stack, envVars.VPC_NAME_DEVELOPMENT, 
		{
			cidr: envVars.VPC_CIDR,
			maxAzs: 2,
			natGateways: 1,
			subnetConfiguration: [
				{
			// Using isolated subnet instead of a private subnet to saves cost of a NAT-Gateway inside our VPC.
				cidrMask: envVars.VPC_ISOLATED_CIDRMASK,
				name: 'isolated',
				subnetType: ec2.SubnetType.ISOLATED, //No resources will be created for this subnet, but the IP range will be kept available for future creation of this subnet
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
	)
	return vpc
}

export function getGetVpc(stack: cdk.Stack): ec2.IVpc {
	const vpc = ec2.Vpc.fromLookup(
		stack, 
		envVars.VPC_NAME_DEVELOPMENT, {
		vpcName: 'vpc-stack/'+envVars.VPC_NAME_DEVELOPMENT,
	});

	// const vpc = stack.node.tryGetContext('use_default_vpc') === '1' ?
	// 		ec2.Vpc.fromLookup(stack, envVars.VPC_NAME_DEVELOPMENT, { isDefault: true }) :
	// 			stack.node.tryGetContext('use_vpc_id');
	// $log.info(vpc)
	return vpc;
}
