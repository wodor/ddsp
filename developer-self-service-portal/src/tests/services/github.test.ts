import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { GitHubApiClient, GitHubErrorType } from '../../services/github';

// Mock global objects that are used in the GitHub API client
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL });
vi.stubGlobal('Blob', class MockBlob {
  constructor(public parts: any[], public options?: any) {}
});

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        request: vi.fn(),
        interceptors: {
          response: {
            use: vi.fn((_successFn, errorFn) => {
              // Store the error handler for testing
              // Using underscore prefix to indicate intentionally unused parameter
              (axios as any).errorHandler = errorFn;
              return () => {};
            })
          }
        }
      }))
    },
    isAxiosError: vi.fn((error) => error.isAxiosError === true)
  };
});

describe('GitHubApiClient', () => {
  let client: GitHubApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GitHubApiClient('test-token');
    mockAxiosInstance = (axios.create as any).mock.results[0].value;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create an axios instance with correct configuration', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.github.com',
        headers: {
          Authorization: 'token test-token',
          Accept: 'application/vnd.github.v3+json',
        },
      });
    });

    it('should set up response interceptor', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ status: 200, data: { login: 'testuser' } });
      
      const result = await client.validateToken();
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user');
    });

    it('should return false for invalid token', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Invalid token'));
      
      const result = await client.validateToken();
      
      expect(result).toBe(false);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user');
    });
  });

  describe('error handling', () => {
    it('should parse authentication errors correctly', async () => {
      // Create a client instance to test directly
      const client = new GitHubApiClient('test-token');
      
      // Access the private parseError method using type assertion
      const parseError = (client as any).parseError.bind(client);
      
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Bad credentials' }
        },
        config: {},
        isAxiosError: true
      };

      const error = parseError(mockError);
      expect(error.type).toBe(GitHubErrorType.AUTHENTICATION);
      expect(error.isRetryable).toBe(false);
      expect(error.status).toBe(401);
    });

    it('should parse rate limit errors correctly', async () => {
      // Create a client instance to test directly
      const client = new GitHubApiClient('test-token');
      
      // Access the private parseError method using type assertion
      const parseError = (client as any).parseError.bind(client);
      
      const mockError = {
        response: {
          status: 403,
          data: { message: 'API rate limit exceeded' },
          headers: {
            'x-ratelimit-remaining': '0'
          }
        },
        config: {},
        isAxiosError: true
      };

      const error = parseError(mockError);
      expect(error.type).toBe(GitHubErrorType.RATE_LIMIT);
      expect(error.isRetryable).toBe(true);
      expect(error.status).toBe(403);
    });

    it('should parse permission errors correctly', async () => {
      // Create a client instance to test directly
      const client = new GitHubApiClient('test-token');
      
      // Access the private parseError method using type assertion
      const parseError = (client as any).parseError.bind(client);
      
      const mockError = {
        response: {
          status: 403,
          data: { message: 'Resource not accessible by integration' },
          headers: {
            'x-ratelimit-remaining': '5000'
          }
        },
        config: {},
        isAxiosError: true
      };

      const error = parseError(mockError);
      expect(error.type).toBe(GitHubErrorType.PERMISSION);
      expect(error.isRetryable).toBe(false);
      expect(error.status).toBe(403);
    });

    it('should parse network errors correctly', async () => {
      // Create a client instance to test directly
      const client = new GitHubApiClient('test-token');
      
      // Access the private parseError method using type assertion
      const parseError = (client as any).parseError.bind(client);
      
      const mockError = {
        request: {},
        message: 'Network Error',
        isAxiosError: true
      };

      const error = parseError(mockError);
      expect(error.type).toBe(GitHubErrorType.NETWORK);
      expect(error.isRetryable).toBe(true);
    });

    it('should parse server errors correctly', async () => {
      // Create a client instance to test directly
      const client = new GitHubApiClient('test-token');
      
      // Access the private parseError method using type assertion
      const parseError = (client as any).parseError.bind(client);
      
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        },
        config: {},
        isAxiosError: true
      };

      const error = parseError(mockError);
      expect(error.type).toBe(GitHubErrorType.SERVER_ERROR);
      expect(error.isRetryable).toBe(true);
      expect(error.status).toBe(500);
    });
  });

  describe('checkPermission', () => {
    it('should return true when user has admin permission', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: { permission: 'admin' }
      });
      
      const result = await client.checkPermission('owner', 'repo', 'admin');
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/repos/owner/repo/collaborators/permission',
        { validateStatus: expect.any(Function) }
      );
    });

    it('should return true when user has write permission and checking for write', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: { permission: 'write' }
      });
      
      const result = await client.checkPermission('owner', 'repo', 'write');
      
      expect(result).toBe(true);
    });

    it('should return false when user has read permission and checking for write', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: { permission: 'read' }
      });
      
      const result = await client.checkPermission('owner', 'repo', 'write');
      
      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));
      
      const result = await client.checkPermission('owner', 'repo');
      
      expect(result).toBe(false);
    });
  });

  describe('getRepositories', () => {
    it('should return repositories list', async () => {
      const mockRepos = [{ name: 'repo1' }, { name: 'repo2' }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockRepos
      });
      
      const result = await client.getRepositories();
      
      expect(result).toEqual(mockRepos);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/repos', {
        params: {
          sort: 'updated',
          per_page: 100,
        },
      });
    });
  });

  describe('getWorkflows', () => {
    it('should return workflows list', async () => {
      const mockWorkflows = [{ id: 1, name: 'workflow1' }, { id: 2, name: 'workflow2' }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { workflows: mockWorkflows }
      });
      
      const result = await client.getWorkflows('owner', 'repo');
      
      expect(result).toEqual(mockWorkflows);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/owner/repo/actions/workflows');
    });
  });

  describe('triggerWorkflow', () => {
    it('should trigger workflow with correct parameters', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { id: 123 }
      });
      
      const inputs = { param1: 'value1', param2: 'value2' };
      const result = await client.triggerWorkflow('owner', 'repo', 'workflow123', 'main', inputs);
      
      expect(result).toEqual({ id: 123 });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/repos/owner/repo/actions/workflows/workflow123/dispatches',
        {
          ref: 'main',
          inputs,
        }
      );
    });
  });

  describe('getWorkflowRuns', () => {
    it('should return workflow runs with workflow ID', async () => {
      const mockRuns = [{ id: 1 }, { id: 2 }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { workflow_runs: mockRuns }
      });
      
      const result = await client.getWorkflowRuns('owner', 'repo', 'workflow123');
      
      expect(result).toEqual(mockRuns);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/repos/owner/repo/actions/workflows/workflow123/runs',
        { params: { per_page: 30 } }
      );
    });

    it('should return all workflow runs without workflow ID', async () => {
      const mockRuns = [{ id: 1 }, { id: 2 }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { workflow_runs: mockRuns }
      });
      
      const result = await client.getWorkflowRuns('owner', 'repo');
      
      expect(result).toEqual(mockRuns);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/repos/owner/repo/actions/runs',
        { params: { per_page: 30 } }
      );
    });
  });

  describe('getWorkflowRunArtifacts', () => {
    it('should return workflow run artifacts', async () => {
      const mockArtifacts = [{ id: 1, name: 'artifact1' }, { id: 2, name: 'artifact2' }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { artifacts: mockArtifacts }
      });
      
      const result = await client.getWorkflowRunArtifacts('owner', 'repo', 123);
      
      expect(result).toEqual(mockArtifacts);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/owner/repo/actions/runs/123/artifacts');
    });
  });
  
  describe('getArtifactDownloadUrl', () => {
    it('should return artifact download URL', async () => {
      // We're already mocking Blob and URL.createObjectURL at the top of the file
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: new Uint8Array([1, 2, 3])
      });
      
      const result = await client.getArtifactDownloadUrl('owner', 'repo', 123);
      
      expect(result).toBe('blob:mock-url');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/repos/owner/repo/actions/artifacts/123/zip',
        { responseType: 'blob' }
      );
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });
  
  describe('getWorkflowRunLogs', () => {
    it('should return workflow run logs URL', async () => {
      // We're already mocking Blob and URL.createObjectURL at the top of the file
      // Reset the mock to return a different URL for this specific test
      mockCreateObjectURL.mockReturnValueOnce('blob:mock-logs-url');
      
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: new Uint8Array([1, 2, 3])
      });
      
      const result = await client.getWorkflowRunLogs('owner', 'repo', 123);
      
      expect(result).toBe('blob:mock-logs-url');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/repos/owner/repo/actions/runs/123/logs',
        { responseType: 'blob' }
      );
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });
  
  describe('cancelWorkflowRun', () => {
    it('should cancel a workflow run', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { status: 'cancelled' }
      });
      
      const result = await client.cancelWorkflowRun('owner', 'repo', 123);
      
      expect(result).toEqual({ status: 'cancelled' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/repos/owner/repo/actions/runs/123/cancel');
    });
  });
  
  describe('rerunWorkflow', () => {
    it('should rerun a workflow', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { status: 'queued' }
      });
      
      const result = await client.rerunWorkflow('owner', 'repo', 123);
      
      expect(result).toEqual({ status: 'queued' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/repos/owner/repo/actions/runs/123/rerun');
    });
  });
  
  describe('getBranches', () => {
    it('should return repository branches', async () => {
      const mockBranches = [{ name: 'main' }, { name: 'develop' }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockBranches
      });
      
      const result = await client.getBranches('owner', 'repo');
      
      expect(result).toEqual(mockBranches);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/owner/repo/branches');
    });
  });
  
  describe('getWorkflowUsage', () => {
    it('should return workflow usage statistics', async () => {
      const mockUsage = { billable: { UBUNTU: { total_ms: 1000 } } };
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockUsage
      });
      
      const result = await client.getWorkflowUsage('owner', 'repo', 'workflow123');
      
      expect(result).toEqual(mockUsage);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/owner/repo/actions/workflows/workflow123/timing');
    });
  });
  
  describe('getWorkflowRunJobs', () => {
    it('should return workflow run jobs', async () => {
      const mockJobs = [{ id: 1, name: 'build' }, { id: 2, name: 'test' }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { jobs: mockJobs }
      });
      
      const result = await client.getWorkflowRunJobs('owner', 'repo', 123);
      
      expect(result).toEqual(mockJobs);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/owner/repo/actions/runs/123/jobs');
    });
  });
  
  describe('searchRepositories', () => {
    it('should search repositories with the given query', async () => {
      const mockRepos = [{ name: 'repo1' }, { name: 'repo2' }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { items: mockRepos }
      });
      
      const result = await client.searchRepositories('test-query', 'stars', 'desc');
      
      expect(result).toEqual(mockRepos);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/search/repositories', {
        params: {
          q: 'test-query',
          sort: 'stars',
          order: 'desc',
          per_page: 100
        }
      });
    });
  });
  
  describe('getWorkflowDispatchInputs', () => {
    it('should return workflow dispatch inputs schema', async () => {
      const mockContent = `
name: Test Workflow
on:
  workflow_dispatch:
    inputs:
      name:
        description: 'Name parameter'
        required: true
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
`;
      
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          content: btoa(mockContent)
        }
      });
      
      const result = await client.getWorkflowDispatchInputs('owner', 'repo', 'workflow.yml');
      
      expect(result).not.toBeNull();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/owner/repo/contents/.github/workflows/workflow.yml');
    });
    
    it('should return null when no workflow_dispatch inputs are found', async () => {
      const mockContent = `
name: Test Workflow
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
`;
      
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          content: btoa(mockContent)
        }
      });
      
      const result = await client.getWorkflowDispatchInputs('owner', 'repo', 'workflow.yml');
      
      expect(result).toBeNull();
    });
    
    it('should handle errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not found'));
      
      const result = await client.getWorkflowDispatchInputs('owner', 'repo', 'workflow.yml');
      
      expect(result).toBeNull();
    });
  });
});