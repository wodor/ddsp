import React, { useState } from 'react';
import { GitHubApiClient } from '../services/github';
import { fetchWorkflowMetadataFromUrl, parseGitHubWorkflowUrl } from '../sdk/github-actions/parser';
import { generateAction, generateActionCode } from '../sdk/github-actions/generator';
import type { CatalogAction } from '../types/catalog';
import type { ActionGenerationResult } from '../sdk/github-actions/types';

/**
 * Example component showing how to use the GitHub Actions SDK
 */
const WorkflowUrlImporterExample: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [githubClient, setGithubClient] = useState<GitHubApiClient | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<ActionGenerationResult | null>(null);
  
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  
  const handleConnect = () => {
    if (token.trim()) {
      const client = new GitHubApiClient(token);
      setGithubClient(client);
    }
  };
  
  const handleGenerateCode = async () => {
    if (!githubClient || !url.trim()) {
      setError('Please enter a GitHub workflow URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    setGeneratedCode(null);
    
    try {
      // Parse the URL
      const urlComponents = parseGitHubWorkflowUrl(url);
      if (!urlComponents) {
        throw new Error('Invalid GitHub workflow URL');
      }
      
      // Fetch workflow metadata
      const metadata = await fetchWorkflowMetadataFromUrl(url, githubClient);
      if (!metadata) {
        throw new Error('Failed to fetch workflow metadata');
      }
      
      // Check if the workflow has a workflow_dispatch trigger
      if (!metadata.hasDispatchTrigger) {
        throw new Error('This workflow does not have a workflow_dispatch trigger and cannot be used as an action');
      }
      
      // Generate an action from the metadata
      const action = generateAction(metadata, urlComponents, {
        category: 'github-actions',
        featured: false
      });
      
      // Generate code for the action
      const code = generateActionCode(action);
      
      setGeneratedCode(code);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="workflow-url-importer-example">
      <h1>GitHub Action Integration Tool</h1>
      
      {!githubClient ? (
        <div className="token-form">
          <h2>Connect to GitHub</h2>
          <p>Enter your GitHub personal access token to connect to the GitHub API:</p>
          
          <div className="input-group">
            <input
              type="password"
              value={token}
              onChange={handleTokenChange}
              placeholder="GitHub Personal Access Token"
              className="token-input"
            />
            
            <button
              onClick={handleConnect}
              disabled={!token.trim()}
              className="connect-button"
            >
              Connect
            </button>
          </div>
          
          <p className="token-help">
            <small>
              Your token needs the <code>repo</code> scope to access private repositories.
            </small>
          </p>
        </div>
      ) : (
        <>
          <div className="connected-status">
            <p>✅ Connected to GitHub API</p>
            <button
              onClick={() => setGithubClient(null)}
              className="disconnect-button"
            >
              Disconnect
            </button>
          </div>
          
          <div className="url-form">
            <h2>Generate Action Code</h2>
            <p>Enter a GitHub workflow URL to generate integration code:</p>
            
            <div className="input-group">
              <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://github.com/owner/repo/actions/workflows/workflow.yml"
                className="url-input"
                disabled={loading}
              />
              
              <button
                onClick={handleGenerateCode}
                disabled={loading || !url.trim()}
                className="generate-button"
              >
                {loading ? 'Generating...' : 'Generate Code'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {generatedCode && (
            <div className="generated-code">
              <h2>Generated Code</h2>
              
              <div className="code-section">
                <h3>Action Definition</h3>
                <p>Save this to <code>src/actions/{generatedCode.action.id}.ts</code>:</p>
                <pre className="code-block">{generatedCode.actionDefinitionCode}</pre>
              </div>
              
              <div className="code-section">
                <h3>Form Component</h3>
                <p>Save this to <code>src/components/forms/{generatedCode.action.id}Form.tsx</code>:</p>
                <pre className="code-block">{generatedCode.formComponentCode}</pre>
              </div>
              
              <div className="code-section">
                <h3>Registration</h3>
                <p>Add this to your catalog registration file:</p>
                <pre className="code-block">{generatedCode.registrationCode}</pre>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="usage-instructions">
        <h2>How to Use</h2>
        <ol>
          <li>Enter your GitHub personal access token and click "Connect"</li>
          <li>Paste a GitHub workflow URL (e.g., <code>https://github.com/arbor-education/sis/actions/workflows/deploy_test_branch.yaml</code>)</li>
          <li>Click "Generate Code" to create integration code</li>
          <li>Copy the generated code to the appropriate files in your project</li>
        </ol>
        
        <h3>Supported URL Formats</h3>
        <ul>
          <li><code>https://github.com/{owner}/{repo}/actions/workflows/{filename}</code></li>
          <li><code>https://github.com/{owner}/{repo}/blob/{branch}/{path}</code></li>
        </ul>
        
        <div className="note">
          <p><strong>Note:</strong> For private repositories, your token must have the <code>repo</code> scope.</p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowUrlImporterExample;