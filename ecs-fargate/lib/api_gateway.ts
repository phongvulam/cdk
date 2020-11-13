import core = require("@aws-cdk/core");

import {
  VpcLink,
  RestApi,
  CfnAuthorizer,
  AuthorizationType,
  EndpointType,
  Integration,
  IntegrationType,
  ConnectionType,
  Model,
  MethodLoggingLevel,
} from "@aws-cdk/aws-apigateway";

import { NetworkLoadBalancedFargateService } from "@aws-cdk/aws-ecs-patterns";
import { UserPool } from "@aws-cdk/aws-cognito";

export interface APIGatewayStackProps {
  readonly ecsService: NetworkLoadBalancedFargateService;
  readonly userPool: UserPool;
  readonly vpcLinkName: string,
  readonly vpcLinkDescription: string,
  readonly stageName: string,
  readonly identitySource: string
  readonly dataTraceEnabled: boolean,
  readonly tracingEnabled: boolean,
  readonly restApiName: string
  readonly tags?: {
    [key: string]: string;
  };
}

export class APIGatewayStack extends core.Stack {
  constructor(parent: core.App, name: string, props: APIGatewayStackProps) {
    super(parent, name, {
      tags: props.tags,
    });

    /* creating VPC link */
    const apiGatewayVPCLink = new VpcLink(this, "APIGatewayVPCLink", {
      targets: [props.ecsService.loadBalancer],
      vpcLinkName: props.vpcLinkName,
      description: props.vpcLinkDescription,
    });

    /* creating the REST API */
    const restAPI = new RestApi(this, "MyRestAPI", {
      endpointTypes: [EndpointType.REGIONAL],
      restApiName: props.restApiName,
      deployOptions: {
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: props.dataTraceEnabled,
        stageName: props.stageName,
        tracingEnabled: props.tracingEnabled,
      },
    });

    /* creating Congnito Authorizer */
    var congitoAuthorizer = new CfnAuthorizer(this, "congitoAuthorizer", {
      restApiId: restAPI.restApiId,
      name: "congito-auth",
      identitySource: props.identitySource,
      providerArns: [props.userPool.userPoolArn],
      type: "COGNITO_USER_POOLS",
    });

    /* Adding the root resource */
    const student = restAPI.root.addResource(
      "student"
    );

    /* adding GET method */
    student.addMethod(
      "GET",
      new Integration({
        type: IntegrationType.HTTP_PROXY,
        integrationHttpMethod: "GET",
        options: {
          connectionType: ConnectionType.VPC_LINK,
          vpcLink: apiGatewayVPCLink,
        },
        uri: `http://${props.ecsService.loadBalancer.loadBalancerDnsName}/student`,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: congitoAuthorizer.ref },
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": true,
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
            responseModels: {
              "application/json": Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );

    /* adding POST method */
    student.addMethod(
      "POST",
      new Integration({
        type: IntegrationType.HTTP_PROXY,
        integrationHttpMethod: "POST",
        options: {
          connectionType: ConnectionType.VPC_LINK,
          vpcLink: apiGatewayVPCLink,
        },
        uri: `http://${props.ecsService.loadBalancer.loadBalancerDnsName}/student`,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: congitoAuthorizer.ref },
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": true,
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
            responseModels: {
              "application/json": Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );

    /* adding PUT method */
    student.addMethod(
      "PUT",
      new Integration({
        type: IntegrationType.HTTP_PROXY,
        integrationHttpMethod: "PUT",
        options: {
          connectionType: ConnectionType.VPC_LINK,
          vpcLink: apiGatewayVPCLink,
        },
        uri: `http://${props.ecsService.loadBalancer.loadBalancerDnsName}/student`,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: congitoAuthorizer.ref },
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": true,
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
            responseModels: {
              "application/json": Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );

    /* adding DELETE method */
    student.addMethod(
      "DELETE",
      new Integration({
        type: IntegrationType.HTTP_PROXY,
        integrationHttpMethod: "DELETE",
        options: {
          connectionType: ConnectionType.VPC_LINK,
          vpcLink: apiGatewayVPCLink,
        },
        uri: `http://${props.ecsService.loadBalancer.loadBalancerDnsName}/student`,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: congitoAuthorizer.ref },
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": true,
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
            responseModels: {
              "application/json": Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );

    /* adding CORS */
    student.addCorsPreflight({
      allowOrigins: ["*"],
      allowHeaders: ["*"],
      allowMethods: ["*"],
    });
  }
}
