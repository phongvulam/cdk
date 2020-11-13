# Creating an AWS Fargate service using the AWS CDK

This CDK Package deploy a SpringBoot application using CDK (Cloud Development Kit).

## Project Structure

* The SpringBoot application is present inside `springboot-aws` folder. You can customize the SpringBoot application by adding more operations or updating/changing the buisness logic.

* All the configurations are picked from `configurations/config.ts` and is supplied to the code for creating infrastructure. Please change the configuration according to your business requirements before deploying.  

## References

* [Creating an AWS Fargate service using the AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/ecs_example.html)

## Useful commands

The `cdk.json` file tells the CDK Toolkit how to execute your app.

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
