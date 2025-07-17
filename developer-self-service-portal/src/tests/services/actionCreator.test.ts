/**
 * Tests for the ActionCreatorService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionCreatorService, EnhancedInputType, InputDataSource } from '../../services/actionCreator';
import { GitHubApiClient } from '../../services/github';
import * as workflowParser from '../../utils/workflowParser';

// Mock the uuid module
vi.mock('uuid', () => {
  return {
    v4: () => 'mock-uuid'
  };
});

// Mock the workflow parser
vi.mock('../../utils/workflowParser', () => {
  return {
    extractWorkflowMetadata: vi.fn(),
  };
});

// Mock GitHub API client
vi.mock('../../services/github', () => {
  return {
    GitHubApiClient: vi.fn().mockImplementation(() => {
      return {
        getFileContent: vi.fn(),
      };
    }),
  };
});

describe('ActionCreatorService', () => {
  let actionCreatorService: ActionCreatorService;
  let githubClient: GitHubApiClient;
  
  const sampleWorkflowYaml = `
name: 'Sample Workflow'

on:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch to deploy'
        required: true
        default: 'main'
      environment:
        description: 'Environment to deploy to'
        required: true
        type: choice
        options:
        - 'dev'
        - 'staging'
        - 'prod'
        default: 'dev'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
`;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a new instance for each test
    githubClient = new GitHubApiClient('fake-token');
    actionCreatorService = new ActionCreatorService(githubClient);
    
    // Setup mock for getFileContent
    (githubClient.getFileContent as any).mockResolvedValue(sampleWorkflowYaml);
    
    // Setup mock for extractWorkflowMetadata
    (workflowParser.extractWorkflowMetadata as any).mockReturnValue({
      name: 'Sample Workflow',
      description: 'Sample Workflow Description',
      hasDispatchTrigger: true,
      inputs: [
        {
          name: 'branch',
          description: 'Branch to deploy',
          required: true,
          default: 'main',
        },
        {
          name: 'environment',
          description: 'Environment to deploy to',
          required: true,
          type: 'choice',
          options: ['dev', 'staging', 'prod'],
          default: 'dev',
        },
      ],
    });
  });
  
  describe('createActionFromWorkflow', () => {
    it('should create an action from a workflow file', async () => {
      const action = await actionCreatorService.createActionFromWorkflow(
        'owner',
        'repo',
        '.github/workflows/sample.yml'
      );
      
      expect(action).not.toBeNull();
      
      if (action) {
        expect(action.id).toBe('mock-uuid');
        expect(action.name).toBe('Sample Workflow');
        expect(action.description).toBe('Sample Workflow Description');
        expect(action.category).toBe('uncategorized');
        expect(action.repository).toBe('owner/repo');
        expect(action.workflowPath).toBe('.github/workflows/sample.yml');
        expect(action.inputs).toHaveLength(2);
        expect(action.inputs[0].name).toBe('branch');
        expect(action.inputs[1].name).toBe('environment');
      }
      
      // Verify GitHub API client was called
      expect(githubClient.getFileContent).toHaveBeenCalledWith(
        'owner',
        'repo',
        '.github/workflows/sample.yml'
      );
      
      // Verify workflow parser was called
      expect(workflowParser.extractWorkflowMetadata).toHaveBeenCalledWith(sampleWorkflowYaml);
    });
    
    it('should apply enhancement options', async () => {
      const action = await actionCreatorService.createActionFromWorkflow(
        'owner',
        'repo',
        '.github/workflows/sample.yml',
        {
          id: 'custom-id',
          name: 'Custom Name',
          description: 'Custom Description',
          category: 'custom-category',
          documentation: 'Custom Documentation',
          documentationUrl: 'https://example.com/docs',
          tags: ['tag1', 'tag2'],
          featured: true,
          enhancedInputs: {
            branch: {
              type: EnhancedInputType.BRANCH_SELECTOR,
              dataSource: InputDataSource.GITHUB_API,
              apiMethod: 'getBranches',
            },
          },
        }
      );
      
      expect(action).not.toBeNull();
      
      if (action) {
        expect(action.id).toBe('custom-id');
        expect(action.name).toBe('Custom Name');
        expect(action.description).toBe('Custom Description');
        expect(action.category).toBe('custom-category');
        expect(action.documentation).toBe('Custom Documentation');
        expect(action.documentationUrl).toBe('https://example.com/docs');
        expect(action.tags).toEqual(['tag1', 'tag2']);
        expect(action.featured).toBe(true);
        
        // Check enhanced inputs
        expect(action.inputs[0].name).toBe('branch');
        expect((action.inputs[0] as any).enhanced).toBeDefined();
        expect((action.inputs[0] as any).enhanced.type).toBe(EnhancedInputType.BRANCH_SELECTOR);
        expect((action.inputs[0] as any).enhanced.dataSource).toBe(InputDataSource.GITHUB_API);
        expect((action.inputs[0] as any).enhanced.apiMethod).toBe('getBranches');
      }
    });
    
    it('should return null if workflow does not have dispatch trigger', async () => {
      // Mock workflow without dispatch trigger
      (workflowParser.extractWorkflowMetadata as any).mockReturnValueOnce({
        name: 'Sample Workflow',
        description: 'Sample Workflow Description',
        hasDispatchTrigger: false,
        inputs: [],
      });
      
      const action = await actionCreatorService.createActionFromWorkflow(
        'owner',
        'repo',
        '.github/workflows/sample.yml'
      );
      
      expect(action).toBeNull();
    });
    
    it('should return null if workflow metadata extraction fails', async () => {
      // Mock metadata extraction failure
      (workflowParser.extractWorkflowMetadata as any).mockReturnValueOnce(null);
      
      const action = await actionCreatorService.createActionFromWorkflow(
        'owner',
        'repo',
        '.github/workflows/sample.yml'
      );
      
      expect(action).toBeNull();
    });
    
    it('should return null if GitHub API call fails', async () => {
      // Mock GitHub API failure
      (githubClient.getFileContent as any).mockRejectedValueOnce(new Error('API error'));
      
      const action = await actionCreatorService.createActionFromWorkflow(
        'owner',
        'repo',
        '.github/workflows/sample.yml'
      );
      
      expect(action).toBeNull();
    });
  });
  
  describe('createSampleQABuildAction', () => {
    it('should create a sample QA Build action', () => {
      const action = actionCreatorService.createSampleQABuildAction();
      
      expect(action).not.toBeNull();
      expect(action.id).toBe('qa-build');
      expect(action.name).toBe('QA: Build Environment');
      expect(action.category).toBe('deployment');
      expect(action.inputs).toHaveLength(7);
      
      // Check specific inputs
      const baseBranchInput = action.inputs.find(input => input.name === 'base_branch');
      expect(baseBranchInput).toBeDefined();
      expect((baseBranchInput as any).enhanced).toBeDefined();
      expect((baseBranchInput as any).enhanced.type).toBe(EnhancedInputType.BRANCH_SELECTOR);
      
      const durationInput = action.inputs.find(input => input.name === 'environment_duration');
      expect(durationInput).toBeDefined();
      expect((durationInput as any).enhanced).toBeDefined();
      expect((durationInput as any).enhanced.type).toBe(EnhancedInputType.DURATION_SELECTOR);
      
      // Check documentation
      expect(action.documentation).toBeDefined();
      expect(action.documentation?.length).toBeGreaterThan(0);
      
      // Check tags and featured status
      expect(action.tags).toContain('qa');
      expect(action.tags).toContain('deployment');
      expect(action.featured).toBe(true);
    });
  });
});