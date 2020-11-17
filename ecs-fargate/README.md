# Creating an AWS Fargate service using the AWS CDK

This CDK Package deploy a SpringBoot application using CDK (Cloud Development Kit).

* [ ] Publish Spring Boot Docker Images to ECR using Maven Plugin.docx: .sh --> **TravelBuddy** + ECR/Docker 
    * [ ] **SpringBoot** >> `springboot-aws/Dockerfile` >> ECR >> `Code Pipeline` https://start.spring.io/starter.zip --> **TravelBuddy**
    * [ ] .docx --> .sh

* [ ] DynamoDB: CRUD `/student` --> CRUD `/TravelBuddy` 
    * [ ] Student_Table --> TravelBuddy Table
    * [ ] studentId     --> TravelBuddy xxxID
    * [ ] student, student.addMethod - `api_gateway.ts`

* [ ] Configurable variable using dotenv `.env`

* [ ] Support both: `NLB` layer-4  --> `ALB` layer-7 

* [ ] Postman: nice to have 

* [ ] https://github.com/nnthanh101/cdk/blob/master/aws-infrastructure/lib/aws-infrastructure-stack.ts
 
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
