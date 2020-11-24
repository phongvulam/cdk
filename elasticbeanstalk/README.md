# Welcome to your CDK TypeScript project!

## (`sudo yum install redhat-lsb-core` or `yum install redhat-lsb` or `dnf install redhat-lsb-core`)
## 1. `sudo sh cdk/install-prerequisites.sh`
## 2. `eb init`     if get conflict version=> pip3 --version (check python version) run `sudo pip3 install awsebcli``


[*] Upgrade cdk schame version
* `npm uninstall -g cdk`
* `npm install -g aws-cdk`

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
