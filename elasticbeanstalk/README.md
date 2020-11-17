# [AWS Cloud Development Kit (CDK)]((https://aws.amazon.com/cdk/)) elastic beanstalk


## CDK - useful commands

A CDK app with an instance of a stack (`BlueprintStack`) which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template