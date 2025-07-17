---
inclusion: fileMatch
fileMatchPattern: 'src/services/github*'
---

# GitHub Integration Guidelines

## GitHub API Client Implementation

The GitHub API client is a critical component of the Developer Self-Service Portal, responsible for all communication with the GitHub API. This document provides guidelines for implementing the GitHub API client.

## Authentication

- Use token-based authentication with GitHub Personal Access Tokens (PATs)
- Support token validation to verify permissions before use
- Handle authentication errors gracefully with clear user feedback
- Never expose tokens in URLs, logs, or error messages

## API Client Structure

```typescript
/**
 * GitHub API client for interacting with GitHub's REST API
 */
export class GitHubApiClient {
  private readonly baseUrl: string = 'https://api.github.com';
  private readonly token: string;
  private readonly axios: AxiosInstance;

  /**
   * Create a new GitHub API client
   * @param token - GitHub personal access token
   */
  constructor(token: string) {
    this.token = token;
    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    });
    
    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      response => response,
      error => this.handleApiError(error)
    );
  }
  
  /**
   * Handle API errors with appropriate responses
   * @param error - Axios error object
   */
  private handleApiError(error: any): Promise<never> {
    // Error handling logic
    return Promise.reject(error);
  }
  
  // API methods...
}
```

## Required API Methods

Implement the following methods in the GitHub API client:

### Authentication and User

- `validateToken()`: Validate that the token is valid and has required scopes
- `getUser()`: Get information about the authenticated user
- `getUserRepositories()`: Get repositories accessible to the user

### Repositories

- `getRepository(owner: string, repo: string)`: Get repository details
- `listBranches(owner: string, repo: string)`: List branches in a repository
- `getBranch(owner: string, repo: string, branch: string)`: Get branch details

### Workflows

- `listWorkflows(owner: string, repo: string)`: List workflows in a repository
- `getWorkflow(owner: string, repo: string, id: number)`: Get workflow details
- `getWorkflowUsage(owner: string, repo: string, id: number)`: Get workflow usage statistics

### Workflow Runs

- `listWorkflowRuns(owner: string, repo: string, workflow_id: number)`: List runs for a workflow
- `getWorkflowRun(owner: string, repo: string, run_id: number)`: Get details of a workflow run
- `triggerWorkflow(owner: string, repo: string, workflow_id: number, ref: string, inputs?: Record<string, any>)`: Trigger a workflow run
- `cancelWorkflowRun(owner: string, repo: string, run_id: number)`: Cancel a workflow run
- `rerunWorkflow(owner: string, repo: string, run_id: number)`: Re-run a workflow

### Artifacts

- `listRunArtifacts(owner: string, repo: string, run_id: number)`: List artifacts for a workflow run
- `getArtifact(owner: string, repo: string, artifact_id: number)`: Get artifact details
- `downloadArtifact(owner: string, repo: string, artifact_id: number)`: Download an artifact

## Error Handling

- Implement comprehensive error handling for all API calls
- Categorize errors (authentication, permission, rate limit, network, etc.)
- Provide clear error messages for different error types
- Implement retry logic for transient errors
- Handle rate limiting with appropriate backoff strategies

## Response Typing

- Create TypeScript interfaces for all API responses
- Use proper typing for all method parameters and return values
- Document the structure of complex response objects

Example:

```typescript
interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  // Other user properties...
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  description: string | null;
  // Other repository properties...
}

interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  // Other workflow properties...
}

// More interfaces for other response types...
```

## Testing

- Create mock responses for all API endpoints
- Test error handling with simulated API failures
- Verify authentication and token validation logic
- Test retry and backoff strategies

## Security Considerations

- Never store tokens in code or commit them to version control
- Validate token scopes to ensure they have the minimum required permissions
- Handle sensitive data securely
- Implement proper error handling to avoid exposing sensitive information