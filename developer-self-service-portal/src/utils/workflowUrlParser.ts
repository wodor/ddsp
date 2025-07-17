/**
 * Utility for parsing GitHub workflow URLs and fetching their content
 */
import { GitHubApiClient } from '../services/github';
import { extractWorkflowMetadata } from './workflowParser';
import type { CatalogAction } from '../types/catalog';
import { ActionCreatorService } from '../services/actionCreator';

/**
 * Parse a GitHub workflow URL and extract the owner, repo, and path
 * @param url - The GitHub workflow URL
 * @returns The parsed URL components or null if the URL is invalid
 */
export function parseGitHubWorkflowUrl(url: string): { owner: string; repo: string; path: string } | null {
  try {
    // Handle different GitHub URL formats
    // Format 1: https://github.com/{owner}/{repo}/blob/{branch}/{path}
    // Format 2: https://github.com/{owner}/{repo}/actions/workflows/{filename}
    
    const urlObj = new URL(url);
    
    // Check if it's a GitHub URL
    if (!urlObj.hostname.includes('github.com')) {
      console.error('Not a GitHub URL');
      return null;
    }
    
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Need at least owner and repo
    if (pathParts.length < 2) {
      console.error('Invalid GitHub URL format');
      return null;
    }
    
    const owner = pathParts[0];
    const repo = pathParts[1];
    let path: string;
    
    if (pathParts.includes('actions') && pathParts.includes('workflows')) {
      // Format 2: actions/workflows URL
      const filename = pathParts[pathParts.length - 1];
      path = `.github/workflows/${filename}`;
    } else if (pathParts.includes('blob')) {
      // Format 1: blob URL
      // Remove owner, repo, and 'blob' from path
      path = pathParts.slice(3).join('/');
    } else {
      console.error('Unsupported GitHub URL format');
      return null;
    }
    
    return { owner, repo, path };
  } catch (error) {
    console.error('Failed to parse GitHub workflow URL:', error);
    return null;
  }
}

/**
 * Fetch a workflow file from GitHub and create an action from it
 * @param url - The GitHub workflow URL
 * @param githubClient - The GitHub API client
 * @returns The created action or null if fetching or parsing failed
 */
export async function createActionFromUrl(
  url: string,
  githubClient: GitHubApiClient
): Promise<CatalogAction | null> {
  try {
    // Parse the URL
    const urlComponents = parseGitHubWorkflowUrl(url);
    if (!urlComponents) {
      throw new Error('Invalid GitHub workflow URL');
    }
    
    const { owner, repo, path } = urlComponents;
    
    // Create an ActionCreator service
    const actionCreator = new ActionCreatorService(githubClient);
    
    // Create an action from the workflow file
    const action = await actionCreator.createActionFromWorkflow(owner, repo, path);
    
    return action;
  } catch (error) {
    console.error('Failed to create action from URL:', error);
    return null;
  }
}

/**
 * Fetch workflow metadata from a GitHub URL
 * @param url - The GitHub workflow URL
 * @param githubClient - The GitHub API client
 * @returns The workflow metadata or null if fetching or parsing failed
 */
export async function fetchWorkflowMetadataFromUrl(
  url: string,
  githubClient: GitHubApiClient
): Promise<ReturnType<typeof extractWorkflowMetadata> | null> {
  try {
    // Parse the URL
    const urlComponents = parseGitHubWorkflowUrl(url);
    if (!urlComponents) {
      throw new Error('Invalid GitHub workflow URL');
    }
    
    const { owner, repo, path } = urlComponents;
    
    // Fetch the workflow file content
    const workflowContent = await githubClient.getFileContent(owner, repo, path);
    
    // Extract metadata from the workflow file
    const metadata = extractWorkflowMetadata(workflowContent);
    
    return metadata;
  } catch (error) {
    console.error('Failed to fetch workflow metadata from URL:', error);
    return null;
  }
}