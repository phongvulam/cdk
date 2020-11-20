import * as cdk from '@aws-cdk/core';
import elasticbeanstalk = require('@aws-cdk/aws-elasticbeanstalk');
import s3assets = require('@aws-cdk/aws-s3-assets');
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import { ServicePrincipal } from '@aws-cdk/aws-iam';
import { envVars } from './config';
import {$log} from "@tsed/logger";
import {getGetVpc} from './vpc-stack';

$log.level = "debug";
$log.name = "EBStack";

// const app = new cdk.App();
export class EBStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

		const vpc = getGetVpc(this);

    // Construct an S3 asset from the ZIP located from directory up.cd
    const elbZipArchive = new s3assets.Asset(this, 'MyElbAppZip', {
      path: '${__dirname}/../../elasticbeanstalk/Spring-Boot-swagger/target/Spring-Boot-swagger2-0.0.1-SNAPSHOT.jar',
    });
    new cdk.CfnOutput(this, 'S3BucketSourceCode', { value: elbZipArchive.s3BucketName })

    const appName = envVars.EB_APP_NAME;
    const app = new elasticbeanstalk.CfnApplication(this, 'Application', {
        applicationName: appName,
    });

    // This is the role that your application will assume
    const ebRole = new iam.Role(this, 'CustomEBRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });
    // ebRole.addManagedPolicy({ 
    //   managedPolicyArn: 'arn:aws:iam::aws:policy/AWSElasticBeanstalk'
    // });
    // ebRole.addManagedPolicy({ 
    //   managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalk*'
    // });

    // This is the Instance Profile which will allow the application to use the above role
    const ebInstanceProfile = new iam.CfnInstanceProfile(this, 'CustomInstanceProfile', {
      roles: [ebRole.roleName],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'securityGroup', {
      vpc: vpc,
    });

        const optionSettingProperties: elasticbeanstalk.CfnEnvironment.OptionSettingProperty[] = [
      {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'InstanceType',
          value: ec2.InstanceClass.C3+'.'+ec2.InstanceSize.LARGE,
      },
      {
        namespace: 'aws:ec2:vpc',
        optionName: 'VPCId',
        value: vpc.vpcId,
      },
        {
          namespace: 'aws:ec2:vpc',
          optionName: 'ELBSubnets',
          value: vpc.publicSubnets.map(value => value.subnetId).join(','),
        },
        {
          namespace: 'aws:ec2:vpc',
          optionName: 'Subnets',
          value: vpc.privateSubnets.map(value => value.subnetId).join(','),
        },
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'IamInstanceProfile',
        // Here you could reference an instance profile by ARN (e.g. myIamInstanceProfile.attrArn)
        // For the default setup, leave this as is (it is assumed this role exists)
        // https://stackoverflow.com/a/55033663/6894670
        value: ebInstanceProfile.attrArn,
      },
      {
          namespace: 'aws:elasticbeanstalk:container:tomcat:jvmoptions',
          optionName: 'Xms',
          value: '256m',
      },
      {
        namespace: 'aws:elasticbeanstalk:container:tomcat:jvmoptions',
        optionName: 'Xmx',
        value: '512m  ',
      },
      {
        namespace: 'aws:elasticbeanstalk:environment:proxy',
        optionName: 'ProxyServer',
        value: 'apache',
      },
      { namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'EC2KeyName',
        value: 'ee-default-keypair'
      },
    ];

    // Create an app version from the S3 asset defined above
    // The S3 "putObject" will occur first before CF generates the template
    const appVersionProps = new elasticbeanstalk.CfnApplicationVersion(this, 'AppVersion', {
      applicationName: appName,
      sourceBundle: {
          s3Bucket: elbZipArchive.s3BucketName,
          s3Key: elbZipArchive.s3ObjectKey,
      },
    }); 

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // aws elasticbeanstalk list-available-solution-stacks (command)
    const elbEnv = new elasticbeanstalk.CfnEnvironment(this, 'Environment', {
      environmentName: 'BillserviceEnvironment',
      applicationName: app.applicationName || appName,
      solutionStackName: '64bit Amazon Linux 2018.03 v3.4.1 running Tomcat 8.5 Java 8',
      optionSettings: optionSettingProperties,
      // cnamePrefix:'',
      description:'billservice is deployed in elastic beanstalk with tomcat',
      // This line is critical - reference the label created in this same stack
      versionLabel: appVersionProps.ref,
      
    });
    // Also very important - make sure that `app` exists before creating an app version
    appVersionProps.addDependsOn(app);
  }
}