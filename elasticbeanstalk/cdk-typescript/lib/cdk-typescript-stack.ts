import * as cdk from '@aws-cdk/core';
import elasticbeanstalk = require('@aws-cdk/aws-elasticbeanstalk');
import s3assets = require('@aws-cdk/aws-s3-assets');
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import { Policy, ServicePrincipal } from '@aws-cdk/aws-iam';
import { envVars } from './config';
import {$log} from "@tsed/logger";
import {getOrCreateVpc} from './vpc-stack';
// import {
//   CloudFrontWebDistribution,
//   CloudFrontWebDistributionProps,
//   OriginAccessIdentity,
// } from '@aws-cdk/aws-cloudfront';

$log.level = "debug";
$log.name = "CdkTypescriptStack";

const app = new cdk.App();
export class CdkTypescriptStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

		const vpc = ec2.Vpc.fromLookup(this, 'checkvpc', {
			vpcName: 'vpc-stack/'+envVars.VPC_NAME_DEVELOPMENT,
		});
		$log.info('eb - vpcid: ' + vpc.vpcId);

    // Construct an S3 asset from the ZIP located from directory up.cd
    const elbZipArchive = new s3assets.Asset(this, 'MyElbAppZip', {
      path: '${__dirname}/../../target/aws-billservice-0.0.1.war',
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
          namespace: 'aws:ec2:vpc',
          optionName: 'Subnets',
          value: vpc.publicSubnets.map(value => value.subnetId).join(','),
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

/////////////////////////////////////////////////////////////////////////////////////////////////////

// const bucket = new S3.Bucket(this, envVars.BUCKET_NAME, {
//   websiteIndexDocument: 'index.html',
//   websiteErrorDocument: 'index.html',
//   removalPolicy: cdk.RemovalPolicy.DESTROY,
// });

// // Create an Origin Access Identity (OAI), for our Cloudfront distribution. This will allow only Cloudfront to access our static website from S3 and if someone tries to access it otherwise, it will be denied. So everyone would be able to view the website only via the Cloudfront URL.
// const cloudFrontOAI = new OriginAccessIdentity(this, 'OAI', {
//   comment: 'OAI for ${envVars.WEBSITE_NAME} website.',
// });

// // Create the Cloudfront distribution, providing it the 
// const cloudFrontDistProps: CloudFrontWebDistributionProps = {
//   originConfigs: [
//     {
//       s3OriginSource: {
//         s3BucketSource: bucket,
//         originAccessIdentity: cloudFrontOAI,
//       },
//       behaviors: [{ isDefaultBehavior: true }],
//     },
//   ],
// };


// const cloudfrontDist = new CloudFrontWebDistribution(
//   this,
//   '${envVars.WEBSITE_NAME}-cfd',
//   cloudFrontDistProps
// );

// //adding a policy for our S3 bucket to only accept requests from Cloudfront. And to add policies, the one service that comes to mind is IAM!
// //So let's create a policy to restrict the S3 bucket access to Cloudfront only. 
// // we create a new IAM Policy named cloudfrontS3Access and we add some specific actions to it. The actions being getting all the objects and the bucket as well.
// const cloudfrontS3Access = new IAM.PolicyStatement();
// cloudfrontS3Access.addActions('s3:GetBucket*');
// cloudfrontS3Access.addActions('s3:GetObject*');
// cloudfrontS3Access.addActions('s3:List*');
// cloudfrontS3Access.addResources(bucket.bucketArn);
// cloudfrontS3Access.addResources(`${bucket.bucketArn}/*`);
// cloudfrontS3Access.addCanonicalUserPrincipal(
//   cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
// );

// //In the addResources method, we specify the resources. Now we not only want the bucket itself but also the entire contents inside the bucket. Which is why we have provided two resources.
// cloudfrontS3Access.addResources(bucket.bucketArn);
// cloudfrontS3Access.addResources(`${bucket.bucketArn}/*`);

// // /The first one is for the bucket and the second for the contents inside the bucket.
// // Lastly we add as the Principal, the origin access identity that we created above. Only what's in the Principal can access the specified resource. So here, only our Cloudfront distribution can access this resource.
// // Now, we have created this policy but not added it anywhere. Where could it likely be added? You guessed it right! In our S3 Bucket policy. So we have to tell the bucket in some way that this policy should be attached and the way we do it is below
// // We are telling our S3 Bucket to add the policy cloudfrontS3Access.
// bucket.addToResourcePolicy(cloudfrontS3Access);

// // Now we are moving on to the last step of our development, i.e. creating a Codebuild project.
// // First, we create a GitHub repository source that Codebuild can use.
// // Note: You can create a Bitbucket repo in the same manner as well.

  }
}
