/**
 * Utilities for parsing GitHub workflow URLs and files
 */
import { extractWorkflowMetadata } from '../../utils/workflowParser';
import type { GitHubApiClient } from '../../services/github';
import type { ParsedWorkflowUrl, WorkflowMetadata } from './types';

/**
 * Parse a GitHub workflow URL and extract the owner, repo, and path
 * @param url - The GitHub workflow URL
 * @returns The parsed URL components or null if the URL is invalid
 */
export function parseGitHubWorkflowUrl(url: string): ParsedWorkflowUrl | null {
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
 * Fetch workflow metadata from a GitHub URL
 * @param url - The GitHub workflow URL
 * @param githubClient - The GitHub API client
 * @returns The workflow metadata or null if fetching or parsing failed
 */
export async function fetchWorkflowMetadataFromUrl(
  url: string,
  githubClient: GitHubApiClient
): Promise<WorkflowMetadata | null> {
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

/**
 * Generate a unique ID from a GitHub workflow URL
 * @param url - The GitHub workflow URL
 * @returns A unique ID for the action
 */
export function generateActionIdFromUrl(url: string): string | null {
  const urlComponents = parseGitHubWorkflowUrl(url);
  if (!urlComponents) {
    return null;
  }
  
  const { owner, repo, path } = urlComponents;
  const filename = path.split('/').pop() || '';
  const basename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
  
  return `${owner}-${repo}-${basename}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
}