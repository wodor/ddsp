/**
 * Service for creating and enhancing actions in the catalog
 */
import type { CatalogAction, ActionInput } from '../types/catalog';
import { GitHubApiClient } from './github';
import { extractWorkflowMetadata } from '../utils/workflowParser';
import { v4 as uuidv4 } from 'uuid';

/**
 * Enhanced input type definitions
 */
export enum EnhancedInputType {
  BRANCH_SELECTOR = 'branch-selector',
  REPOSITORY_SELECTOR = 'repository-selector',
  USER_SELECTOR = 'user-selector',
  DATE_PICKER = 'date-picker',
  DURATION_SELECTOR = 'duration-selector',
  MULTI_SELECT = 'multi-select',
  CONDITIONAL = 'conditional',
}

/**
 * Enhanced input data source
 */
export enum InputDataSource {
  GITHUB_API = 'github-api',
  MANUAL = 'manual',
}

/**
 * Enhanced input configuration
 */
export interface EnhancedInputConfig {
  type: EnhancedInputType;
  dataSource: InputDataSource;
  apiMethod?: string;
  apiParams?: Record<string, any>;
  dependsOn?: string;
  condition?: string;
}

/**
 * Action enhancement options
 */
export interface ActionEnhancementOptions {
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  documentation?: string;
  documentationUrl?: string;
  tags?: string[];
  featured?: boolean;
  enhancedInputs?: Record<string, EnhancedInputConfig>;
}

/**
 * Service for creating and enhancing actions in the catalog
 */
export class ActionCreatorService {
  private githubClient: GitHubApiClient;
  
  /**
   * Creates a new instance of the ActionCreatorService
   * @param githubClient - The GitHub API client to use
   */
  constructor(githubClient: GitHubApiClient) {
    this.githubClient = githubClient;
  }
  
  /**
   * Create a new action from a GitHub workflow file
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param workflowPath - Path to the workflow file
   * @param options - Enhancement options
   * @returns The created action
   */
  public async createActionFromWorkflow(
    owner: string,
    repo: string,
    workflowPath: string,
    options: ActionEnhancementOptions = {}
  ): Promise<CatalogAction | null> {
    try {
      // Get the workflow file content
      const workflowContent = await this.githubClient.getFileContent(
        owner,
        repo,
        workflowPath
      );
      
      // Extract metadata from the workflow file
      const metadata = extractWorkflowMetadata(workflowContent);
      if (!metadata) {
        throw new Error('Failed to extract metadata from workflow file');
      }
      
      // Check if the workflow has a workflow_dispatch trigger
      if (!metadata.hasDispatchTrigger) {
        throw new Error('Workflow does not have a workflow_dispatch trigger');
      }
      
      // Create the action
      const action: CatalogAction = {
        id: options.id || uuidv4(),
        name: options.name || metadata.name,
        description: options.description || metadata.description,
        category: options.category || 'uncategorized',
        repository: `${owner}/${repo}`,
        workflowPath,
        inputs: this.enhanceInputs(metadata.inputs, options.enhancedInputs || {}),
        lastUpdated: new Date().toISOString(),
      };
      
      // Add optional fields if provided
      if (options.documentation) {
        action.documentation = options.documentation;
      }
      
      if (options.documentationUrl) {
        action.documentationUrl = options.documentationUrl;
      }
      
      if (options.tags) {
        action.tags = options.tags;
      }
      
      if (options.featured !== undefined) {
        action.featured = options.featured;
      }
      
      return action;
    } catch (error) {
      console.error('Failed to create action from workflow:', error);
      return null;
    }
  }
  
  /**
   * Enhance inputs with additional configuration
   * @param inputs - The original inputs
   * @param enhancedInputs - Enhanced input configurations
   * @returns Enhanced inputs
   */
  private enhanceInputs(
    inputs: ActionInput[],
    enhancedInputs: Record<string, EnhancedInputConfig>
  ): ActionInput[] {
    return inputs.map(input => {
      const enhancedConfig = enhancedInputs[input.name];
      if (!enhancedConfig) {
        return input;
      }
      
      // Create a copy of the input to avoid modifying the original
      const enhancedInput = { ...input };
      
      // Add enhanced properties
      (enhancedInput as any).enhanced = {
        type: enhancedConfig.type,
        dataSource: enhancedConfig.dataSource,
      };
      
      // Add optional enhanced properties if provided
      if (enhancedConfig.apiMethod) {
        (enhancedInput as any).enhanced.apiMethod = enhancedConfig.apiMethod;
      }
      
      if (enhancedConfig.apiParams) {
        (enhancedInput as any).enhanced.apiParams = enhancedConfig.apiParams;
      }
      
      if (enhancedConfig.dependsOn) {
        (enhancedInput as any).enhanced.dependsOn = enhancedConfig.dependsOn;
      }
      
      if (enhancedConfig.condition) {
        (enhancedInput as any).enhanced.condition = enhancedConfig.condition;
      }
      
      return enhancedInput;
    });
  }
  
  /**
   * Create a sample QA Build action definition
   * @returns The sample action
   */
  public createSampleQABuildAction(): CatalogAction {
    return {
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
  }
}