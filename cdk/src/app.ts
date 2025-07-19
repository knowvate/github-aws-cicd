import { App } from 'aws-cdk-lib';
import { PipelineStack } from './pipeline-stack';

const app = new App();

new PipelineStack(app, 'PipelineStack', {
  githubOwner: 'knowvate', // change as needed
  githubRepo: 'github-aws-cicd', // change as needed
  githubBranch: 'main', // change as needed
  codeBuildImage: 'aws/codebuild/standard:7.0', // change as needed
});