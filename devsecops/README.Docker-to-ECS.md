#  Using **[Docker Desktop](https://www.docker.com/products/docker-desktop)** and **[Docker Compose](https://docs.docker.com/compose)** to deploy applications to **[Amazon ECS](https://aws.amazon.com/ecs)** on **[AWS Fargate](https://aws.amazon.com/fargate/)** 👍⚡️🦅

## 1. Prerequisites

* [x] 1.1. [Install AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
  * [x] `aws --version`
  * [x] `aws configure --profile ecs` to select the AWS API credentials from `cat ~/.aws/credentials`
  * [x] [login to the AWS console and opt-in to the new ARN and resource format](https://console.aws.amazon.com/ecs/home?#/settings)
    * Container instance: `Enabled`
    * Service: `Enabled`
    * Task: `Enabled`
* [x] 1.2. [Install **Docker Desktop Edge** version **2.3.4+** on MacOS & Windows](https://docs.docker.com/desktop/)
* [x] 1.3. [Deploying Docker containers on ECS](https://docs.docker.com/engine/context/ecs-integration/)
  * [x] `docker ecs version`
  * 

## 2. Create AWS context

```
docker ecs setup --profile ecs

docker context use ecs
# docker context ls
```

## 3. The application and the resources will be created in AWS

```
docker ecs compose up
```

> `curl EcsLoadBalancer-42511991.ap-southeast-1.elb.amazonaws.com`

## References:

* [AWS and Docker collaborate to simplify the developer experience](https://aws.amazon.com/blogs/containers/aws-docker-collaborate-simplify-developer-experience/)
* [From Docker Straight to AWS](https://www.docker.com/blog/from-docker-straight-to-aws/) & 
* [Deploying Docker containers on ECS](https://docs.docker.com/engine/context/ecs-integration/)
