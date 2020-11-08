#!/bin/bash
# set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

function _logger() {
    echo -e "$(date) ${YELLOW}[*] $@ ${NC}"
}

source .env.sh
# ./install-prerequisites.sh

echo
echo "#########################################################"
_logger "[+] Verify the prerequisites environment"
echo "#########################################################"
echo
## DEBUG
echo "[x] Verify CDK": $(cdk --version)
echo "[x] Verify Node.js": $(node --version)

currentPrincipalArn=$(aws sts get-caller-identity --query Arn --output text)
## Just in case, you are using an IAM role, we will switch the identity from your STS arn to the underlying role ARN.
currentPrincipalArn=$(sed 's/\(sts\)\(.*\)\(assumed-role\)\(.*\)\(\/.*\)/iam\2role\4/' <<< $currentPrincipalArn)
echo $currentPrincipalArn
cdk bootstrap aws://${AWS_ACCOUNT}/${AWS_REGION}

started_time=$(date '+%d/%m/%Y %H:%M:%S')
echo
echo "#########################################################"
_logger "[+] [START] Deploy CDK-TypeScript at ${started_time}"
echo "#########################################################"
echo

echo
echo "#########################################################"
_logger "[+] 1. [AWS Infrastructure] VPC, EC2/Cloud9, ECS, EKS"
echo "#########################################################"
echo

cd aws-infrastructure

## DEBUG
echo $AWS_ACCOUNT + $AWS_REGION + $AWS_VPC_NAME + $AWS_VPC_CIDR + $AWS_INFRASTRUCTURE_STACK
rm -rf cdk.out/*.* cdk.context.json
npm run build

## cdk diff $AWS_INFRASTRUCTURE_STACK
## cdk synth $AWS_INFRASTRUCTURE_STACK
cdk deploy $AWS_INFRASTRUCTURE_STACK


ended_time=$(date '+%d/%m/%Y %H:%M:%S')
echo
echo "#########################################################"
echo -e "${RED} [END] CDK-TypeScript at ${ended_time} - ${started_time} ${NC}"
echo "#########################################################"
echo
