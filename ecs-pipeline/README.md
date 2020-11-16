# Automated CI/CD Pipeline to deploy React Application Docker-Image to ECS using AWS CDK TypeScript

This solution uses AWS CDK to automatically launch a provisioned **CI/CD Pipeline**, build a **Docker Image** of the source repository containing a `React` application, deploy the Docker Image to an `ECS Fargate` service with an attached `Application Load Balancer`, and launch a `CloudWatch Dashboard` with key metrics for CI/CD Pipeline monitoring. This solution was originally built for a customer deploying to an internal corporate network, but has been modified to deploy a public URL served by the Application Load Balancer. The CI/CD Pipeline will be triggered by new updates to the source repository.

### 1.1. The SolutionArchitecture:

![Pipeline Diagram](./images/pipeline.png)

### 1.2. Benefits

This solution allows a CI/CD pipeline to be launched into an AWS environment without having to build everything in the console and makes creation/deletion of the required Infrastructure fast and simple. It can also be used as a starting template for those getting started with AWS CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

### Clean-up
To remove your deployed stack run:

> cdk destroy

Note: You may need to manually delete the generated S3 Bucket from your account.
