export const applicationMetaData = {
    /*AWSAcount*/
    awsAccount: "${AWS_ACCOUNT}",
    awsRegion: "${AWS_REGION}",
    
    /*VPCStackProps*/
    VpcName: "App-Public-VPC",
    maxAzs: 2,
    cidr: "10.0.0.0/16",
    ecsClusterStackName: "App-Public-Cluster-Stack",
    clusterName: "App-Public-Cluster",
    allowPort: 80,
    
    /*FargateTaskStack*/
    memoryLimitMiB: 512,
    cpu: 256,
    codeLocaltion: "",
}