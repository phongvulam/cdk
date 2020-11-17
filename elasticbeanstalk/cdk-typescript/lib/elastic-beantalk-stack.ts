import cdk = require('@aws-cdk/core');
import elasticbeanstalk = require('@aws-cdk/aws-elasticbeanstalk');
import s3assets = require('@aws-cdk/aws-s3-assets');

export class ElbtestStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

     // Construct an S3 asset from the ZIP located from directory up.
     const elbZipArchive = new s3assets.Asset(this, 'MyElbAppZip', {
      path: `${__dirname}/../app.war`,
  });

  const appName = 'MyApp';
  const app = new elasticbeanstalk.CfnApplication(this, 'Application', {
      applicationName: appName,
  });


  }
}