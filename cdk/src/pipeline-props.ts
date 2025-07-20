export interface EnvironmentConfig {
  name: string;
  approvalRequired?: boolean;
}


export interface PipelineTag {
  key: string;
  value: string;
}

export interface PipelineConfig {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  codeBuildImage: string;
  environments: EnvironmentConfig[];
  createdBy: string;
  createdOn: string;
  tags: PipelineTag[];
}

export const pipelineConfig: PipelineConfig = {
  githubOwner: 'Knowvate',
  githubRepo: 'github-aws-cicd',
  githubBranch: 'main',
  codeBuildImage: 'aws/codebuild/standard:7.0',
  environments: [
    { name: 'Dev', approvalRequired: false },
    { name: 'QA', approvalRequired: true },
    { name: 'Prod', approvalRequired: true }
  ],
  createdBy: 'Knowvate',
  createdOn: '2025-07-20',
  tags: [
    { key: 'Project', value: 'github-aws-cicd' },
    { key: 'Owner', value: 'Knowvate' }
  ]
};