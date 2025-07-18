/**
 * Tests for the workflow URL parser utility
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseGitHubWorkflowUrl, createActionFromUrl, fetchWorkflowMetadataFromUrl } from '../../utils/workflowUrlParser';
import { GitHubApiClient } from '../../services/github';
import * as workflowParser from '../../utils/workflowParser';
import { ActionCreatorService } from '../../services/actionCreator';

// Mock the GitHub API client
vi.mock('../../services/github', () => {
  return {
    GitHubApiClient: vi.fn().mockImplementation(() => {
      return {
        getFileContent: vi.fn().mockResolvedValue(`
name: 'Sample Workflow'
on:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch to deploy'
        required: true
        default: 'main'
`),
        // Add missing methods that might be required
        validateToken: vi.fn().mockResolvedValue(true),
        getRepositories: vi.fn().mockResolvedValue([]),
        getWorkflows: vi.fn().mockResolvedValue([]),
        triggerWorkflow: vi.fn().mockResolvedValue({}),
        getWorkflowRuns: vi.fn().mockResolvedValue([]),
        getWorkflowRunDetails: vi.fn().mockResolvedValue({}),
        downloadArtifact: vi.fn().mockResolvedValue({}),
        getBranches: vi.fn().mockResolvedValue([])
      };
    }),
  };
});

// Mock the workflow parser
vi.mock('../../utils/workflowParser', () => {
  return {
    extractWorkflowMetadata: vi.fn().mockReturnValue({
      name: 'Sample Workflow',
      description: 'Sample Workflow',
      hasDispatchTrigger: true,
      inputs: [
        {
          name: 'branch',
          description: 'Branch to deploy',
          required: true,
          default: 'main',
        },
      ],
    }),
  };
});

// Mock the action creator service
vi.mock('../../services/actionCreator', () => {
  return {
    ActionCreatorService: vi.fn().mockImplementation(() => {
      return {
        createActionFromWorkflow: vi.fn().mockResolvedValue({
          id: 'mock-action-id',
          name: 'Sample Workflow',
          description: 'Sample Workflow',
          category: 'uncategorized',
          repository: 'owner/repo',
          workflowPath: '.github/workflows/workflow.yml',
          inputs: [
            {
              name: 'branch',
              description: 'Branch to deploy',
              required: true,
              default: 'main',
            },
          ],
          lastUpdated: '2023-01-01T00:00:00.000Z',
        }),
      };
    }),
  };
});

describe('workflowUrlParser', () => {
  let githubClient: GitHubApiClient;
  
  beforeEach(() => {
    vi.clearAllMocks();
    githubClient = new GitHubApiClient('fake-token');
  });
  
  describe('parseGitHubWorkflowUrl', () => {
    it('should parse a GitHub blob URL correctly', () => {
      const url = 'https://github.com/owner/repo/blob/main/.github/workflows/workflow.yml';
      const result = parseGitHubWorkflowUrl(url);
      
      expect(result).not.toBeNull();
      expect(result?.owner).toBe('owner');
      expect(result?.repo).toBe('repo');
      expect(result?.path).toBe('main/.github/workflows/workflow.yml');
    });
    
    it('should parse a GitHub actions/workflows URL correctly', () => {
      const url = 'https://github.com/owner/repo/actions/workflows/workflow.yml';
      const result = parseGitHubWorkflowUrl(url);
      
      expect(result).not.toBeNull();
      expect(result?.owner).toBe('owner');
      expect(result?.repo).toBe('repo');
      expect(result?.path).toBe('.github/workflows/workflow.yml');
    });
    
    it('should return null for non-GitHub URLs', () => {
      const url = 'https://example.com/owner/repo/actions/workflows/workflow.yml';
      const result = parseGitHubWorkflowUrl(url);
      
      expect(result).toBeNull();
    });
    
    it('should return null for invalid URLs', () => {
      const url = 'not-a-url';
      const result = parseGitHubWorkflowUrl(url);
      
      expect(result).toBeNull();
    });
    
    it('should return null for GitHub URLs with insufficient path parts', () => {
      const url = 'https://github.com/owner';
      const result = parseGitHubWorkflowUrl(url);
      
      expect(result).toBeNull();
    });
    
    it('should return null for unsupported GitHub URL formats', () => {
      const url = 'https://github.com/owner/repo/pulls';
      const result = parseGitHubWorkflowUrl(url);
      
      expect(result).toBeNull();
    });
  });
  
  describe('createActionFromUrl', () => {
    it('should create an action from a valid GitHub workflow URL', async () => {
      const url = 'https://github.com/owner/repo/actions/workflows/workflow.yml';
      const result = await createActionFromUrl(url, githubClient);
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Sample Workflow');
      expect(result?.repository).toBe('owner/repo');
      expect(result?.workflowPath).toBe('.github/workflows/workflow.yml');
      
      // Verify that the ActionCreatorService was called with the correct parameters
      expect(ActionCreatorService).toHaveBeenCalledWith(githubClient);
      expect(vi.mocked(ActionCreatorService).mock.results[0].value.createActionFromWorkflow).toHaveBeenCalledWith(
        'owner',
        'repo',
        '.github/workflows/workflow.yml'
      );
    });
    
    it('should return null for invalid GitHub workflow URLs', async () => {
      const url = 'not-a-url';
      const result = await createActionFromUrl(url, githubClient);
      
      expect(result).toBeNull();
    });
  });
  
  describe('fetchWorkflowMetadataFromUrl', () => {
    it('should fetch workflow metadata from a valid GitHub workflow URL', async () => {
      const url = 'https://github.com/owner/repo/actions/workflows/workflow.yml';
      const result = await fetchWorkflowMetadataFromUrl(url, githubClient);
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Sample Workflow');
      expect(result?.hasDispatchTrigger).toBe(true);
      expect(result?.inputs).toHaveLength(1);
      expect(result?.inputs[0].name).toBe('branch');
      
      // Verify that the GitHub API client was called with the correct parameters
      expect(githubClient.getFileContent).toHaveBeenCalledWith(
        'owner',
        'repo',
        '.github/workflows/workflow.yml'
      );
      
      // Verify that the workflow parser was called with the correct parameters
      expect(workflowParser.extractWorkflowMetadata).toHaveBeenCalled();
    });
    
    it('should return null for invalid GitHub workflow URLs', async () => {
      const url = 'not-a-url';
      const result = await fetchWorkflowMetadataFromUrl(url, githubClient);
      
      expect(result).toBeNull();
    });
  });
});