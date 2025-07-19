# Development Environment Setup

To set up this project on a fresh machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/knowvate/github-aws-cicd.git
   cd github-aws-cicd
   ```

2. **Install Node.js and npm:**
   - Download and install from https://nodejs.org/

3. **Install AWS CLI:**
   - Download and install from https://aws.amazon.com/cli/
   - Configure credentials:
     ```bash
     aws configure
     ```

4. **Install AWS CDK CLI:**
   ```bash
   npm install -g aws-cdk
   ```

5. **Install project dependencies:**
   ```bash
   npm install --prefix cdk
   ```

6. **Bootstrap your AWS environment (first time only):**
   ```bash
   npx cdk bootstrap
   ```

7. **Store your GitHub token in AWS Secrets Manager:**
   - Secret name: `GITHUB_ACCESS`
   - Key: `GITHUB_ACCESS_TOKEN`
   - Value: your GitHub token

8. **Edit pipeline parameters as needed:**
   - In `cdk/src/app.ts` or `cdk/src/pipeline-stack.ts`.

9. **Synthesize and deploy the stack:**
   ```bash
   npx cdk synth
   npx cdk deploy > STACK_ERRORS.txt 2>&1
   ```

10. **If you see an error about CodeBuild subscription:**
    - Go to the AWS Console → CodeBuild and enable/subscribe to CodeBuild for your account.
    - Retry deployment after AWS confirms your subscription.

11. **Push your changes back to the repository:**
    ```bash
    git add .
    git commit -m "Update CDK pipeline and setup instructions"
    git push
    ```

## Note

If your AWS account is not yet linked to CodeBuild, deployment will fail with a subscription error. Wait for AWS to enable CodeBuild on your account, then retry deployment.
## AWS GitHub CI/CD Pipeline

This project provides an AWS CloudFormation template (`pipeline.yaml`) to set up a CI/CD pipeline for GitHub repositories using AWS CodePipeline and CodeBuild. It automates building, testing, and deploying code to dev, qa, and prod environments, and includes a public S3 bucket for testing.

### What the Pipeline Does

- Connects your GitHub repository to AWS using a personal access token stored in AWS Secrets Manager.
- Triggers automatically on pull request events (created, updated, reopened) for the specified branch (default: `main`).
- Uses AWS CodeBuild to build your code (using `buildspec.yaml`).
- Deploys to dev, qa, and prod environments using separate CodeBuild projects and `deployspec.yaml`.
- Stores build artifacts in an S3 bucket.
- Includes a manual approval step before deploying to QA.
- Creates a public S3 bucket for static website hosting as a test resource.

### Prerequisites

1. **AWS Account** with permissions to create IAM roles, CodePipeline, CodeBuild, S3 buckets, and Secrets Manager secrets.
2. **GitHub Personal Access Token** with repo access.
3. **AWS CLI** or access to the AWS Console.

### Setup Steps

1. **Clone this repository** to your local machine.

2. **Create a GitHub Personal Access Token** and store it in AWS Secrets Manager:
   - Secret name: `GITHUB_ACCESS`
   - Key: `GITHUB_ACCESS_TOKEN`
   - Value: your GitHub token

3. **Edit `pipeline.yaml` parameters** if needed:
   - `GitHubOwner`: your GitHub username or org
   - `GitHubRepository`: your repository name
   - `GitHubBranch`: branch to trigger pipeline (default: `main`)

4. **Deploy the CloudFormation stack**:
   - Using AWS Console: Create a new stack and upload `pipeline.yaml`.
   - Using AWS CLI:
     ```bash
     aws cloudformation create-stack --stack-name <your-stack-name> \
       --template-body file://pipeline.yaml \
       --capabilities CAPABILITY_NAMED_IAM
     ```

5. **Verify resources in AWS Console**:
   - Check CodePipeline, CodeBuild, and S3 buckets.
   - Confirm the pipeline is created and the webhook is registered in your GitHub repo.


# AWS GitHub CI/CD Pipeline (AWS CDK v2, TypeScript)

This project sets up a modern CI/CD pipeline for GitHub repositories using AWS CDK v2 (TypeScript), CodePipeline (V2), CodeBuild, Lambda, IAM, and S3. YAML files are no longer used; all infrastructure is defined in TypeScript.

## Features

- Connects your GitHub repository to AWS using a personal access token stored in AWS Secrets Manager.
- Triggers automatically on pull request events for the specified branch (default: `main`).
- Uses AWS CodeBuild to build your code.
- Deploys to dev, qa, and prod environments (customize as needed).
- Stores build artifacts in a versioned S3 bucket.
- Includes a Lambda function for generating pre-signed S3 URLs (24-hour expiry) for secure, time-limited access to a public test bucket.
- Uses CodePipeline V2 for improved performance and features.

## Prerequisites

1. **AWS Account** with permissions to create IAM roles, CodePipeline, CodeBuild, S3 buckets, Lambda, and Secrets Manager secrets.
2. **GitHub Personal Access Token** with repo access.
3. **AWS CLI** and [AWS CDK CLI](https://docs.aws.amazon.com/cdk/latest/guide/cli.html) installed.
4. **Node.js** and **npm** installed.

## Setup Steps

1. **Clone this repository** to your local machine.

2. **Create a GitHub Personal Access Token** and store it in AWS Secrets Manager:
   - Secret name: `GITHUB_ACCESS`
   - Key: `GITHUB_ACCESS_TOKEN`
   - Value: your GitHub token

3. **Install dependencies**:
   ```bash
   npm install --prefix cdk
   ```

4. **Configure CDK app entry** (already set in `cdk.json`):
   - Entry point: `cdk/src/app.ts`

5. **Edit pipeline parameters** in `cdk/src/app.ts` or `cdk/src/pipeline-stack.ts`:
   - `githubOwner`: your GitHub username or org
   - `githubRepo`: your repository name
   - `githubBranch`: branch to trigger pipeline (default: `main`)
   - `codeBuildImage`: e.g. `aws/codebuild/standard:7.0`

6. **Bootstrap your AWS environment (if not done before)**:
   ```bash
   npx cdk bootstrap
   ```

7. **Synthesize the CDK stack**:
   ```bash
   npx cdk synth
   ```

8. **Deploy the stack and save errors to a file**:
   ```bash
   npx cdk deploy > STACK_ERRORS.txt 2>&1
   ```
   - The file `STACK_ERRORS.txt` is ignored by git (see `.gitignore`).

9. **Verify resources in AWS Console**:
   - Check CodePipeline, CodeBuild, Lambda, and S3 buckets.
   - Confirm the pipeline is created and the webhook is registered in your GitHub repo.

10. **Trigger the pipeline**:
    - Push code or create/update/reopen a pull request in your GitHub repo on the specified branch.
    - The pipeline will automatically start and run through build and deploy stages.

## Notes

- All infrastructure is managed via AWS CDK (TypeScript). No YAML files are required or used.
- The public S3 bucket (`PublicTestBucket`) is created for testing and static website hosting. It is private by default; access is managed via Lambda-generated pre-signed URLs.
- Manual approval steps and additional environments (dev, qa, prod) can be added in the pipeline code.
- The pipeline uses CodePipeline V2 for improved reliability and features.

## Troubleshooting

- If you see errors about missing files, ensure your `cdk.json` points to the correct entry file and all dependencies are installed.
- For S3 bucket name errors, ensure bucket names are lowercase and start with a letter or number.
- For IAM or Secrets Manager issues, verify your AWS credentials and permissions.
- For CDK CLI errors, check that your Node.js and AWS CDK versions are up to date.

## Portal Setup (AWS Console)

- Store your GitHub token in AWS Secrets Manager as described above.
- Confirm all resources (CodePipeline, CodeBuild, Lambda, S3) are created after deployment.
- Register the webhook in your GitHub repository if not automatically done.

## CLI Summary

```bash
npm install --prefix cdk
npx cdk bootstrap
npx cdk synth
npx cdk deploy > STACK_ERRORS.txt 2>&1
```

## File Structure

- `cdk/src/app.ts` — CDK app entry point
- `cdk/src/pipeline-stack.ts` — Main pipeline stack definition
- `cdk.json` — CDK configuration
- `package.json`, `tsconfig.json` — Project configuration
- `.gitignore` — Ignores `STACK_ERRORS.txt`

## Unnecessary Files

All legacy YAML files have been removed. Only CDK TypeScript files are required.