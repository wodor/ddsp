/**
 * GitHub API client service
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Re-export axios for testing
export { axios };

/**
 * GitHub API error types
 */
export enum GitHubErrorType {
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  RATE_LIMIT = 'rate_limit',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation',
  SERVER_ERROR = 'server_error',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

/**
 * GitHub API error
 */
export interface GitHubError extends Error {
  type: GitHubErrorType;
  status?: number;
  response?: any;
  isRetryable: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  baseDelayMs: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number;
  /** Status codes that should trigger a retry */
  retryableStatusCodes: number[];
}

/**
 * GitHub API client class
 */
export class GitHubApiClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;
  private token: string;
  
  /**
   * Create a new GitHub API client
   * @param token GitHub personal access token
   * @param retryConfig Optional retry configuration
   */
  constructor(
    token: string, 
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.token = token;
    // Default retry configuration
    this.retryConfig = {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      ...retryConfig
    };
    
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const githubError = this.parseError(error);
        
        // Check if we should retry the request
        if (githubError.isRetryable && error.config) {
          return this.retryRequest(error.config, 0);
        }
        
        return Promise.reject(githubError);
      }
    );
  }
  
  /**
   * Parse an Axios error into a GitHubError
   * @param error The Axios error
   * @returns A GitHubError object
   */
  private parseError(error: AxiosError): GitHubError {
    // Create a GitHubError object
    const githubError = new Error(error.message || 'Unknown GitHub API error') as GitHubError;
    githubError.name = 'GitHubError';
    
    // Default values
    githubError.type = GitHubErrorType.UNKNOWN;
    githubError.isRetryable = false;
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      githubError.status = status;
      githubError.response = error.response.data;
      
      // Determine error type based on status code
      switch (status) {
        case 401:
          githubError.type = GitHubErrorType.AUTHENTICATION;
          githubError.message = 'GitHub API authentication failed. Please check your token.';
          break;
        case 403:
          // Check if it's a rate limit error
          if (error.response.headers['x-ratelimit-remaining'] === '0') {
            githubError.type = GitHubErrorType.RATE_LIMIT;
            githubError.message = 'GitHub API rate limit exceeded. Please try again later.';
            githubError.isRetryable = true;
          } else {
            githubError.type = GitHubErrorType.PERMISSION;
            githubError.message = 'You do not have permission to perform this action.';
          }
          break;
        case 404:
          githubError.type = GitHubErrorType.NOT_FOUND;
          githubError.message = 'The requested resource was not found.';
          break;
        case 422:
          githubError.type = GitHubErrorType.VALIDATION;
          githubError.message = 'The request was invalid. Please check your inputs.';
          break;
        case 429:
          githubError.type = GitHubErrorType.RATE_LIMIT;
          githubError.message = 'GitHub API secondary rate limit exceeded. Please try again later.';
          githubError.isRetryable = true;
          break;
        default:
          if (status >= 500) {
            githubError.type = GitHubErrorType.SERVER_ERROR;
            githubError.message = 'GitHub API server error. Please try again later.';
            githubError.isRetryable = true;
          }
      }
      
      // Check if status code is in retryable list
      if (this.retryConfig.retryableStatusCodes.includes(status)) {
        githubError.isRetryable = true;
      }
      
    } else if (error.request) {
      // The request was made but no response was received
      githubError.type = GitHubErrorType.NETWORK;
      githubError.message = 'Network error. Please check your connection and try again.';
      githubError.isRetryable = true;
    }
    
    return githubError;
  }
  
  /**
   * Retry a failed request with exponential backoff
   * @param config The original request config
   * @param retryCount Current retry attempt
   * @returns Promise that resolves with the response or rejects with an error
   */
  private async retryRequest(
    config: AxiosRequestConfig, 
    retryCount: number
  ): Promise<AxiosResponse> {
    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(
      this.retryConfig.baseDelayMs * Math.pow(2, retryCount) * (0.8 + Math.random() * 0.4),
      this.retryConfig.maxDelayMs
    );
    
    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Check if we've reached the maximum number of retries
    if (retryCount >= this.retryConfig.maxRetries) {
      // Create a custom error for max retries
      const error = new Error(
        `Maximum retry attempts (${this.retryConfig.maxRetries}) exceeded`
      ) as GitHubError;
      error.type = GitHubErrorType.UNKNOWN;
      error.isRetryable = false;
      error.name = 'GitHubError';
      return Promise.reject(error);
    }
    
    try {
      // Attempt the request again
      return await this.client.request(config);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const githubError = this.parseError(error);
        
        // If the error is retryable, try again
        if (githubError.isRetryable && config) {
          return this.retryRequest(config, retryCount + 1);
        }
        
        return Promise.reject(githubError);
      }
      
      // For non-Axios errors, just reject
      return Promise.reject(error);
    }
  }
  
  /**
   * Check if the user has the required permissions
   * @param owner Repository owner
   * @param repo Repository name
   * @param permission Permission to check ('admin', 'write', 'read')
   * @returns Whether the user has the required permission
   */
  async checkPermission(
    owner: string, 
    repo: string, 
    permission: 'admin' | 'write' | 'read' = 'write'
  ): Promise<boolean> {
    try {
      const response = await this.client.get(
        `/repos/${owner}/${repo}/collaborators/permission`,
        { validateStatus: status => status === 200 }
      );
      
      const userPermission = response.data?.permission;
      
      // Map GitHub's permission levels to our simplified model
      switch (permission) {
        case 'admin':
          return userPermission === 'admin';
        case 'write':
          return ['admin', 'write', 'maintain'].includes(userPermission);
        case 'read':
          return ['admin', 'write', 'maintain', 'triage', 'read'].includes(userPermission);
        default:
          return false;
      }
    } catch (error) {
      // If we can't check permissions, assume the user doesn't have them
      return false;
    }
  }
  
  /**
   * Validate the GitHub token
   * @returns Promise that resolves if the token is valid
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await this.client.get('/user');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get the authenticated user
   * @returns User information
   */
  async getUser() {
    const response = await this.client.get('/user');
    return response.data;
  }
  
  /**
   * Get repositories for the authenticated user
   * @returns List of repositories
   */
  async getRepositories() {
    const response = await this.client.get('/user/repos', {
      params: {
        sort: 'updated',
        per_page: 100,
      },
    });
    return response.data;
  }
  
  /**
   * Get workflows for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns List of workflows
   */
  async getWorkflows(owner: string, repo: string) {
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/workflows`);
    return response.data.workflows;
  }
  
  /**
   * Trigger a workflow
   * @param owner Repository owner
   * @param repo Repository name
   * @param workflowId Workflow ID
   * @param ref Git reference (branch, tag, or SHA)
   * @param inputs Workflow inputs
   * @returns Workflow run information
   */
  async triggerWorkflow(owner: string, repo: string, workflowId: string, ref: string, inputs: Record<string, string>) {
    const response = await this.client.post(
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      {
        ref,
        inputs,
      }
    );
    return response.data;
  }
  
  /**
   * Get workflow runs for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param workflowId Optional workflow ID to filter by
   * @returns List of workflow runs
   */
  async getWorkflowRuns(owner: string, repo: string, workflowId?: string) {
    const url = workflowId
      ? `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`
      : `/repos/${owner}/${repo}/actions/runs`;
      
    const response = await this.client.get(url, {
      params: {
        per_page: 30,
      },
    });
    return response.data.workflow_runs;
  }
  
  /**
   * Get details for a workflow run
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Workflow run ID
   * @returns Workflow run details
   */
  async getWorkflowRunDetails(owner: string, repo: string, runId: number) {
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}`);
    return response.data;
  }
  
  /**
   * Get artifacts for a workflow run
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Workflow run ID
   * @returns List of artifacts
   */
  async getWorkflowRunArtifacts(owner: string, repo: string, runId: number) {
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`);
    return response.data.artifacts;
  }
  
  /**
   * Download an artifact
   * @param owner Repository owner
   * @param repo Repository name
   * @param artifactId Artifact ID
   * @returns Artifact download URL
   */
  async getArtifactDownloadUrl(owner: string, repo: string, artifactId: number): Promise<string> {
    const response = await this.client.get(
      `/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`,
      { responseType: 'blob' }
    );
    
    // Create a blob URL for the artifact
    const blob = new Blob([response.data]);
    return URL.createObjectURL(blob);
  }
  
  /**
   * Get workflow logs
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Workflow run ID
   * @returns Logs download URL
   */
  async getWorkflowRunLogs(owner: string, repo: string, runId: number): Promise<string> {
    const response = await this.client.get(
      `/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
      { responseType: 'blob' }
    );
    
    // Create a blob URL for the logs
    const blob = new Blob([response.data]);
    return URL.createObjectURL(blob);
  }
  
  /**
   * Cancel a workflow run
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Workflow run ID
   * @returns Response data
   */
  async cancelWorkflowRun(owner: string, repo: string, runId: number) {
    const response = await this.client.post(`/repos/${owner}/${repo}/actions/runs/${runId}/cancel`);
    return response.data;
  }
  
  /**
   * Rerun a workflow
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Workflow run ID
   * @returns Response data
   */
  async rerunWorkflow(owner: string, repo: string, runId: number) {
    const response = await this.client.post(`/repos/${owner}/${repo}/actions/runs/${runId}/rerun`);
    return response.data;
  }
  
  /**
   * Get repository branches
   * @param owner Repository owner
   * @param repo Repository name
   * @returns List of branches
   */
  async getBranches(owner: string, repo: string) {
    const response = await this.client.get(`/repos/${owner}/${repo}/branches`);
    return response.data;
  }
  
  /**
   * Get workflow usage
   * @param owner Repository owner
   * @param repo Repository name
   * @param workflowId Workflow ID
   * @returns Workflow usage statistics
   */
  async getWorkflowUsage(owner: string, repo: string, workflowId: string) {
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/timing`);
    return response.data;
  }
  
  /**
   * Get workflow run usage
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Workflow run ID
   * @returns Workflow run usage statistics
   */
  async getWorkflowRunUsage(owner: string, repo: string, runId: number) {
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}/timing`);
    return response.data;
  }
  
  /**
   * Get workflow run jobs
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Workflow run ID
   * @returns List of jobs for a workflow run
   */
  async getWorkflowRunJobs(owner: string, repo: string, runId: number) {
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs`);
    return response.data.jobs;
  }
  
  /**
   * Get job logs
   * @param owner Repository owner
   * @param repo Repository name
   * @param jobId Job ID
   * @returns Job logs download URL
   */
  async getJobLogs(owner: string, repo: string, jobId: number): Promise<string> {
    const response = await this.client.get(
      `/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
      { responseType: 'blob' }
    );
    
    // Create a blob URL for the logs
    const blob = new Blob([response.data]);
    return URL.createObjectURL(blob);
  }
  
  /**
   * List repository secrets (names only, not values)
   * @param owner Repository owner
   * @param repo Repository name
   * @returns List of secret names
   */
  async listRepositorySecrets(owner: string, repo: string) {
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/secrets`);
    return response.data.secrets;
  }
  
  /**
   * List repository variables
   * @param owner Repository owner
   * @param repo Repository name
   * @returns List of variables
   */
  async listRepositoryVariables(owner: string, repo: string) {
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/variables`);
    return response.data.variables;
  }
  
  /**
   * Get repository permissions for the authenticated user
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Repository permissions
   */
  async getRepositoryPermissions(owner: string, repo: string) {
    const response = await this.client.get(`/repos/${owner}/${repo}`);
    return response.data.permissions;
  }
  
  /**
   * Search repositories
   * @param query Search query
   * @param sort Sort field (stars, forks, help-wanted-issues, updated)
   * @param order Sort order (asc, desc)
   * @returns Search results
   */
  async searchRepositories(query: string, sort?: string, order?: 'asc' | 'desc') {
    const response = await this.client.get('/search/repositories', {
      params: {
        q: query,
        sort,
        order,
        per_page: 100
      }
    });
    return response.data.items;
  }
  
  /**
   * Get workflow dispatch inputs schema
   * @param owner Repository owner
   * @param repo Repository name
   * @param workflowId Workflow ID or filename
   * @returns Workflow dispatch inputs schema
   */
  async getWorkflowDispatchInputs(owner: string, repo: string, workflowId: string) {
    try {
      // First, get the workflow file content
      const workflowPath = workflowId.includes('/') 
        ? workflowId 
        : `.github/workflows/${workflowId}`;
      
      const contentResponse = await this.client.get(`/repos/${owner}/${repo}/contents/${workflowPath}`);
      const content = atob(contentResponse.data.content);
      
      // Parse the YAML to extract workflow_dispatch inputs
      // This is a simplified approach - in a real implementation, you'd use a YAML parser
      const match = content.match(/workflow_dispatch:\s*\n\s*inputs:\s*([\s\S]*?)(?:\n\s*\n|\n\s*[a-z]+:)/);
      
      if (!match) {
        return null; // No workflow_dispatch inputs found
      }
      
      // For a real implementation, parse the YAML structure properly
      // This is just a placeholder to indicate the approach
      return { rawInputsYaml: match[1] };
    } catch (error) {
      console.error('Failed to get workflow dispatch inputs:', error);
      return null;
    }
  }
  
  /**
   * Check if the client is authenticated with a valid token
   * @returns Whether the client is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token && this.token.length > 0;
  }
  
  /**
   * Get the content of a file from a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param path Path to the file
   * @returns The file content as a string
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/contents/${path}`);
      
      // GitHub API returns file content as base64 encoded string
      if (response.data.encoding === 'base64' && response.data.content) {
        return atob(response.data.content.replace(/\n/g, ''));
      }
      
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error(`Failed to get file content for ${path}:`, error);
      throw error;
    }
  }
}