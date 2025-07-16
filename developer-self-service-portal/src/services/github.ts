/**
 * GitHub API client service
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';

/**
 * GitHub API client class
 */
export class GitHubApiClient {
  private client: AxiosInstance;
  
  /**
   * Create a new GitHub API client
   * @param token GitHub personal access token
   */
  constructor(token: string) {
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
      (error) => {
        // Handle API errors
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('GitHub API error:', error.response.data);
          
          // Handle rate limiting
          if (error.response.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
            console.error('GitHub API rate limit exceeded');
          }
          
          // Handle authentication errors
          if (error.response.status === 401) {
            console.error('GitHub API authentication failed');
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error('GitHub API request error:', error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('GitHub API error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
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
}