/**
 * Sample QA Build action definition
 */
import { CatalogAction } from '../types/catalog';
import { EnhancedInputType, InputDataSource } from '../services/actionCreator';

/**
 * Sample QA Build action definition
 */
export const sampleQABuildAction: CatalogAction = {
  id: 'qa-build',
  name: 'QA: Build Environment',
  description: 'Creates a QA environment from a selected branch',
  category: 'deployment',
  repository: 'organization/repo',
  workflowPath: '.github/workflows/qa-build.yaml',
  inputs: [
    {
      name: 'auto_branch_update',
      description: 'Auto Branch Update (your chosen base branch will be merged into your branch)',
      required: false,
      type: 'boolean',
      default: 'true',
      enhanced: {
        type: EnhancedInputType.CONDITIONAL,
        dataSource: InputDataSource.MANUAL
      }
    },
    {
      name: 'base_branch',
      description: 'Base Branch',
      required: false,
      type: 'choice',
      options: ['develop', 'master', 'canary'],
      default: 'develop',
      enhanced: {
        type: EnhancedInputType.BRANCH_SELECTOR,
        dataSource: InputDataSource.GITHUB_API,
        apiMethod: 'getBranches'
      }
    },
    {
      name: 'enable_cloudfront',
      description: 'Enable Cloudfront',
      required: false,
      type: 'boolean',
      default: 'false'
    },
    {
      name: 'enable_cdc',
      description: 'Enable CDC + Audit Service',
      required: false,
      type: 'boolean',
      default: 'false'
    },
    {
      name: 'config_generator_version',
      description: 'Override Config Generator Version',
      required: false,
      type: 'string'
    },
    {
      name: 'proxysql_version',
      description: 'Override ProxySQL Version',
      required: false,
      type: 'string'
    },
    {
      name: 'environment_duration',
      description: 'How long do you need the environment?',
      required: true,
      type: 'choice',
      options: ['', '1 hour', '1 day', '1 week', '1 month', '3 months'],
      enhanced: {
        type: EnhancedInputType.DURATION_SELECTOR,
        dataSource: InputDataSource.MANUAL
      }
    }
  ],
  documentation: `# QA Build Environment

This action creates a QA environment from a selected branch. It sets up the necessary infrastructure and deploys your application to a testing environment.

## Features

- Automatic branch updates from base branch
- CloudFront support for CDN
- CDC and Audit Service support
- Configurable environment duration

## Usage

1. Select the branch you want to deploy
2. Choose whether to enable CloudFront and CDC services
3. Set how long you need the environment
4. Submit the form to start the build process

## Environment Details

Once the build is complete, you'll receive a URL to access your QA environment. The environment will be automatically destroyed after the specified duration.`,
  tags: ['qa', 'deployment', 'testing', 'environment'],
  featured: true,
  lastUpdated: new Date().toISOString()
};