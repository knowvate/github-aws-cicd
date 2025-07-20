import { Stack, StackProps, Duration, SecretValue } from 'aws-cdk-lib';
import { pipelineConfig } from './pipeline-props';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as cp_actions from 'aws-cdk-lib/aws-codepipeline-actions';

export interface PipelineStackProps extends StackProps {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  codeBuildImage: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // S3 Buckets
    const artifactBucket = new s3.Bucket(this, 'CodePipelineArtifactStore', {
      versioned: true,
    });
    // Apply global Project and Owner tags to all resources in this stack
    pipelineConfig.tags.forEach(tag => {
      this.tags.setTag(tag.key, tag.value);
    });
    // Apply global tags
    pipelineConfig.tags.forEach(tag => {
      this.tags.setTag(tag.key, tag.value);
    });

    // const publicTestBucket = new s3.Bucket(this, 'PublicTestBucket', {
    //   bucketName: `${this.stackName.toLowerCase()}-public-test-bucket`,
    //   versioned: true,
    //   websiteIndexDocument: 'index.html',
    //   websiteErrorDocument: 'error.html',
    //   publicReadAccess: false,
    // });

    // Lambda Role
    const lambdaRole = new iam.Role(this, 'PreSignedUrlLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    // lambdaRole.addToPolicy(new iam.PolicyStatement({
    //   actions: ['s3:GetObject'],
    //   resources: [publicTestBucket.arnForObjects('*')],
    // }));

    // Lambda Function
    // const preSignedUrlLambda = new lambda.Function(this, 'PreSignedUrlLambda', {
    //   runtime: lambda.Runtime.PYTHON_3_9,
    //   handler: 'index.lambda_handler',
    //   code: lambda.Code.fromInline(
    //     `import json
// import boto3
// import os
// def lambda_handler(event, context):
//     bucket = os.environ.get('BUCKET_NAME')
//     key = event.get('key')
//     expires_in = int(event.get('expires_in', 86400))
//     s3 = boto3.client('s3')
//     url = s3.generate_presigned_url('get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=expires_in)
//     return {'statusCode': 200, 'body': json.dumps({'url': url})}`
    //   ),
    //   environment: {
    //     BUCKET_NAME: publicTestBucket.bucketName,
    //   },
    //   role: lambdaRole,
    //   timeout: Duration.seconds(30),
    // });

    // IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(this, 'CodeBuildServiceRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });
    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        's3:GetObject',
        's3:GetObjectVersion',
        's3:PutObject',
        's3:GetBucketAcl',
        's3:GetBucketLocation',
        'codebuild:BatchGetBuilds',
        'codebuild:StartBuild',
      ],
      resources: [
        artifactBucket.bucketArn,
        `${artifactBucket.bucketArn}/*`
      ],
    }));

    // CodeBuild Project
    const codeBuildProject = new codebuild.Project(this, 'CodeBuildProject', {
      source: codebuild.Source.gitHub({
        owner: props.githubOwner,
        repo: props.githubRepo,
        branchOrRef: props.githubBranch,
        cloneDepth: 1,
      }),
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromCodeBuildImageId(props.codeBuildImage),
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yaml'),
    });

    // CodePipeline Role
    const codePipelineRole = new iam.Role(this, 'CodePipelineServiceRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
    });
    codePipelineRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        's3:GetObject',
        's3:GetObjectVersion',
        's3:PutObject',
        's3:GetBucketAcl',
        's3:GetBucketLocation',
        'codebuild:BatchGetBuilds',
        'codebuild:StartBuild',
      ],
      resources: [
        artifactBucket.bucketArn,
        `${artifactBucket.bucketArn}/*`
      ],
    }));

    // Pipeline stages configuration
    interface StageConfig {
      name: string;
      actions: codepipeline.IAction[];
    }

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceCode');
    const sourceStage: StageConfig = {
      name: 'Source',
      actions: [
        new cp_actions.GitHubSourceAction({
          actionName: 'Source',
          owner: props.githubOwner,
          repo: props.githubRepo,
          branch: props.githubBranch,
          oauthToken: SecretValue.secretsManager('GITHUB_ACCESS_TOKEN'),
          output: sourceOutput,
        }),
      ],
    };

    // Build stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildStage: StageConfig = {
      name: 'Build',
      actions: [
        new cp_actions.CodeBuildAction({
          actionName: 'Build',
          project: codeBuildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    };

    // Dev, QA, Prod stages (dummy actions for now)
    const envStages: StageConfig[] = pipelineConfig.environments.map(envConfig => {
      // Example: create a resource per environment and tag it
      // const envBucket = new s3.Bucket(this, `${envConfig.name}Bucket`, { versioned: true });
      // envBucket.node.defaultChild?.addPropertyOverride('Tags', [{ Key: 'Environment', Value: envConfig.name }]);
      // Or simply tag the stack for each environment
      this.tags.setTag('Environment', envConfig.name);
      return {
        name: envConfig.name,
        actions: [
          // Replace with actual deploy actions for each environment
          new cp_actions.ManualApprovalAction({ actionName: `${envConfig.name}Approval` })
        ],
      };
    });

    // Assemble all stages
    const stages: codepipeline.StageProps[] = [
      { stageName: sourceStage.name, actions: sourceStage.actions },
      { stageName: buildStage.name, actions: buildStage.actions },
      ...envStages.map(stage => ({ stageName: stage.name, actions: stage.actions }))
    ];

    // Create pipeline
    const pipeline = new codepipeline.Pipeline(this, 'CodePipeline', {
      pipelineName: this.stackName,
      artifactBucket,
      role: codePipelineRole,
      pipelineType: codepipeline.PipelineType.V2,
      stages,
    });
  }
}